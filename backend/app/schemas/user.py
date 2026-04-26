from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, ConfigDict, EmailStr, Field


# --- Shared / Embedded Schemas ---
class UserPublic(BaseModel):
    """Schema used when embedding user data in posts, comments, etc."""

    id: UUID
    username: str
    avatar_key: str | None
    university_id: UUID

    model_config = ConfigDict(from_attributes=True)


# --- Create & Update ---
class UserCreate(BaseModel):
    username: str = Field(..., min_length=3, max_length=50)
    email: EmailStr
    password: str = Field(..., min_length=8)


class UserUpdateProfile(BaseModel):
    """Only for updating non-critical profile info."""

    username: str | None = Field(None, min_length=3, max_length=50)
    avatar_key: str | None = None


class UserChangePassword(BaseModel):
    old_password: str
    new_password: str = Field(..., min_length=8)


# --- Responses ---
class UserProfileResponse(UserPublic):
    """Schema for viewing another user's profile (safe, no email)."""

    created_at: datetime
    # We can add dynamic fields later like:
    # post_count: int = 0
    # community_count: int = 0


class UserResponse(UserProfileResponse):
    """Full user schema for the /users/me endpoint (includes private data)."""

    email: EmailStr
