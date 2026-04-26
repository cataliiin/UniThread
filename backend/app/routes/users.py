from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select

from app.core import security
from app.core.dependencies import CurrentUser, DbDep
from app.core.exceptions import InvalidPasswordException, UserNotFoundException
from app.database.models.user import User
from app.schemas.user import UserChangePassword, UserProfileResponse, UserResponse, UserUpdateProfile

router = APIRouter(prefix="/users", tags=["Users"])

@router.get("/me", response_model=UserResponse)
async def read_users_me(current_user: CurrentUser):
    """
    Get the currently logged-in user's private profile.
    """
    return current_user

@router.patch("/me", response_model=UserResponse)
async def update_user_me(user_in: UserUpdateProfile, current_user: CurrentUser, db: DbDep):
    """
    Update the current user's profile (username, avatar).
    """
    if user_in.username is not None:
        current_user.username = user_in.username
    if user_in.avatar_key is not None:
        current_user.avatar_key = user_in.avatar_key
        
    db.add(current_user)
    await db.commit()
    await db.refresh(current_user)
    return current_user

@router.patch("/me/password", status_code=status.HTTP_204_NO_CONTENT)
async def update_password(password_data: UserChangePassword, current_user: CurrentUser, db: DbDep):
    """
    Update the current user's password.
    """
    if not security.verify_password(password_data.old_password, current_user.password_hash):
        raise InvalidPasswordException()
        
    current_user.password_hash = security.get_password_hash(password_data.new_password)
    db.add(current_user)
    await db.commit()

@router.get("/{user_id}", response_model=UserProfileResponse)
async def read_user_profile(user_id: UUID, db: DbDep):
    """
    Get the public profile of a specific user.
    """
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    
    if not user:
        raise UserNotFoundException()
        
    return user
