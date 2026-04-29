from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field


class VoteBase(BaseModel):
    value: int = Field(..., ge=-1, le=1)  # -1 or 1 (maybe 0 to clear?)


class VoteCreate(VoteBase):
    pass  # post_id will be in the URL


class VoteUpdate(VoteBase):
    pass


class VoteResponse(VoteBase):
    user_id: UUID
    post_id: UUID
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)
