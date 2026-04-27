"""
Community Admin Routes
Accessible only to users with is_admin=True in a given community.
Covers: join questions, join request approvals, invite links, direct invitations.
"""

import secrets
from uuid import UUID

from fastapi import APIRouter, status
from sqlalchemy import select
from sqlalchemy.orm import selectinload

from app.core.dependencies import (
    CurrentUser,
    DbDep,
    get_community_with_tenant_check,
    require_community_admin,
)
from app.core.exceptions import (
    AlreadyCommunityMemberException,
    NotFoundException,
    UserNotFoundException,
)
from app.database.models.community import (
    CommunityInvitation,
    CommunityInviteLink,
    CommunityJoinAnswer,
    CommunityJoinQuestion,
    CommunityMember,
)
from app.database.models.enums import InvitationStatus, MemberStatus
from app.database.models.user import User
from app.schemas.community import (
    CommunityInviteLinkCreate,
    CommunityInviteLinkResponse,
    CommunityInvitationCreate,
    CommunityInvitationResponse,
    CommunityJoinAnswerResponse,
    CommunityJoinQuestionCreate,
    CommunityJoinQuestionResponse,
    CommunityJoinQuestionUpdate,
    CommunityMemberResponse,
    CommunityRoleUpdate,
    JoinRequestResponse,
)
from app.schemas.user import UserPublic

router = APIRouter(prefix="/communities", tags=["Community Admin"])


# ── Join Questions ────────────────────────────────────────────────────────────


@router.get(
    "/{community_id}/questions", response_model=list[CommunityJoinQuestionResponse]
)
async def list_join_questions(community_id: UUID, current_user: CurrentUser, db: DbDep):
    """List all join questions for a community (visible to all logged-in users so they can preview before joining)."""
    await get_community_with_tenant_check(community_id, current_user, db)
    questions = (
        (
            await db.execute(
                select(CommunityJoinQuestion)
                .where(CommunityJoinQuestion.community_id == community_id)
                .order_by(CommunityJoinQuestion.order_index)
            )
        )
        .scalars()
        .all()
    )
    return questions


@router.post(
    "/{community_id}/questions",
    response_model=CommunityJoinQuestionResponse,
    status_code=status.HTTP_201_CREATED,
)
async def create_join_question(
    community_id: UUID,
    question_in: CommunityJoinQuestionCreate,
    current_user: CurrentUser,
    db: DbDep,
):
    """Add a join question to a community (Admin only)."""
    await require_community_admin(community_id, current_user, db)
    new_q = CommunityJoinQuestion(
        community_id=community_id,
        question=question_in.question,
        is_required=question_in.is_required,
        order_index=question_in.order_index,
    )
    db.add(new_q)
    await db.commit()
    await db.refresh(new_q)
    return new_q


@router.patch(
    "/{community_id}/questions/{question_id}",
    response_model=CommunityJoinQuestionResponse,
)
async def update_join_question(
    community_id: UUID,
    question_id: UUID,
    question_in: CommunityJoinQuestionUpdate,
    current_user: CurrentUser,
    db: DbDep,
):
    """Update a join question (Admin only)."""
    await require_community_admin(community_id, current_user, db)
    q = await db.scalar(
        select(CommunityJoinQuestion).where(
            (CommunityJoinQuestion.id == question_id)
            & (CommunityJoinQuestion.community_id == community_id)
        )
    )
    if not q:
        raise NotFoundException("Join question not found.")
    for field, value in question_in.model_dump(exclude_unset=True).items():
        setattr(q, field, value)
    db.add(q)
    await db.commit()
    await db.refresh(q)
    return q


@router.delete(
    "/{community_id}/questions/{question_id}", status_code=status.HTTP_204_NO_CONTENT
)
async def delete_join_question(
    community_id: UUID,
    question_id: UUID,
    current_user: CurrentUser,
    db: DbDep,
):
    """Delete a join question (Admin only)."""
    await require_community_admin(community_id, current_user, db)
    q = await db.scalar(
        select(CommunityJoinQuestion).where(
            (CommunityJoinQuestion.id == question_id)
            & (CommunityJoinQuestion.community_id == community_id)
        )
    )
    if not q:
        raise NotFoundException("Join question not found.")
    await db.delete(q)
    await db.commit()


# ── Join Requests (Pending Members) ──────────────────────────────────────────


@router.get("/{community_id}/requests", response_model=list[JoinRequestResponse])
async def list_join_requests(community_id: UUID, current_user: CurrentUser, db: DbDep):
    """
    List all pending join requests with their submitted answers.
    Returns user info + answers in one shot to avoid N+1 on the frontend.
    """
    await require_community_admin(community_id, current_user, db)

    pending_members = (
        (
            await db.execute(
                select(CommunityMember)
                .where(
                    (CommunityMember.community_id == community_id)
                    & (CommunityMember.status == MemberStatus.pending)
                )
                .options(selectinload(CommunityMember.user))
            )
        )
        .scalars()
        .all()
    )

    user_ids = [m.user_id for m in pending_members]

    # Fetch all answers for these users for this community's questions in one go
    all_answers = []
    if user_ids:
        all_answers = (
            (
                await db.execute(
                    select(CommunityJoinAnswer)
                    .join(
                        CommunityJoinQuestion,
                        CommunityJoinAnswer.question_id == CommunityJoinQuestion.id,
                    )
                    .where(
                        (CommunityJoinQuestion.community_id == community_id)
                        & (CommunityJoinAnswer.user_id.in_(user_ids))
                    )
                )
            )
            .scalars()
            .all()
        )

    from collections import defaultdict

    answers_by_user = defaultdict(list)
    for ans in all_answers:
        answers_by_user[ans.user_id].append(ans)

    results = []
    for member in pending_members:
        results.append(
            JoinRequestResponse(
                user=UserPublic.model_validate(member.user),
                answers=[
                    CommunityJoinAnswerResponse.model_validate(a)
                    for a in answers_by_user[member.user_id]
                ],
                requested_at=member.joined_at,
            )
        )

    return results


@router.post(
    "/{community_id}/requests/{user_id}/approve", response_model=CommunityMemberResponse
)
async def approve_join_request(
    community_id: UUID,
    user_id: UUID,
    current_user: CurrentUser,
    db: DbDep,
):
    """Approve a pending join request (Admin only)."""
    await require_community_admin(community_id, current_user, db)

    member = await db.scalar(
        select(CommunityMember).where(
            (CommunityMember.community_id == community_id)
            & (CommunityMember.user_id == user_id)
            & (CommunityMember.status == MemberStatus.pending)
        )
    )
    if not member:
        raise NotFoundException("Pending join request not found.")

    member.status = MemberStatus.approved
    db.add(member)

    answers = (
        (
            await db.execute(
                select(CommunityJoinAnswer)
                .where(CommunityJoinAnswer.user_id == user_id)
                .join(
                    CommunityJoinQuestion,
                    CommunityJoinAnswer.question_id == CommunityJoinQuestion.id,
                )
                .where(CommunityJoinQuestion.community_id == community_id)
            )
        )
        .scalars()
        .all()
    )
    for answer in answers:
        await db.delete(answer)

    await db.commit()
    await db.refresh(member)
    return member


@router.post(
    "/{community_id}/requests/{user_id}/reject", status_code=status.HTTP_204_NO_CONTENT
)
async def reject_join_request(
    community_id: UUID,
    user_id: UUID,
    current_user: CurrentUser,
    db: DbDep,
):
    """Reject and delete a pending join request + submitted answers (Admin only)."""
    await require_community_admin(community_id, current_user, db)

    member = await db.scalar(
        select(CommunityMember).where(
            (CommunityMember.community_id == community_id)
            & (CommunityMember.user_id == user_id)
            & (CommunityMember.status == MemberStatus.pending)
        )
    )
    if not member:
        raise NotFoundException("Pending join request not found.")

    # Also delete their submitted answers (cleanup)
    answers = (
        (
            await db.execute(
                select(CommunityJoinAnswer)
                .where(CommunityJoinAnswer.user_id == user_id)
                .join(
                    CommunityJoinQuestion,
                    CommunityJoinAnswer.question_id == CommunityJoinQuestion.id,
                )
                .where(CommunityJoinQuestion.community_id == community_id)
            )
        )
        .scalars()
        .all()
    )

    for answer in answers:
        await db.delete(answer)

    await db.delete(member)
    await db.commit()


# ── Invite Links ──────────────────────────────────────────────────────────────


@router.get(
    "/{community_id}/invite-links", response_model=list[CommunityInviteLinkResponse]
)
async def list_invite_links(community_id: UUID, current_user: CurrentUser, db: DbDep):
    """List all active invite links for a community (Admin only)."""
    await require_community_admin(community_id, current_user, db)

    links = (
        (
            await db.execute(
                select(CommunityInviteLink).where(
                    CommunityInviteLink.community_id == community_id
                )
            )
        )
        .scalars()
        .all()
    )
    return links


@router.post(
    "/{community_id}/invite-links",
    response_model=CommunityInviteLinkResponse,
    status_code=status.HTTP_201_CREATED,
)
async def create_invite_link(
    community_id: UUID,
    link_in: CommunityInviteLinkCreate,
    current_user: CurrentUser,
    db: DbDep,
):
    """Generate a new invite link with optional expiry and max-use cap (Admin only)."""
    await require_community_admin(community_id, current_user, db)

    code = secrets.token_urlsafe(16)
    new_link = CommunityInviteLink(
        community_id=community_id,
        created_by=current_user.id,
        code=code,
        expires_at=link_in.expires_at,
        max_uses=link_in.max_uses,
    )
    db.add(new_link)
    await db.commit()
    await db.refresh(new_link)
    return new_link


@router.delete(
    "/{community_id}/invite-links/{link_id}", status_code=status.HTTP_204_NO_CONTENT
)
async def delete_invite_link(
    community_id: UUID,
    link_id: UUID,
    current_user: CurrentUser,
    db: DbDep,
):
    """Revoke and delete an invite link (Admin only)."""
    await require_community_admin(community_id, current_user, db)

    link = await db.scalar(
        select(CommunityInviteLink).where(
            (CommunityInviteLink.id == link_id)
            & (CommunityInviteLink.community_id == community_id)
        )
    )
    if not link:
        raise NotFoundException("Invite link not found.")

    await db.delete(link)
    await db.commit()


# ── Direct Invitations ────────────────────────────────────────────────────────


@router.post(
    "/{community_id}/invitations",
    response_model=CommunityInvitationResponse,
    status_code=status.HTTP_201_CREATED,
)
async def create_direct_invitation(
    community_id: UUID,
    invitation_in: CommunityInvitationCreate,
    current_user: CurrentUser,
    db: DbDep,
):
    """
    Send a direct invitation to a user (Admin only).
    The invited user will see it in their notifications and can accept or decline.
    """
    comm = await require_community_admin(community_id, current_user, db)

    # Verify target user exists
    invited_user = await db.scalar(
        select(User).where(User.id == invitation_in.invited_user)
    )
    if not invited_user:
        raise UserNotFoundException()

    if invited_user.university_id != comm.university_id:
        raise UserNotFoundException()

    # Check they are not already a member
    existing_member = await db.scalar(
        select(CommunityMember).where(
            (CommunityMember.community_id == community_id)
            & (CommunityMember.user_id == invitation_in.invited_user)
        )
    )
    if existing_member:
        raise AlreadyCommunityMemberException()

    # Check no duplicate pending invitation
    existing_invite = await db.scalar(
        select(CommunityInvitation).where(
            (CommunityInvitation.community_id == community_id)
            & (CommunityInvitation.invited_user == invitation_in.invited_user)
            & (CommunityInvitation.status == InvitationStatus.pending)
        )
    )
    if existing_invite:
        from app.core.exceptions import ConflictException

        raise ConflictException("A pending invitation for this user already exists.")

    new_invitation = CommunityInvitation(
        community_id=community_id,
        invited_by=current_user.id,
        invited_user=invitation_in.invited_user,
        status=InvitationStatus.pending,
    )
    db.add(new_invitation)
    await db.commit()
    await db.refresh(new_invitation)
    return new_invitation


@router.patch(
    "/{community_id}/members/{user_id}/role", response_model=CommunityMemberResponse
)
async def update_member_role(
    community_id: UUID,
    user_id: UUID,
    role_in: CommunityRoleUpdate,
    current_user: CurrentUser,
    db: DbDep,
):
    """
    Promote or demote a community member (Admin only).
    The owner of the community cannot be demoted.
    """
    comm = await require_community_admin(community_id, current_user, db)

    # Prevent demoting the owner
    if user_id == comm.owner_id and role_in.is_admin is False:
        from app.core.exceptions import ForbiddenException

        raise ForbiddenException("The owner of the community must remain an admin.")

    target_member = await db.scalar(
        select(CommunityMember).where(
            (CommunityMember.community_id == community_id)
            & (CommunityMember.user_id == user_id)
            & (CommunityMember.status == MemberStatus.approved)
        )
    )
    if not target_member:
        from app.core.exceptions import NotCommunityMemberException

        raise NotCommunityMemberException(
            "Target user is not an approved member of this community."
        )

    target_member.is_admin = role_in.is_admin
    db.add(target_member)
    await db.commit()
    await db.refresh(target_member)

    return target_member
