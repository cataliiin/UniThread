from uuid import UUID

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.core.exceptions import ForbiddenException, PostNotFoundException
from app.database.models.comment import Comment
from app.database.models.community import Community, CommunityMember
from app.database.models.enums import CommunityType, MemberStatus
from app.database.models.post import Post
from app.database.models.user import User
from app.database.models.vote import Vote
from app.schemas.post import PostFeedResponse


def build_post_metric_subqueries(current_user_id: UUID):
    score_subq = (
        select(func.sum(Vote.value))
        .where(Vote.post_id == Post.id)
        .scalar_subquery()
        .label("score")
    )

    user_vote_subq = (
        select(Vote.value)
        .where((Vote.post_id == Post.id) & (Vote.user_id == current_user_id))
        .scalar_subquery()
        .label("user_vote")
    )

    comment_count_subq = (
        select(func.count(Comment.id))
        .where(Comment.post_id == Post.id)
        .scalar_subquery()
        .label("comment_count")
    )

    return score_subq, user_vote_subq, comment_count_subq


def to_post_feed_response(
    post: Post,
    score: int | None,
    user_vote: int | None,
    comment_count: int | None,
) -> PostFeedResponse:
    response = PostFeedResponse.model_validate(post)
    response.score = score or 0
    response.user_vote = user_vote
    response.comment_count = comment_count or 0
    return response


async def ensure_post_visible(
    post: Post | None,
    current_user: User,
    db: AsyncSession,
) -> Post:
    if not post:
        raise PostNotFoundException()

    if post.community.university_id != current_user.university_id:
        raise PostNotFoundException()

    if post.community.type == CommunityType.public:
        return post

    member = await db.scalar(
        select(CommunityMember).where(
            (CommunityMember.community_id == post.community_id)
            & (CommunityMember.user_id == current_user.id)
            & (CommunityMember.status == MemberStatus.approved)
        )
    )
    if not member:
        raise ForbiddenException("You don't have permission to view this post.")

    return post


async def get_viewable_post(
    post_id: UUID,
    current_user: User,
    db: AsyncSession,
) -> Post:
    post = await db.scalar(
        select(Post)
        .options(selectinload(Post.author), selectinload(Post.community))
        .where(Post.id == post_id)
    )
    return await ensure_post_visible(post, current_user, db)


async def user_can_moderate_community_comments(
    community: Community,
    current_user: User,
    db: AsyncSession,
) -> bool:
    if community.owner_id == current_user.id:
        return True

    admin_member = await db.scalar(
        select(CommunityMember).where(
            (CommunityMember.community_id == community.id)
            & (CommunityMember.user_id == current_user.id)
            & (CommunityMember.status == MemberStatus.approved)
            & (CommunityMember.is_admin.is_(True))
        )
    )
    return admin_member is not None
