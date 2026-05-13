from datetime import datetime
from typing import Annotated
from uuid import UUID

from pydantic import BaseModel, ConfigDict, EmailStr, Field, StringConstraints

NameStr = Annotated[str, StringConstraints(strip_whitespace=True, min_length=1, max_length=100)]


# --- Shared / Embedded Schemas ---
class UserPublic(BaseModel):
    """Schema used when embedding user data in posts, comments, etc."""

    id: UUID
    username: str
    first_name: str | None
    last_name: str | None
    avatar_key: str | None
    university_id: UUID

    model_config = ConfigDict(from_attributes=True)


# --- Create & Update ---
class UserCreate(BaseModel):
    username: str = Field(
        ...,
        min_length=3,
        max_length=50,
        pattern=r"^[a-zA-Z0-9_.-]+$",
    )
    email: EmailStr
    password: str = Field(..., min_length=8)
    first_name: NameStr | None = None
    last_name: NameStr | None = None


class UserUpdateProfile(BaseModel):
    """Only for updating non-critical profile info."""

    username: str | None = Field(
        None,
        min_length=3,
        max_length=50,
        pattern=r"^[a-zA-Z0-9_.-]+$",
    )
    first_name: NameStr | None = None
    last_name: NameStr | None = None
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
