import uuid
from datetime import datetime, timezone
from typing import TYPE_CHECKING

from sqlalchemy import DateTime, ForeignKey, Index, Text, func, text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database.models.base import Base

if TYPE_CHECKING:
    from app.database.models.post import Post
    from app.database.models.user import User


def _utcnow() -> datetime:
    return datetime.now(timezone.utc)


class Comment(Base):
    __tablename__ = "comments"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        server_default=text("gen_random_uuid()"),
        default=uuid.uuid4,
    )
    post_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("posts.id", ondelete="CASCADE"),
        nullable=False,
    )
    # Preserve discussion history if a user account is removed.
    author_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="SET NULL"),
        nullable=True,
    )
    body: Mapped[str] = mapped_column(Text, nullable=False)
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

    post: Mapped["Post"] = relationship("Post", back_populates="comments")
    author: Mapped["User | None"] = relationship(
        "User", back_populates="comments", foreign_keys=[author_id]
    )

    __table_args__ = (
        Index("idx_comments_post_created", "post_id", "created_at"),
        Index(
            "idx_comments_author",
            "author_id",
            postgresql_where=text("author_id IS NOT NULL"),
        ),
    )

    def __repr__(self) -> str:
        return f"<Comment id={self.id} post_id={self.post_id}>"
