from uuid import UUID

from fastapi import APIRouter, Query, status
from sqlalchemy import func, select
from sqlalchemy.orm import selectinload

from app.core.dependencies import CurrentUser, DbDep, require_approved_member
from app.core.exceptions import (
    CommentNotFoundException,
    CommunityNotFoundException,
    ForbiddenException,
    NotCommunityMemberException,
    NotPostAuthorException,
    PostNotFoundException,
)
from app.core.post_access import (
    build_post_metric_subqueries,
    ensure_post_visible,
    get_viewable_post,
    to_post_feed_response,
    user_can_moderate_community_comments,
)
from app.database.models.comment import Comment
from app.database.models.community import CommunityMember, Community
from app.database.models.enums import MemberStatus, CommunityType
from app.database.models.post import Post
from app.database.models.vote import Vote
from app.schemas.comment import CommentCreate, CommentResponse
from app.schemas.pagination import PaginatedResponse
from app.schemas.post import PostCreate, PostFeedResponse, PostResponse, PostUpdate
from app.schemas.vote import VoteCreate

router = APIRouter(prefix="/posts", tags=["Posts"])


@router.get("", response_model=PaginatedResponse[PostFeedResponse])
async def get_global_feed(
    current_user: CurrentUser,
    db: DbDep,
    page: int = Query(1, ge=1),
    size: int = Query(20),
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

    score_subq, user_vote_subq, comment_count_subq = build_post_metric_subqueries(
        current_user.id
    )

    stmt = (
        select(Post, score_subq, user_vote_subq, comment_count_subq)
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
    for post, score, user_vote, comment_count in rows:
        items.append(
            to_post_feed_response(post, score, user_vote, comment_count)
        )

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
    community = await db.scalar(
        select(Community).where(
            (Community.id == post_in.community_id)
            & (Community.university_id == current_user.university_id)
        )
    )
    if not community:
        raise CommunityNotFoundException()

    # Verify membership
    member = await db.scalar(
        select(CommunityMember).where(
            (CommunityMember.community_id == community.id)
            & (CommunityMember.user_id == current_user.id)
        )
    )
    if not member or member.status != MemberStatus.approved:
        raise NotCommunityMemberException()

    if post_in.is_anonymous and not community.allow_anonymous:
        raise ForbiddenException("This community does not allow anonymous posts.")

    new_post = Post(
        title=post_in.title,
        body=post_in.body,
        image_key=post_in.image_key,
        community_id=community.id,
        author_id=current_user.id,
        is_anonymous=post_in.is_anonymous,
    )
    db.add(new_post)
    await db.commit()
    await db.refresh(new_post)

    return new_post


@router.get("/{post_id}/comments", response_model=list[CommentResponse])
async def list_post_comments(post_id: UUID, current_user: CurrentUser, db: DbDep):
    """
    Get comments for a post in chronological order.
    """
    post = await get_viewable_post(post_id, current_user, db)

    stmt = (
        select(Comment)
        .where(Comment.post_id == post.id)
        .options(selectinload(Comment.author))
        .order_by(Comment.created_at.asc(), Comment.id.asc())
    )
    comments = (await db.execute(stmt)).scalars().all()
    return [CommentResponse.model_validate(comment) for comment in comments]


@router.post(
    "/{post_id}/comments",
    response_model=CommentResponse,
    status_code=status.HTTP_201_CREATED,
)
async def create_post_comment(
    post_id: UUID,
    comment_in: CommentCreate,
    current_user: CurrentUser,
    db: DbDep,
):
    """
    Create a new comment on a visible post.
    """
    post = await get_viewable_post(post_id, current_user, db)
    await require_approved_member(post.community_id, current_user, db)

    comment = Comment(
        post_id=post.id,
        author_id=current_user.id,
        body=comment_in.body,
    )
    db.add(comment)
    await db.commit()

    created_comment = await db.scalar(
        select(Comment)
        .options(selectinload(Comment.author))
        .where(Comment.id == comment.id)
    )
    return created_comment


@router.delete(
    "/{post_id}/comments/{comment_id}",
    status_code=status.HTTP_204_NO_CONTENT,
)
async def delete_post_comment(
    post_id: UUID,
    comment_id: UUID,
    current_user: CurrentUser,
    db: DbDep,
):
    """
    Delete a comment as its author or as a community admin.
    """
    post = await get_viewable_post(post_id, current_user, db)
    comment = await db.scalar(
        select(Comment).where(
            (Comment.id == comment_id) & (Comment.post_id == post.id)
        )
    )
    if not comment:
        raise CommentNotFoundException()

    if comment.author_id != current_user.id:
        can_moderate = await user_can_moderate_community_comments(
            post.community, current_user, db
        )
        if not can_moderate:
            raise ForbiddenException("You don't have permission to delete this comment.")

    await db.delete(comment)
    await db.commit()


@router.get("/{post_id}", response_model=PostFeedResponse)
async def get_post(post_id: UUID, current_user: CurrentUser, db: DbDep):
    """
    Get a single post by its ID. Perfect for deep-linking.
    """
    score_subq, user_vote_subq, comment_count_subq = build_post_metric_subqueries(
        current_user.id
    )

    stmt = (
        select(Post, score_subq, user_vote_subq, comment_count_subq)
        .where(Post.id == post_id)
        .options(selectinload(Post.author), selectinload(Post.community))
    )
    row = (await db.execute(stmt)).first()

    if not row:
        raise PostNotFoundException()

    post, score, user_vote, comment_count = row
    await ensure_post_visible(post, current_user, db)
    return to_post_feed_response(post, score, user_vote, comment_count)


@router.patch("/{post_id}", response_model=PostResponse)
async def update_post(
    post_id: UUID, post_in: PostUpdate, current_user: CurrentUser, db: DbDep
):
    """
    Update a post's content (Author only).
    """
    post = await db.scalar(
        select(Post).options(selectinload(Post.community)).where(Post.id == post_id)
    )
    if not post or post.community.university_id != current_user.university_id:
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
    post = await db.scalar(
        select(Post).options(selectinload(Post.community)).where(Post.id == post_id)
    )
    if not post or post.community.university_id != current_user.university_id:
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
    await get_viewable_post(post_id, current_user, db)

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
