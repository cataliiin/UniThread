from uuid import UUID

from fastapi import APIRouter, status
from sqlalchemy import func, select
from sqlalchemy.orm import selectinload

from app.core.dependencies import CurrentUser, DbDep
from app.core.exceptions import (
    AlreadyCommunityMemberException,
    AnswersRequiredException,
    CommunityNameTakenException,
    CommunityNotFoundException,
    ForbiddenException,
    JoinRequestPendingException,
    NotCommunityAdminException,
    NotCommunityMemberException,
)
from app.database.models.community import (
    Community,
    CommunityJoinAnswer,
    CommunityJoinQuestion,
    CommunityMember,
)
from app.database.models.enums import CommunityType, MemberStatus
from app.database.models.post import Post
from app.database.models.vote import Vote
from app.schemas.community import (
    CommunityCreate,
    CommunityJoinRequestSchema,
    CommunityMemberResponse,
    CommunityResponse,
    CommunityUpdate,
)
from app.schemas.pagination import PaginatedResponse
from app.schemas.post import PostFeedResponse

router = APIRouter(prefix="/communities", tags=["Communities"])

@router.post("", response_model=CommunityResponse, status_code=status.HTTP_201_CREATED)
async def create_community(community_in: CommunityCreate, current_user: CurrentUser, db: DbDep):
    """
    Create a new community. The user automatically becomes the owner and admin.
    """
    # Check if name is taken in this university
    result = await db.execute(
        select(Community).where(
            (Community.name == community_in.name) & 
            (Community.university_id == current_user.university_id)
        )
    )
    if result.first():
        raise CommunityNameTakenException()
        
    new_community = Community(
        name=community_in.name,
        description=community_in.description,
        type=community_in.type,
        allow_anonymous=community_in.allow_anonymous,
        icon_key=community_in.icon_key,
        banner_key=community_in.banner_key,
        university_id=current_user.university_id,
        owner_id=current_user.id
    )
    db.add(new_community)
    await db.flush() # To get new_community.id
    
    # Add owner as admin member
    admin_member = CommunityMember(
        user_id=current_user.id,
        community_id=new_community.id,
        status=MemberStatus.approved,
        is_admin=True
    )
    db.add(admin_member)
    await db.commit()
    await db.refresh(new_community)
    
    # Build response (owner is the only member initially)
    response_data = CommunityResponse.model_validate(new_community)
    response_data.member_count = 1
    response_data.user_membership_status = MemberStatus.approved
    
    return response_data


@router.get("", response_model=PaginatedResponse[CommunityResponse])
async def list_communities(current_user: CurrentUser, db: DbDep, page: int = 1, size: int = 20):
    """
    List communities within the user's university.
    """
    offset = (page - 1) * size
    
    # Query communities in user's university
    base_query = select(Community).where(Community.university_id == current_user.university_id)
    
    total = await db.scalar(select(func.count()).select_from(base_query.subquery()))
    
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

    stmt = (
        select(Community, count_subq, status_subq)
        .where(Community.university_id == current_user.university_id)
        .offset(offset)
        .limit(size)
    )
    
    rows = (await db.execute(stmt)).all()
    
    items = []
    for comm, member_count, user_membership_status in rows:
        c_resp = CommunityResponse.model_validate(comm)
        c_resp.member_count = member_count or 0
        c_resp.user_membership_status = user_membership_status
        items.append(c_resp)
        
    pages = (total + size - 1) // size if total else 0
    return PaginatedResponse(items=items, total=total or 0, page=page, size=size, pages=pages)


@router.get("/{community_id}", response_model=CommunityResponse)
async def get_community(community_id: UUID, current_user: CurrentUser, db: DbDep):
    """
    Get details of a specific community.
    """
    comm = await db.scalar(select(Community).where(Community.id == community_id))
    if not comm:
        raise CommunityNotFoundException()
        
    count = await db.scalar(
        select(func.count(CommunityMember.user_id))
        .where((CommunityMember.community_id == comm.id) & (CommunityMember.status == MemberStatus.approved))
    )
    
    member = await db.scalar(
        select(CommunityMember)
        .where((CommunityMember.community_id == comm.id) & (CommunityMember.user_id == current_user.id))
    )
    
    c_resp = CommunityResponse.model_validate(comm)
    c_resp.member_count = count or 0
    c_resp.user_membership_status = member.status if member else None
    
    return c_resp


@router.patch("/{community_id}", response_model=CommunityResponse)
async def update_community(community_id: UUID, community_in: CommunityUpdate, current_user: CurrentUser, db: DbDep):
    """
    Update community settings (Admin only).
    """
    comm = await db.scalar(select(Community).where(Community.id == community_id))
    if not comm:
        raise CommunityNotFoundException()
        
    member = await db.scalar(
        select(CommunityMember)
        .where((CommunityMember.community_id == comm.id) & (CommunityMember.user_id == current_user.id))
    )
    
    if not member or not member.is_admin:
        raise NotCommunityAdminException()
        
    # Update fields
    update_data = community_in.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(comm, field, value)
        
    db.add(comm)
    await db.commit()
    await db.refresh(comm)
    
    return await get_community(community_id, current_user, db) # Re-fetch to get status and count


@router.delete("/{community_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_community(community_id: UUID, current_user: CurrentUser, db: DbDep):
    """
    Delete a community (Owner only).
    """
    comm = await db.scalar(select(Community).where(Community.id == community_id))
    if not comm:
        raise CommunityNotFoundException()
        
    if comm.owner_id != current_user.id:
        raise NotCommunityAdminException("Only the owner can delete the community.")
        
    await db.delete(comm)
    await db.commit()


@router.get("/{community_id}/posts", response_model=PaginatedResponse[PostFeedResponse])
async def get_community_posts(
    community_id: UUID, 
    current_user: CurrentUser, 
    db: DbDep, 
    page: int = 1, 
    size: int = 20,
    sort: str = "new"
):
    """
    Get the feed of posts for a specific community. Highly efficient join load.
    Supports sorting by 'new' (default) or 'top'.
    """
    comm = await db.scalar(select(Community).where(Community.id == community_id))
    if not comm:
        raise CommunityNotFoundException()
        
    offset = (page - 1) * size
    
    base_query = select(Post).where(Post.community_id == community_id)
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
        .where(Post.community_id == community_id)
        .options(selectinload(Post.author), selectinload(Post.community))
        .offset(offset)
        .limit(size)
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
        
    pages = (total + size - 1) // size if total else 0
    return PaginatedResponse(items=items, total=total or 0, page=page, size=size, pages=pages)

@router.post("/{community_id}/join", response_model=CommunityMemberResponse)
async def join_community(
    community_id: UUID,
    current_user: CurrentUser,
    db: DbDep,
    join_request: CommunityJoinRequestSchema | None = None,
):
    """
    Join a community. Behavior depends on community type:
    - public  → instantly approved
    - request → answers to required questions are saved, status = pending
    - invite  → rejected with clear message (must use an invite link or direct invitation)
    """
    comm = await db.scalar(select(Community).where(Community.id == community_id))
    if not comm:
        raise CommunityNotFoundException()

    existing_member = await db.scalar(
        select(CommunityMember)
        .where(
            (CommunityMember.community_id == comm.id)
            & (CommunityMember.user_id == current_user.id)
        )
    )
    if existing_member:
        if existing_member.status == MemberStatus.pending:
            raise JoinRequestPendingException()
        raise AlreadyCommunityMemberException()

    if comm.type == CommunityType.invite:
        raise ForbiddenException(
            "This community is invite-only. Use an invite link or ask an admin to invite you directly."
        )

    new_status = MemberStatus.approved if comm.type == CommunityType.public else MemberStatus.pending

    # For 'request' type: validate and save answers to required questions
    if comm.type == CommunityType.request:
        required_questions = (
            await db.execute(
                select(CommunityJoinQuestion)
                .where(
                    (CommunityJoinQuestion.community_id == comm.id)
                    & (CommunityJoinQuestion.is_required == True)  # noqa: E712
                )
            )
        ).scalars().all()

        answers_list = join_request.answers if join_request else []
        provided_answers = {a.question_id: a.answer for a in answers_list}

        for q in required_questions:
            if q.id not in provided_answers or not provided_answers[q.id].strip():
                raise AnswersRequiredException()

        # Persist all provided answers
        for answer_in in answers_list:
            db.add(
                CommunityJoinAnswer(
                    question_id=answer_in.question_id,
                    user_id=current_user.id,
                    answer=answer_in.answer,
                )
            )

    new_member = CommunityMember(
        user_id=current_user.id,
        community_id=comm.id,
        status=new_status,
        is_admin=False,
    )
    db.add(new_member)
    await db.commit()
    await db.refresh(new_member)

    return new_member


@router.post("/{community_id}/leave", status_code=status.HTTP_204_NO_CONTENT)
async def leave_community(community_id: UUID, current_user: CurrentUser, db: DbDep):
    """
    Leave a community.
    """
    comm = await db.scalar(select(Community).where(Community.id == community_id))
    if not comm:
        raise CommunityNotFoundException()
        
    member = await db.scalar(
        select(CommunityMember)
        .where((CommunityMember.community_id == comm.id) & (CommunityMember.user_id == current_user.id))
    )
    
    if not member:
        raise NotCommunityMemberException()
        
    if comm.owner_id == current_user.id:
        raise NotCommunityAdminException("The owner cannot leave the community without deleting it.")
        
    await db.delete(member)
    await db.commit()
