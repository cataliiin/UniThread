import uuid
from datetime import datetime
from typing import TYPE_CHECKING

from sqlalchemy import Boolean, DateTime, ForeignKey, Index, String, Text, func, text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database.models.base import Base

if TYPE_CHECKING:
    from app.database.models.community import Community
    from app.database.models.user import User
    from app.database.models.vote import Vote


class Post(Base):
    __tablename__ = "posts"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        server_default=text("gen_random_uuid()"),
        default=uuid.uuid4,
    )
    community_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("communities.id", ondelete="CASCADE"),
        nullable=False,
    )

    # NULL → anonymous post (only allowed if community.allow_anonymous = TRUE)
    # ON DELETE SET NULL: if the user deletes their account, posts remain but become anonymous
    author_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="SET NULL"),
        nullable=True,
    )

    title: Mapped[str] = mapped_column(String(300), nullable=False)
    body: Mapped[str | None] = mapped_column(
        Text, nullable=True
    )  # a post can be title + image only

    # MinIO object key — bucket: "posts"
    image_key: Mapped[str | None] = mapped_column(Text, nullable=True)

    is_anonymous: Mapped[bool] = mapped_column(
        Boolean, nullable=False, default=False, server_default="false"
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False,
    )
    # NULL if the post has never been edited
    updated_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True
    )

    # NOTE: score is NOT stored here — calculated dynamically via:
    # SELECT COALESCE(SUM(value), 0) FROM votes WHERE post_id = <id>
    # Add a materialized score column + trigger only if performance demands it (>100k votes/post).

    # --- relationships ---
    community: Mapped["Community"] = relationship("Community", back_populates="posts")
    author: Mapped["User | None"] = relationship(
        "User", back_populates="posts", foreign_keys=[author_id]
    )
    votes: Mapped[list["Vote"]] = relationship(
        "Vote", back_populates="post", cascade="all, delete-orphan"
    )

    __table_args__ = (
        # Community feed: sort by date (newest first)
        Index("idx_posts_community_new", "community_id", text("created_at DESC")),
        # Global feed: all recent posts (JOINed with communities to filter by university)
        Index("idx_posts_created_global", text("created_at DESC")),
        # Quick lookup of posts by a specific author (user profile page)
        Index(
            "idx_posts_author",
            "author_id",
            postgresql_where=text("author_id IS NOT NULL"),
        ),
    )

    def __repr__(self) -> str:
        return f"<Post id={self.id} title={self.title!r:.40}>"
