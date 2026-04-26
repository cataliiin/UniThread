from pydantic import BaseModel

from app.schemas.user import UserProfileResponse
from app.schemas.community import CommunityResponse
from app.schemas.post import PostFeedResponse

class GlobalSearchResponse(BaseModel):
    users: list[UserProfileResponse]
    communities: list[CommunityResponse]
    posts: list[PostFeedResponse]
