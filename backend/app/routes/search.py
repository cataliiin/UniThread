from fastapi import APIRouter
from sqlalchemy import func, select
from sqlalchemy.orm import selectinload

from app.core.dependencies import CurrentUser, DbDep
from app.database.models.community import Community, CommunityMember
from app.database.models.enums import MemberStatus, CommunityType
from app.database.models.post import Post
from app.database.models.user import User
from app.database.models.vote import Vote
from app.schemas.community import CommunityResponse
from app.schemas.post import PostFeedResponse
from app.schemas.search import GlobalSearchResponse
from app.schemas.user import UserProfileResponse

router = APIRouter(prefix="/search", tags=["Search"])

@router.get("", response_model=GlobalSearchResponse)
async def global_search(
    q: str, 
    current_user: CurrentUser, 
    db: DbDep, 
    type: str | None = None,
    limit: int = 5
):
    """
    Perform a global case-insensitive search (ILIKE) across users, communities, and posts.
    Results are limited to the user's university to maintain context.
    If 'type' is provided (e.g., 'users', 'communities', 'posts'), only that entity is queried.
    """
    if not q or len(q) < 2:
        return GlobalSearchResponse(users=[], communities=[], posts=[])
        
    # Prevent extreme limits
    actual_limit = max(1, min(limit, 50))
    search_type = type.lower() if type else None
    
    # Escape wildcards to prevent users from bypassing length checks with '%'
    escaped_q = q.replace("\\", "\\\\").replace("%", "\\%").replace("_", "\\_")
    search_term = f"%{escaped_q}%"
    
    user_results = []
    comm_results = []
    post_results = []
    
    # 1. Search Users
    if search_type is None or search_type == "users":
        users_stmt = (
            select(User)
            .where(
                (User.university_id == current_user.university_id) & 
                (User.username.ilike(search_term, escape="\\"))
            )
            .limit(actual_limit)
        )
        users = (await db.execute(users_stmt)).scalars().all()
        user_results = [UserProfileResponse.model_validate(u) for u in users]
    
    # 2. Search Communities
    if search_type is None or search_type == "communities":
        count_subq = (
            select(func.count(CommunityMember.user_id))
            .where((CommunityMember.community_id == Community.id) & (CommunityMember.status == MemberStatus.approved))
            .scalar_subquery()
            .label("member_count")
        )
        
        status_subq = (
            select(CommunityMember.status)
            .where((CommunityMember.community_id == Community.id) & (CommunityMember.user_id == current_user.id))
            .scalar_subquery()
            .label("user_membership_status")
        )

        comm_stmt = (
            select(Community, count_subq, status_subq)
            .where(
                (Community.university_id == current_user.university_id) & 
                ((Community.name.ilike(search_term, escape="\\")) | (Community.description.ilike(search_term, escape="\\")))
            )
            .limit(actual_limit)
        )
        
        comm_rows = (await db.execute(comm_stmt)).all()
        for comm, member_count, user_membership_status in comm_rows:
            c_resp = CommunityResponse.model_validate(comm)
            c_resp.member_count = member_count or 0
            c_resp.user_membership_status = user_membership_status
            comm_results.append(c_resp)
        
    # 3. Search Posts
    if search_type is None or search_type == "posts":
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

        post_stmt = (
            select(Post, score_subq, user_vote_subq)
            .join(Community, Post.community_id == Community.id)
            .outerjoin(
                CommunityMember, 
                (CommunityMember.community_id == Community.id) & (CommunityMember.user_id == current_user.id)
            )
            .where(
                (Community.university_id == current_user.university_id) & 
                ((Post.title.ilike(search_term, escape="\\")) | (Post.body.ilike(search_term, escape="\\"))) &
                (
                    (Community.type == CommunityType.public) |
                    (CommunityMember.status == MemberStatus.approved)
                )
            )
            .order_by(Post.created_at.desc())
            .options(selectinload(Post.author), selectinload(Post.community))
            .limit(actual_limit)
        )
        
        post_rows = (await db.execute(post_stmt)).all()
        for p, score, user_vote in post_rows:
            p_resp = PostFeedResponse.model_validate(p)
            p_resp.score = score or 0
            p_resp.user_vote = user_vote
            post_results.append(p_resp)
        
    return GlobalSearchResponse(
        users=user_results,
        communities=comm_results,
        posts=post_results
    )
