from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field, model_validator

from app.schemas.community import CommunityPublic
from app.schemas.user import UserPublic


class PostBase(BaseModel):
    title: str = Field(..., min_length=1, max_length=300)
    body: str | None = None
    image_key: str | None = None


class PostCreate(PostBase):
    community_id: UUID
    is_anonymous: bool = False


class PostUpdate(BaseModel):
    title: str | None = Field(None, min_length=1, max_length=300)
    body: str | None = None
    image_key: str | None = None


class PostResponse(PostBase):
    id: UUID
    community_id: UUID
    author_id: UUID | None
    created_at: datetime
    updated_at: datetime | None
    is_anonymous: bool

    model_config = ConfigDict(from_attributes=True)

    @model_validator(mode="after")
    def mask_author(self):
        if self.is_anonymous:
            self.author_id = None
        return self


class PostFeedResponse(PostResponse):
    """
    Rich response schema used for feeds.
    Includes nested relationships to avoid N+1 queries on the frontend.
    """

    author: UserPublic | None = None

    @model_validator(mode="after")
    def mask_author_feed(self):
        if self.is_anonymous:
            self.author_id = None
            self.author = None
        return self

    community: CommunityPublic

    # Aggregated/Dynamic fields
    score: int = 0
    user_vote: int | None = None  # 1 for upvote, -1 for downvote, None for no vote
    comment_count: int = 0  # Crucial for UI engagement metrics

    model_config = ConfigDict(from_attributes=True)
