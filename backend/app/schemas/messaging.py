from datetime import datetime
from typing import Annotated
from uuid import UUID

from pydantic import BaseModel, ConfigDict, StringConstraints

from app.schemas.user import UserPublic

MessageContent = Annotated[str, StringConstraints(strip_whitespace=True, min_length=1)]


class MessageCreate(BaseModel):
    content: MessageContent


class MessageResponse(BaseModel):
    id: UUID
    sender_id: UUID
    recipient_id: UUID
    content: str
    is_read: bool
    created_at: datetime
    sender: UserPublic
    recipient: UserPublic

    model_config = ConfigDict(from_attributes=True)


class BlockedUserResponse(BaseModel):
    target_user_id: UUID
    created_at: datetime
    user: UserPublic

    model_config = ConfigDict(from_attributes=True)
