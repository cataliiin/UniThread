import uuid
from datetime import datetime, timezone
from typing import TYPE_CHECKING

from sqlalchemy import Boolean, DateTime, ForeignKey, Index, Integer, String, Text, func, text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database.models.base import Base
from app.database.models.enums import MarketplaceCategory

if TYPE_CHECKING:
    from app.database.models.university import University
    from app.database.models.user import User


def _utcnow() -> datetime:
    return datetime.now(timezone.utc)


class MarketplaceListing(Base):
    __tablename__ = "marketplace_listings"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        server_default=text("gen_random_uuid()"),
        default=uuid.uuid4,
    )
    university_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("universities.id", ondelete="CASCADE"),
        nullable=False,
    )
    author_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
    )
    title: Mapped[str] = mapped_column(String(300), nullable=False)
    description: Mapped[str] = mapped_column(Text, nullable=False)
    category: Mapped[MarketplaceCategory] = mapped_column(String(20), nullable=False)
    price: Mapped[int] = mapped_column(Integer, nullable=False)
    image_key: Mapped[str | None] = mapped_column(String(500), nullable=True)
    is_active: Mapped[bool] = mapped_column(
        Boolean, default=True, server_default=text("true"), nullable=False
    )
    is_negotiable: Mapped[bool] = mapped_column(
        Boolean, default=False, server_default=text("false"), nullable=False
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=_utcnow,
        server_default=func.now(),
        nullable=False,
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=_utcnow,
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False,
    )

    university: Mapped["University"] = relationship(
        "University", back_populates="marketplace_listings"
    )
    author: Mapped["User"] = relationship(
        "User", back_populates="marketplace_listings", foreign_keys=[author_id]
    )
    favorites: Mapped[list["MarketplaceFavorite"]] = relationship(
        "MarketplaceFavorite", back_populates="listing", cascade="all, delete-orphan"
    )

    __table_args__ = (
        Index(
            "idx_marketplace_university_active_created",
            "university_id",
            "is_active",
            text("created_at DESC"),
        ),
        Index("idx_marketplace_author", "author_id"),
        Index("idx_marketplace_price", "price"),
        Index("idx_marketplace_category", "category"),
    )

    def __repr__(self) -> str:
        return f"<MarketplaceListing id={self.id} title={self.title!r:.40}>"


class MarketplaceFavorite(Base):
    __tablename__ = "marketplace_favorites"

    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="CASCADE"),
        primary_key=True,
    )
    listing_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("marketplace_listings.id", ondelete="CASCADE"),
        primary_key=True,
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=_utcnow,
        server_default=func.now(),
        nullable=False,
    )

    user: Mapped["User"] = relationship(
        "User", back_populates="marketplace_favorites", foreign_keys=[user_id]
    )
    listing: Mapped["MarketplaceListing"] = relationship(
        "MarketplaceListing", back_populates="favorites", foreign_keys=[listing_id]
    )

    __table_args__ = (
        Index(
            "idx_marketplace_favorites_user_created",
            "user_id",
            text("created_at DESC"),
        ),
    )
