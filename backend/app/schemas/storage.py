from enum import Enum
from pydantic import BaseModel

class BucketName(str, Enum):
    user_assets = "user-assets"
    community_assets = "community-assets"
    post_assets = "post-assets"

class PresignedUrlRequest(BaseModel):
    bucket_name: BucketName

class PresignedUrlResponse(BaseModel):
    url: str
    file_key: str
