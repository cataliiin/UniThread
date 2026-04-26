from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field

from app.database.models.enums import CommunityType, InvitationStatus, MemberStatus


# --- Shared / Embedded Schemas ---
class CommunityPublic(BaseModel):
    """Schema used when embedding community data in posts or feeds."""
    id: UUID
    name: str
    icon_key: str | None
    type: CommunityType

    model_config = ConfigDict(from_attributes=True)


# --- Community ---
class CommunityBase(BaseModel):
    name: str = Field(..., min_length=3, max_length=100)
    description: str | None = None
    type: CommunityType = CommunityType.public
    allow_anonymous: bool = False
    icon_key: str | None = None
    banner_key: str | None = None


class CommunityCreate(CommunityBase):
    pass  # university_id will be injected from current_user


class CommunityUpdate(BaseModel):
    name: str | None = Field(None, min_length=3, max_length=100)
    description: str | None = None
    type: CommunityType | None = None
    allow_anonymous: bool | None = None
    icon_key: str | None = None
    banner_key: str | None = None


class CommunityResponse(CommunityBase):
    id: UUID
    university_id: UUID
    owner_id: UUID
    created_at: datetime
    
    # Virtual fields populated by queries
    member_count: int = 0
    # Crucial for the UI: is the current user a member, pending, or not in this community?
    user_membership_status: MemberStatus | None = None

    model_config = ConfigDict(from_attributes=True)


# ... (Other community schemas remain mostly similar but let's redefine them cleanly)

class CommunityMemberResponse(BaseModel):
    user_id: UUID
    community_id: UUID
    status: MemberStatus
    is_admin: bool
    joined_at: datetime

    model_config = ConfigDict(from_attributes=True)


class CommunityMemberUpdate(BaseModel):
    status: MemberStatus | None = None
    is_admin: bool | None = None


class CommunityInviteLinkCreate(BaseModel):
    expires_at: datetime | None = None
    max_uses: int | None = Field(None, gt=0)


class CommunityInviteLinkResponse(BaseModel):
    id: UUID
    community_id: UUID
    created_by: UUID
    code: str
    expires_at: datetime | None
    max_uses: int | None
    use_count: int
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class CommunityInvitationCreate(BaseModel):
    invited_user: UUID


class CommunityInvitationResponse(BaseModel):
    id: UUID
    community_id: UUID
    invited_by: UUID
    invited_user: UUID
    status: InvitationStatus
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class CommunityJoinQuestionBase(BaseModel):
    question: str = Field(..., min_length=5, max_length=300)
    is_required: bool = True
    order_index: int = 0


class CommunityJoinQuestionCreate(CommunityJoinQuestionBase):
    pass


class CommunityJoinQuestionUpdate(BaseModel):
    question: str | None = Field(None, min_length=5, max_length=300)
    is_required: bool | None = None
    order_index: int | None = None


class CommunityJoinQuestionResponse(CommunityJoinQuestionBase):
    id: UUID
    community_id: UUID

    model_config = ConfigDict(from_attributes=True)


class CommunityJoinAnswerCreate(BaseModel):
    question_id: UUID
    answer: str = Field(..., min_length=1)


class CommunityJoinAnswerResponse(BaseModel):
    id: UUID
    question_id: UUID
    user_id: UUID
    answer: str
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)
