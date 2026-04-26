from uuid import UUID

from fastapi import APIRouter, status
from sqlalchemy import select

from app.core import security
from app.core.dependencies import CurrentUser, DbDep
from app.core.exceptions import InvalidPasswordException, UserNotFoundException
from app.database.models.user import User
from app.schemas.user import (
    UserChangePassword,
    UserProfileResponse,
    UserResponse,
    UserUpdateProfile,
)

router = APIRouter(prefix="/users", tags=["Users"])


@router.get("/me", response_model=UserResponse)
async def read_users_me(current_user: CurrentUser):
    """
    Get the currently logged-in user's private profile.
    """
    return current_user


@router.patch("/me", response_model=UserResponse)
async def update_user_me(
    user_in: UserUpdateProfile, current_user: CurrentUser, db: DbDep
):
    """
    Update the current user's profile (username, avatar).
    Only fields explicitly sent in the request body are updated.
    """
    update_data = user_in.model_dump(exclude_unset=True)

    for field, value in update_data.items():
        setattr(current_user, field, value)

    db.add(current_user)
    await db.commit()
    await db.refresh(current_user)
    return current_user


@router.patch("/me/password", status_code=status.HTTP_204_NO_CONTENT)
async def update_password(
    password_data: UserChangePassword, current_user: CurrentUser, db: DbDep
):
    """
    Update the current user's password.
    """
    if not security.verify_password(
        password_data.old_password, current_user.password_hash
    ):
        raise InvalidPasswordException()

    current_user.password_hash = security.get_password_hash(password_data.new_password)
    db.add(current_user)
    await db.commit()


@router.get("/{user_id}", response_model=UserProfileResponse)
async def read_user_profile(user_id: UUID, current_user: CurrentUser, db: DbDep):
    """
    Get the public profile of a specific user.
    """
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()

    if not user or user.university_id != current_user.university_id:
        raise UserNotFoundException()

    return user
