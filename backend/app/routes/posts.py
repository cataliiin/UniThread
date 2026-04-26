from uuid import UUID

from fastapi import APIRouter, status
from sqlalchemy import func, select
from sqlalchemy.orm import selectinload

from app.core.dependencies import CurrentUser, DbDep
from app.core.exceptions import (
    NotCommunityMemberException,
    NotPostAuthorException,
    PostNotFoundException,
    ForbiddenException,
)
from app.database.models.community import CommunityMember, Community
from app.database.models.enums import MemberStatus, CommunityType
from app.database.models.post import Post
from app.database.models.vote import Vote
from app.schemas.pagination import PaginatedResponse
from app.schemas.post import PostCreate, PostFeedResponse, PostResponse, PostUpdate
from app.schemas.vote import VoteCreate

router = APIRouter(prefix="/posts", tags=["Posts"])


@router.get("", response_model=PaginatedResponse[PostFeedResponse])
async def get_global_feed(
    current_user: CurrentUser,
    db: DbDep,
    page: int = 1,
    size: int = 20,
    sort: str = "new",
):
    """
    Get the global feed of posts for the current user's university.
    Supports sorting by 'new' (default) or 'top'.
    """
    actual_size = max(1, min(size, 100))
    offset = (page - 1) * actual_size

    # Exclude posts from non-public communities unless the user is an approved member

    base_query = (
        select(Post)
        .join(Community, Post.community_id == Community.id)
        .outerjoin(
            CommunityMember,
            (CommunityMember.community_id == Community.id)
            & (CommunityMember.user_id == current_user.id),
        )
        .where(
            (Community.university_id == current_user.university_id)
            & (
                (Community.type == CommunityType.public)
                | (CommunityMember.status == MemberStatus.approved)
            )
        )
    )

    total = await db.scalar(select(func.count()).select_from(base_query.subquery()))

    score_subq = (
        select(func.sum(Vote.value))
        .where(Vote.post_id == Post.id)
        .scalar_subquery()
        .label("score")
    )

    user_vote_subq = (
        select(Vote.value)
        .where((Vote.post_id == Post.id) & (Vote.user_id == current_user.id))
        .scalar_subquery()
        .label("user_vote")
    )

    stmt = (
        select(Post, score_subq, user_vote_subq)
        .join(Community, Post.community_id == Community.id)
        .outerjoin(
            CommunityMember,
            (CommunityMember.community_id == Community.id)
            & (CommunityMember.user_id == current_user.id),
        )
        .where(
            (Community.university_id == current_user.university_id)
            & (
                (Community.type == CommunityType.public)
                | (CommunityMember.status == MemberStatus.approved)
            )
        )
        .options(selectinload(Post.author), selectinload(Post.community))
        .offset(offset)
        .limit(actual_size)
    )

    if sort.lower() == "top":
        stmt = stmt.order_by(score_subq.desc().nulls_last(), Post.created_at.desc())
    else:
        stmt = stmt.order_by(Post.created_at.desc())

    rows = (await db.execute(stmt)).all()

    items = []
    for p, score, user_vote in rows:
        p_resp = PostFeedResponse.model_validate(p)
        p_resp.score = score or 0
        p_resp.user_vote = user_vote
        items.append(p_resp)

    pages = (total + actual_size - 1) // actual_size if total else 0
    return PaginatedResponse(
        items=items,
        total=total or 0,
        page=page,
        size=actual_size,
        pages=pages,
    )


@router.post("", response_model=PostResponse, status_code=status.HTTP_201_CREATED)
async def create_post(post_in: PostCreate, current_user: CurrentUser, db: DbDep):
    """
    Create a new post in a specific community.
    """
    # Verify membership
    member = await db.scalar(
        select(CommunityMember).where(
            (CommunityMember.community_id == post_in.community_id)
            & (CommunityMember.user_id == current_user.id)
        )
    )
    if not member or member.status != MemberStatus.approved:
        raise NotCommunityMemberException()

    if post_in.is_anonymous and not member.community.allow_anonymous:
        raise ForbiddenException("This community does not allow anonymous posts.")

    new_post = Post(
        title=post_in.title,
        body=post_in.body,
        image_key=post_in.image_key,
        community_id=post_in.community_id,
        author_id=current_user.id,
        is_anonymous=post_in.is_anonymous,
    )
    db.add(new_post)
    await db.commit()
    await db.refresh(new_post)

    return new_post


@router.get("/{post_id}", response_model=PostFeedResponse)
async def get_post(post_id: UUID, current_user: CurrentUser, db: DbDep):
    """
    Get a single post by its ID. Perfect for deep-linking.
    """
    score_subq = (
        select(func.sum(Vote.value))
        .where(Vote.post_id == Post.id)
        .scalar_subquery()
        .label("score")
    )

    user_vote_subq = (
        select(Vote.value)
        .where((Vote.post_id == Post.id) & (Vote.user_id == current_user.id))
        .scalar_subquery()
        .label("user_vote")
    )

    stmt = (
        select(Post, score_subq, user_vote_subq)
        .where(Post.id == post_id)
        .options(selectinload(Post.author), selectinload(Post.community))
    )
    row = (await db.execute(stmt)).first()

    if not row:
        raise PostNotFoundException()

    post, score, user_vote = row

    if post.community.university_id != current_user.university_id:
        raise PostNotFoundException()

    if post.community.type != CommunityType.public:
        member = await db.scalar(
            select(CommunityMember).where(
                (CommunityMember.community_id == post.community_id)
                & (CommunityMember.user_id == current_user.id)
            )
        )
        if not member or member.status != MemberStatus.approved:
            raise ForbiddenException("You don't have permission to view this post.")

    p_resp = PostFeedResponse.model_validate(post)
    p_resp.score = score or 0
    p_resp.user_vote = user_vote

    return p_resp


@router.patch("/{post_id}", response_model=PostResponse)
async def update_post(
    post_id: UUID, post_in: PostUpdate, current_user: CurrentUser, db: DbDep
):
    """
    Update a post's content (Author only).
    """
    post = await db.scalar(select(Post).where(Post.id == post_id))
    if not post:
        raise PostNotFoundException()

    if post.author_id != current_user.id:
        raise NotPostAuthorException()

    update_data = post_in.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(post, field, value)

    db.add(post)
    await db.commit()
    await db.refresh(post)

    return post


@router.delete("/{post_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_post(post_id: UUID, current_user: CurrentUser, db: DbDep):
    """
    Delete a post (Author only).
    """
    post = await db.scalar(select(Post).where(Post.id == post_id))
    if not post:
        raise PostNotFoundException()

    # In a real app, community admins can also delete
    if post.author_id != current_user.id:
        raise NotPostAuthorException()

    await db.delete(post)
    await db.commit()


@router.post("/{post_id}/vote", response_model=PostFeedResponse)
async def vote_post(
    post_id: UUID, vote_in: VoteCreate, current_user: CurrentUser, db: DbDep
):
    """
    Upvote or downvote a post. Returns the updated post with the new score.
    """
    post = await db.scalar(
        select(Post).options(selectinload(Post.community)).where(Post.id == post_id)
    )
    if not post or post.community.university_id != current_user.university_id:
        raise PostNotFoundException()

    if post.community.type != CommunityType.public:
        member = await db.scalar(
            select(CommunityMember).where(
                (CommunityMember.community_id == post.community_id)
                & (CommunityMember.user_id == current_user.id)
            )
        )
        if not member or member.status != MemberStatus.approved:
            raise ForbiddenException(
                "You don't have permission to interact with this post."
            )

    existing_vote = await db.scalar(
        select(Vote).where(
            (Vote.post_id == post_id) & (Vote.user_id == current_user.id)
        )
    )

    if existing_vote:
        if vote_in.value == 0:
            await db.delete(existing_vote)
        else:
            existing_vote.value = vote_in.value
            db.add(existing_vote)
    else:
        if vote_in.value != 0:
            new_vote = Vote(
                user_id=current_user.id, post_id=post_id, value=vote_in.value
            )
            db.add(new_vote)

    await db.commit()

    # Return the updated post
    return await get_post(post_id, current_user, db)
