from uuid import UUID

from fastapi import APIRouter, Query, status
from sqlalchemy import func, select

from app.core.dependencies import CurrentUser, DbDep
from app.core.exceptions import UserNotFoundException
from app.database.models.messaging import UserRelationship
from app.database.models.user import User
from app.schemas.messaging import BlockedUserResponse
from app.schemas.pagination import PaginatedResponse
from app.schemas.user import UserPublic

router = APIRouter(prefix="/relationships", tags=["Relationships"])


async def get_tenant_user_or_404(target_id: UUID, current_user: User, db: DbDep) -> User:
    target_user = await db.scalar(
        select(User).where(
            (User.id == target_id)
            & (User.university_id == current_user.university_id)
        )
    )
    if not target_user:
        raise UserNotFoundException()
    return target_user


async def get_relationship(
    *, user_id: UUID, target_user_id: UUID, db: DbDep
) -> UserRelationship | None:
    return await db.scalar(
        select(UserRelationship).where(
            (UserRelationship.user_id == user_id)
            & (UserRelationship.target_user_id == target_user_id)
        )
    )


async def set_relationship_state(
    *,
    current_user: User,
    target_id: UUID,
    db: DbDep,
    is_blocked: bool | None = None,
    is_muted: bool | None = None,
) -> None:
    await get_tenant_user_or_404(target_id, current_user, db)

    relationship = await get_relationship(
        user_id=current_user.id,
        target_user_id=target_id,
        db=db,
    )
    if not relationship:
        if (is_blocked is not True) and (is_muted is not True):
            return
        relationship = UserRelationship(
            user_id=current_user.id,
            target_user_id=target_id,
        )

    if is_blocked is not None:
        relationship.is_blocked = is_blocked
    if is_muted is not None:
        relationship.is_muted = is_muted

    db.add(relationship)
    await db.commit()


@router.get("/blocked", response_model=PaginatedResponse[BlockedUserResponse])
async def list_blocked_users(
    current_user: CurrentUser,
    db: DbDep,
    page: int = Query(1, ge=1),
    size: int = Query(20),
):
    """
    List users blocked by the current user within the same university tenant.
    """
    actual_size = max(1, min(size, 100))
    offset = (page - 1) * actual_size

    base_query = (
        select(UserRelationship)
        .join(User, User.id == UserRelationship.target_user_id)
        .where(
            (UserRelationship.user_id == current_user.id)
            & (UserRelationship.is_blocked.is_(True))
            & (User.university_id == current_user.university_id)
        )
    )
    total = await db.scalar(select(func.count()).select_from(base_query.subquery()))

    rows = (
        await db.execute(
            select(UserRelationship, User)
            .join(User, User.id == UserRelationship.target_user_id)
            .where(
                (UserRelationship.user_id == current_user.id)
                & (UserRelationship.is_blocked.is_(True))
                & (User.university_id == current_user.university_id)
            )
            .order_by(UserRelationship.created_at.desc(), User.id.asc())
            .offset(offset)
            .limit(actual_size)
        )
    ).all()

    pages = (total + actual_size - 1) // actual_size if total else 0
    return PaginatedResponse(
        items=[
            BlockedUserResponse(
                target_user_id=relationship.target_user_id,
                created_at=relationship.created_at,
                user=UserPublic.model_validate(user),
            )
            for relationship, user in rows
        ],
        total=total or 0,
        page=page,
        size=actual_size,
        pages=pages,
    )


@router.post("/{target_id}/block", status_code=status.HTTP_204_NO_CONTENT)
async def block_user(target_id: UUID, current_user: CurrentUser, db: DbDep):
    """
    Block a user in the current tenant.
    """
    await set_relationship_state(
        current_user=current_user,
        target_id=target_id,
        db=db,
        is_blocked=True,
    )


@router.delete("/{target_id}/block", status_code=status.HTTP_204_NO_CONTENT)
async def unblock_user(target_id: UUID, current_user: CurrentUser, db: DbDep):
    """
    Remove a block relationship if it exists.
    """
    await set_relationship_state(
        current_user=current_user,
        target_id=target_id,
        db=db,
        is_blocked=False,
    )


@router.post("/{target_id}/mute", status_code=status.HTTP_204_NO_CONTENT)
async def mute_user(target_id: UUID, current_user: CurrentUser, db: DbDep):
    """
    Mute a user in the current tenant.
    """
    await set_relationship_state(
        current_user=current_user,
        target_id=target_id,
        db=db,
        is_muted=True,
    )


@router.delete("/{target_id}/mute", status_code=status.HTTP_204_NO_CONTENT)
async def unmute_user(target_id: UUID, current_user: CurrentUser, db: DbDep):
    """
    Remove a mute relationship if it exists.
    """
    await set_relationship_state(
        current_user=current_user,
        target_id=target_id,
        db=db,
        is_muted=False,
    )
