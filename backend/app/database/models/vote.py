import uuid
from datetime import datetime
from typing import TYPE_CHECKING

from sqlalchemy import CheckConstraint, DateTime, ForeignKey, Index, SmallInteger, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database.models.base import Base

if TYPE_CHECKING:
    from app.database.models.user import User
    from app.database.models.post import Post


class Vote(Base):
    """
    Dedicated votes table enables:
    - Enforce one vote per user per post via composite primary key (user_id, post_id)
    - Efficient score calculation: SELECT SUM(value) FROM votes WHERE post_id = ? (fast with index)
    """
    __tablename__ = "votes"

    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="CASCADE"),
        primary_key=True,
    )
    post_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("posts.id", ondelete="CASCADE"),
        primary_key=True,
    )

    # +1 = upvote, -1 = downvote. Composite PK guarantees one vote per user per post.
    # To change a vote: UPDATE value (not a DELETE + INSERT).
    value: Mapped[int] = mapped_column(
        SmallInteger,
        nullable=False,
    )

    # Timestamp for when the vote was cast. Useful for analytics and potential future features.
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False,
    )

    # --- relationships ---
    user: Mapped["User"] = relationship("User", back_populates="votes")
    post: Mapped["Post"] = relationship("Post", back_populates="votes")

    __table_args__ = (
        CheckConstraint("value IN (1, -1)", name="ck_vote_value"),
        # Score calculation: SUM aggregation on this index
        Index("idx_votes_post", "post_id"),
    )

    def __repr__(self) -> str:
        return (
            f"<Vote user_id={self.user_id} post_id={self.post_id} value={self.value}>"
        )
