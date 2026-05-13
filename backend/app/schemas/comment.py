from datetime import datetime
from typing import Annotated
from uuid import UUID

from pydantic import BaseModel, ConfigDict, StringConstraints

from app.schemas.user import UserPublic

CommentBody = Annotated[str, StringConstraints(min_length=1, strip_whitespace=True)]


class CommentCreate(BaseModel):
    body: CommentBody


class CommentResponse(BaseModel):
    id: UUID
    post_id: UUID
    author_id: UUID | None
    body: str
    created_at: datetime
    updated_at: datetime
    author: UserPublic | None = None

    model_config = ConfigDict(from_attributes=True)
