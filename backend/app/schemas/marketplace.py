from datetime import datetime
from typing import Annotated
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field, StringConstraints

from app.database.models.enums import MarketplaceCategory
from app.schemas.user import UserPublic

ListingTitle = Annotated[
    str, StringConstraints(strip_whitespace=True, min_length=1, max_length=300)
]
ListingDescription = Annotated[str, StringConstraints(strip_whitespace=True, min_length=1)]


class MarketplaceListingCreate(BaseModel):
    title: ListingTitle
    description: ListingDescription
    category: MarketplaceCategory
    price: int = Field(..., gt=0)
    image_key: str | None = None
    is_negotiable: bool = False


class MarketplaceListingUpdate(BaseModel):
    title: ListingTitle | None = None
    description: ListingDescription | None = None
    category: MarketplaceCategory | None = None
    price: int | None = Field(None, gt=0)
    image_key: str | None = None
    is_active: bool | None = None
    is_negotiable: bool | None = None


class MarketplaceListingResponse(BaseModel):
    id: UUID
    university_id: UUID
    author_id: UUID
    title: str
    description: str
    category: MarketplaceCategory
    price: int
    image_key: str | None
    is_active: bool
    is_negotiable: bool
    is_favorited: bool
    favorite_count: int = 0
    created_at: datetime
    updated_at: datetime
    author: UserPublic

    model_config = ConfigDict(from_attributes=True)
