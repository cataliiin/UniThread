from collections.abc import AsyncGenerator
from typing import Annotated
from uuid import UUID

from fastapi import Depends, HTTPException, Request, status
from jose import JWTError, jwt
from minio import Minio
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import config
from app.core.exceptions import (
    CommunityNotFoundException,
    ForbiddenException,
    NotCommunityAdminException,
)
from app.database.models import User
from app.database.models.community import Community, CommunityMember
from app.database.models.enums import MemberStatus
from app.database.session import AsyncSessionLocal
from app.core.storage import minio_client


async def get_db() -> AsyncGenerator[AsyncSession, None]:
    async with AsyncSessionLocal() as session:
        yield session


DbDep = Annotated[AsyncSession, Depends(get_db)]


async def get_token_from_cookie(request: Request) -> str:
    token = request.cookies.get("access_token")
    if not token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Not authenticated",
        )
    return token


async def get_current_user(
    token: Annotated[str, Depends(get_token_from_cookie)],
    db: DbDep,
) -> User:
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
    )

    try:
        payload = jwt.decode(
            token, config.JWT_SECRET_KEY, algorithms=[config.JWT_ALGORITHM]
        )
        user_id_raw: str | None = payload.get("sub")
        if user_id_raw is None:
            raise credentials_exception
        user_id = UUID(user_id_raw)
    except (JWTError, ValueError, TypeError):
        raise credentials_exception

    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()

    if user is None:
        raise credentials_exception

    return user


CurrentUser = Annotated[User, Depends(get_current_user)]


def get_storage() -> Minio:
    return minio_client


StorageDep = Annotated[Minio, Depends(get_storage)]


async def get_community_with_tenant_check(
    community_id: UUID,
    current_user: User,
    db: AsyncSession,
) -> Community:
    community = await db.scalar(
        select(Community).where(
            (Community.id == community_id)
            & (Community.university_id == current_user.university_id)
        )
    )
    if not community:
        raise CommunityNotFoundException()
    return community


async def require_approved_member(
    community_id: UUID,
    current_user: User,
    db: AsyncSession,
    *,
    allow_owner: bool = True,
) -> CommunityMember | None:
    community = await get_community_with_tenant_check(community_id, current_user, db)

    if allow_owner and community.owner_id == current_user.id:
        return await db.scalar(
            select(CommunityMember).where(
                (CommunityMember.community_id == community_id)
                & (CommunityMember.user_id == current_user.id)
            )
        )

    member = await db.scalar(
        select(CommunityMember).where(
            (CommunityMember.community_id == community_id)
            & (CommunityMember.user_id == current_user.id)
            & (CommunityMember.status == MemberStatus.approved)
        )
    )
    if not member:
        raise ForbiddenException("You don't have permission to access this community.")
    return member


async def require_community_admin(
    community_id: UUID,
    current_user: User,
    db: AsyncSession,
) -> Community:
    community = await get_community_with_tenant_check(community_id, current_user, db)

    if community.owner_id == current_user.id:
        return community

    member = await db.scalar(
        select(CommunityMember).where(
            (CommunityMember.community_id == community_id)
            & (CommunityMember.user_id == current_user.id)
            & (CommunityMember.status == MemberStatus.approved)
        )
    )
    if not member or not member.is_admin:
        raise NotCommunityAdminException()

    return community
