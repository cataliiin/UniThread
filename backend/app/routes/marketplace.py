from uuid import UUID

from fastapi import APIRouter, Query, status
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import aliased, selectinload

from app.core.dependencies import CurrentUser, DbDep
from app.core.exceptions import ForbiddenException, NotFoundException
from app.database.models.enums import MarketplaceCategory
from app.database.models.marketplace import MarketplaceFavorite, MarketplaceListing
from app.database.models.user import User
from app.schemas.marketplace import (
    MarketplaceListingCreate,
    MarketplaceListingResponse,
    MarketplaceListingUpdate,
)
from app.schemas.pagination import PaginatedResponse
from app.schemas.user import UserPublic

router = APIRouter(prefix="/marketplace", tags=["Marketplace"])


def build_is_favorited_expr(user_id: UUID):
    return (
        select(MarketplaceFavorite.user_id)
        .where(
            (MarketplaceFavorite.user_id == user_id)
            & (MarketplaceFavorite.listing_id == MarketplaceListing.id)
        )
        .exists()
        .label("is_favorited")
    )


def build_favorite_count_expr():
    favorite_alias = aliased(MarketplaceFavorite)
    return (
        select(func.count(favorite_alias.user_id))
        .where(favorite_alias.listing_id == MarketplaceListing.id)
        .scalar_subquery()
        .label("favorite_count")
    )


def to_marketplace_listing_response(
    listing: MarketplaceListing, *, is_favorited: bool, favorite_count: int
) -> MarketplaceListingResponse:
    return MarketplaceListingResponse(
        id=listing.id,
        university_id=listing.university_id,
        author_id=listing.author_id,
        title=listing.title,
        description=listing.description,
        category=listing.category,
        price=listing.price,
        image_key=listing.image_key,
        is_active=listing.is_active,
        is_negotiable=listing.is_negotiable,
        is_favorited=is_favorited,
        favorite_count=favorite_count,
        created_at=listing.created_at,
        updated_at=listing.updated_at,
        author=UserPublic.model_validate(listing.author),
    )


async def get_marketplace_listing_or_404(
    listing_id: UUID, current_user: User, db: AsyncSession
) -> MarketplaceListing:
    listing = await db.scalar(
        select(MarketplaceListing).where(
            (MarketplaceListing.id == listing_id)
            & (MarketplaceListing.university_id == current_user.university_id)
        )
    )
    if not listing:
        raise NotFoundException("Marketplace listing not found.")
    return listing


async def get_marketplace_listing_with_favorite_state(
    listing_id: UUID, current_user: User, db: AsyncSession
) -> tuple[MarketplaceListing, bool, int]:
    row = (
        await db.execute(
            select(
                MarketplaceListing,
                build_is_favorited_expr(current_user.id),
                build_favorite_count_expr(),
            )
            .where(
                (MarketplaceListing.id == listing_id)
                & (MarketplaceListing.university_id == current_user.university_id)
            )
            .options(selectinload(MarketplaceListing.author))
        )
    ).first()
    if not row:
        raise NotFoundException("Marketplace listing not found.")
    listing, is_favorited, favorite_count = row
    return listing, bool(is_favorited), int(favorite_count or 0)


@router.get("", response_model=PaginatedResponse[MarketplaceListingResponse])
async def list_marketplace_listings(
    current_user: CurrentUser,
    db: DbDep,
    page: int = Query(1, ge=1),
    size: int = Query(20),
    q: str | None = None,
    category: MarketplaceCategory | None = None,
    min_price: int | None = None,
    max_price: int | None = None,
    sort: str = "newest",
):
    """
    List marketplace listings for the current user's university.
    """
    actual_size = max(1, min(size, 100))
    offset = (page - 1) * actual_size

    base_query = select(MarketplaceListing).where(
        (MarketplaceListing.university_id == current_user.university_id)
        & (MarketplaceListing.is_active.is_(True))
    )

    if q:
        search_term = f"%{q}%"
        base_query = base_query.where(
            (MarketplaceListing.title.ilike(search_term))
            | (MarketplaceListing.description.ilike(search_term))
        )

    if category is not None:
        base_query = base_query.where(MarketplaceListing.category == category)

    if min_price is not None:
        base_query = base_query.where(MarketplaceListing.price >= min_price)

    if max_price is not None:
        base_query = base_query.where(MarketplaceListing.price <= max_price)

    total = await db.scalar(select(func.count()).select_from(base_query.subquery()))

    stmt = base_query.add_columns(
        build_is_favorited_expr(current_user.id),
        build_favorite_count_expr(),
    ).options(selectinload(MarketplaceListing.author))

    sort_value = sort.lower()
    if sort_value == "oldest":
        stmt = stmt.order_by(MarketplaceListing.created_at.asc(), MarketplaceListing.id.asc())
    elif sort_value == "price_asc":
        stmt = stmt.order_by(MarketplaceListing.price.asc(), MarketplaceListing.id.asc())
    elif sort_value == "price_desc":
        stmt = stmt.order_by(MarketplaceListing.price.desc(), MarketplaceListing.id.asc())
    else:
        stmt = stmt.order_by(MarketplaceListing.created_at.desc(), MarketplaceListing.id.asc())

    stmt = stmt.offset(offset).limit(actual_size)
    rows = (await db.execute(stmt)).all()

    pages = (total + actual_size - 1) // actual_size if total else 0
    return PaginatedResponse(
        items=[
            to_marketplace_listing_response(
                listing,
                is_favorited=bool(is_favorited),
                favorite_count=int(favorite_count or 0),
            )
            for listing, is_favorited, favorite_count in rows
        ],
        total=total or 0,
        page=page,
        size=actual_size,
        pages=pages,
    )


@router.get("/favorites", response_model=PaginatedResponse[MarketplaceListingResponse])
async def list_favorite_marketplace_listings(
    current_user: CurrentUser,
    db: DbDep,
    page: int = Query(1, ge=1),
    size: int = Query(20),
):
    """
    List the current user's favorited marketplace listings.
    """
    actual_size = max(1, min(size, 100))
    offset = (page - 1) * actual_size

    base_query = (
        select(MarketplaceListing)
        .join(MarketplaceFavorite, MarketplaceFavorite.listing_id == MarketplaceListing.id)
        .where(
            (MarketplaceFavorite.user_id == current_user.id)
            & (MarketplaceListing.university_id == current_user.university_id)
        )
    )
    total = await db.scalar(select(func.count()).select_from(base_query.subquery()))

    stmt = (
        select(MarketplaceListing, MarketplaceFavorite.created_at.label("favorited_at"))
        .add_columns(build_favorite_count_expr())
        .join(MarketplaceFavorite, MarketplaceFavorite.listing_id == MarketplaceListing.id)
        .where(
            (MarketplaceFavorite.user_id == current_user.id)
            & (MarketplaceListing.university_id == current_user.university_id)
        )
        .options(selectinload(MarketplaceListing.author))
        .order_by(MarketplaceFavorite.created_at.desc(), MarketplaceListing.id.asc())
        .offset(offset)
        .limit(actual_size)
    )
    rows = (await db.execute(stmt)).all()

    pages = (total + actual_size - 1) // actual_size if total else 0
    return PaginatedResponse(
        items=[
            to_marketplace_listing_response(
                listing,
                is_favorited=True,
                favorite_count=int(favorite_count or 0),
            )
            for listing, _favorited_at, favorite_count in rows
        ],
        total=total or 0,
        page=page,
        size=actual_size,
        pages=pages,
    )


@router.get("/{listing_id}", response_model=MarketplaceListingResponse)
async def get_marketplace_listing(
    listing_id: UUID, current_user: CurrentUser, db: DbDep
):
    """
    Retrieve a single marketplace listing within the current university tenant.
    """
    listing, is_favorited, favorite_count = await get_marketplace_listing_with_favorite_state(
        listing_id, current_user, db
    )
    return to_marketplace_listing_response(
        listing, is_favorited=is_favorited, favorite_count=favorite_count
    )


@router.post(
    "", response_model=MarketplaceListingResponse, status_code=status.HTTP_201_CREATED
)
async def create_marketplace_listing(
    listing_in: MarketplaceListingCreate, current_user: CurrentUser, db: DbDep
):
    """
    Create a marketplace listing scoped to the current user's university.
    """
    listing = MarketplaceListing(
        university_id=current_user.university_id,
        author_id=current_user.id,
        title=listing_in.title,
        description=listing_in.description,
        category=listing_in.category,
        price=listing_in.price,
        image_key=listing_in.image_key,
        is_negotiable=listing_in.is_negotiable,
    )
    db.add(listing)
    await db.commit()

    listing, is_favorited, favorite_count = await get_marketplace_listing_with_favorite_state(
        listing.id, current_user, db
    )
    return to_marketplace_listing_response(
        listing, is_favorited=is_favorited, favorite_count=favorite_count
    )


@router.patch("/{listing_id}", response_model=MarketplaceListingResponse)
async def update_marketplace_listing(
    listing_id: UUID,
    listing_in: MarketplaceListingUpdate,
    current_user: CurrentUser,
    db: DbDep,
):
    """
    Update a marketplace listing owned by the current user.
    """
    listing = await get_marketplace_listing_or_404(listing_id, current_user, db)

    if listing.author_id != current_user.id:
        raise ForbiddenException("You can only update your own marketplace listings.")

    update_data = listing_in.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(listing, field, value)

    db.add(listing)
    await db.commit()

    (
        refreshed_listing,
        is_favorited,
        favorite_count,
    ) = await get_marketplace_listing_with_favorite_state(listing_id, current_user, db)
    return to_marketplace_listing_response(
        refreshed_listing,
        is_favorited=is_favorited,
        favorite_count=favorite_count,
    )


@router.delete("/{listing_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_marketplace_listing(
    listing_id: UUID, current_user: CurrentUser, db: DbDep
):
    """
    Delete a marketplace listing owned by the current user.
    """
    listing = await get_marketplace_listing_or_404(listing_id, current_user, db)

    if listing.author_id != current_user.id:
        raise ForbiddenException("You can only delete your own marketplace listings.")

    await db.delete(listing)
    await db.commit()


@router.post("/{listing_id}/favorite", status_code=status.HTTP_204_NO_CONTENT)
async def favorite_marketplace_listing(
    listing_id: UUID, current_user: CurrentUser, db: DbDep
):
    """
    Favorite a marketplace listing for the current user.
    """
    await get_marketplace_listing_or_404(listing_id, current_user, db)

    existing_favorite = await db.scalar(
        select(MarketplaceFavorite).where(
            (MarketplaceFavorite.user_id == current_user.id)
            & (MarketplaceFavorite.listing_id == listing_id)
        )
    )
    if existing_favorite:
        return

    db.add(MarketplaceFavorite(user_id=current_user.id, listing_id=listing_id))
    await db.commit()


@router.delete("/{listing_id}/favorite", status_code=status.HTTP_204_NO_CONTENT)
async def unfavorite_marketplace_listing(
    listing_id: UUID, current_user: CurrentUser, db: DbDep
):
    """
    Remove a marketplace listing from the current user's favorites.
    """
    await get_marketplace_listing_or_404(listing_id, current_user, db)

    favorite = await db.scalar(
        select(MarketplaceFavorite).where(
            (MarketplaceFavorite.user_id == current_user.id)
            & (MarketplaceFavorite.listing_id == listing_id)
        )
    )
    if not favorite:
        return

    await db.delete(favorite)
    await db.commit()
