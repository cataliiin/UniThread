"""
Invitation & Invite-Link Routes for regular users.
Covers: preview invite link, join via link, view/accept/decline direct invitations.
"""
from datetime import datetime, timezone
from uuid import UUID

from fastapi import APIRouter, status
from sqlalchemy import select
from sqlalchemy.orm import selectinload

from app.core.dependencies import CurrentUser, DbDep
from app.core.exceptions import (
    AlreadyCommunityMemberException,
    InviteLinkExpiredException,
    InviteLinkNotFoundException,
    NotFoundException,
)
from app.database.models.community import (
    Community,
    CommunityInvitation,
    CommunityInviteLink,
    CommunityMember,
)
from app.database.models.enums import InvitationStatus, MemberStatus
from app.schemas.community import (
    CommunityInvitationResponse,
    InviteLinkPreviewResponse,
    CommunityMemberResponse,
)
from app.schemas.community import CommunityPublic

router = APIRouter(tags=["Invitations"])


# ── Invite Links (public flow) ────────────────────────────────────────────────

@router.get("/invite/{code}", response_model=InviteLinkPreviewResponse)
async def preview_invite_link(code: str, current_user: CurrentUser, db: DbDep):
    """
    Preview an invite link before accepting it.
    Used by the frontend to render the 'You've been invited to...' page.
    Does NOT consume the link.
    """
    link = await db.scalar(
        select(CommunityInviteLink)
        .where(CommunityInviteLink.code == code)
        .options(selectinload(CommunityInviteLink.community))
    )
    if not link:
        raise InviteLinkNotFoundException()

    # Validate expiry and capacity without consuming
    now = datetime.now(timezone.utc)
    expired = (link.expires_at is not None and link.expires_at < now)
    maxed_out = (link.max_uses is not None and link.use_count >= link.max_uses)
    if expired or maxed_out:
        raise InviteLinkExpiredException()

    return InviteLinkPreviewResponse(
        community=CommunityPublic.model_validate(link.community),
        code=link.code,
        expires_at=link.expires_at,
    )


@router.post("/invite/{code}", response_model=CommunityMemberResponse)
async def join_via_invite_link(code: str, current_user: CurrentUser, db: DbDep):
    """
    Join a community using an invite link code.
    Validates expiry, max_uses, and duplicate membership before approving.
    """
    link = await db.scalar(
        select(CommunityInviteLink)
        .where(CommunityInviteLink.code == code)
        .options(selectinload(CommunityInviteLink.community))
    )
    if not link:
        raise InviteLinkNotFoundException()

    now = datetime.now(timezone.utc)
    expired = (link.expires_at is not None and link.expires_at < now)
    maxed_out = (link.max_uses is not None and link.use_count >= link.max_uses)
    if expired or maxed_out:
        raise InviteLinkExpiredException()

    # Check for existing membership
    existing = await db.scalar(
        select(CommunityMember).where(
            (CommunityMember.community_id == link.community_id)
            & (CommunityMember.user_id == current_user.id)
        )
    )
    if existing:
        if existing.status == MemberStatus.approved:
            raise AlreadyCommunityMemberException()
        else:
            # Upgrade pending request to approved
            existing.status = MemberStatus.approved
            link.use_count += 1
            db.add(existing)
            db.add(link)
            await db.commit()
            await db.refresh(existing)
            return existing

    # Add as approved member and increment use_count atomically
    new_member = CommunityMember(
        user_id=current_user.id,
        community_id=link.community_id,
        status=MemberStatus.approved,
        is_admin=False,
    )
    db.add(new_member)
    link.use_count += 1
    db.add(link)
    await db.commit()
    await db.refresh(new_member)

    return new_member


# ── Direct Invitations (user side) ───────────────────────────────────────────

@router.get("/me/invitations", response_model=list[CommunityInvitationResponse])
async def list_my_invitations(current_user: CurrentUser, db: DbDep):
    """
    List all pending invitations received by the current user.
    Used to populate the notifications bell in the frontend Navbar.
    """
    invitations = (
        await db.execute(
            select(CommunityInvitation).where(
                (CommunityInvitation.invited_user == current_user.id)
                & (CommunityInvitation.status == InvitationStatus.pending)
            )
        )
    ).scalars().all()
    return invitations


@router.post("/me/invitations/{invite_id}/accept", response_model=CommunityMemberResponse)
async def accept_invitation(invite_id: UUID, current_user: CurrentUser, db: DbDep):
    """
    Accept a direct invitation. Instantly approves membership.
    """
    invitation = await db.scalar(
        select(CommunityInvitation).where(
            (CommunityInvitation.id == invite_id)
            & (CommunityInvitation.invited_user == current_user.id)
            & (CommunityInvitation.status == InvitationStatus.pending)
        )
    )
    if not invitation:
        raise NotFoundException("Invitation not found or already responded to.")

    # Prevent double-join
    existing = await db.scalar(
        select(CommunityMember).where(
            (CommunityMember.community_id == invitation.community_id)
            & (CommunityMember.user_id == current_user.id)
        )
    )
    if existing:
        if existing.status == MemberStatus.approved:
            raise AlreadyCommunityMemberException()
        else:
            # Upgrade pending request to approved
            existing.status = MemberStatus.approved
            invitation.status = InvitationStatus.accepted
            db.add(existing)
            db.add(invitation)
            await db.commit()
            await db.refresh(existing)
            return existing

    new_member = CommunityMember(
        user_id=current_user.id,
        community_id=invitation.community_id,
        status=MemberStatus.approved,
        is_admin=False,
    )
    db.add(new_member)
    invitation.status = InvitationStatus.accepted
    db.add(invitation)
    await db.commit()
    await db.refresh(new_member)

    return new_member


@router.post("/me/invitations/{invite_id}/decline", status_code=status.HTTP_204_NO_CONTENT)
async def decline_invitation(invite_id: UUID, current_user: CurrentUser, db: DbDep):
    """
    Decline a direct invitation. Marks it as declined without adding the user to the community.
    """
    invitation = await db.scalar(
        select(CommunityInvitation).where(
            (CommunityInvitation.id == invite_id)
            & (CommunityInvitation.invited_user == current_user.id)
            & (CommunityInvitation.status == InvitationStatus.pending)
        )
    )
    if not invitation:
        raise NotFoundException("Invitation not found or already responded to.")

    invitation.status = InvitationStatus.declined
    db.add(invitation)
    await db.commit()
