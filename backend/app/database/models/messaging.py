import uuid
from datetime import datetime, timezone
from typing import TYPE_CHECKING

from sqlalchemy import Boolean, DateTime, ForeignKey, Index, Text, func, text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database.models.base import Base

if TYPE_CHECKING:
    from app.database.models.user import User


def _utcnow() -> datetime:
    return datetime.now(timezone.utc)


class Message(Base):
    __tablename__ = "messages"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        server_default=text("gen_random_uuid()"),
        default=uuid.uuid4,
    )
    sender_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
    )
    recipient_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
    )
    content: Mapped[str] = mapped_column(Text, nullable=False)
    is_read: Mapped[bool] = mapped_column(
        Boolean,
        default=False,
        server_default=text("false"),
        nullable=False,
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=_utcnow,
        server_default=func.now(),
        nullable=False,
    )

    sender: Mapped["User"] = relationship(
        "User",
        back_populates="sent_messages",
        foreign_keys=[sender_id],
    )
    recipient: Mapped["User"] = relationship(
        "User",
        back_populates="received_messages",
        foreign_keys=[recipient_id],
    )

    __table_args__ = (
        Index(
            "idx_messages_sender_recipient_created",
            "sender_id",
            "recipient_id",
            text("created_at DESC"),
        ),
        Index(
            "idx_messages_recipient_sender_created",
            "recipient_id",
            "sender_id",
            text("created_at DESC"),
        ),
        Index(
            "idx_messages_recipient_read_created",
            "recipient_id",
            "is_read",
            text("created_at DESC"),
        ),
    )


class UserRelationship(Base):
    __tablename__ = "user_relationships"

    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="CASCADE"),
        primary_key=True,
    )
    target_user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="CASCADE"),
        primary_key=True,
    )
    is_blocked: Mapped[bool] = mapped_column(
        Boolean,
        default=False,
        server_default=text("false"),
        nullable=False,
    )
    is_muted: Mapped[bool] = mapped_column(
        Boolean,
        default=False,
        server_default=text("false"),
        nullable=False,
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=_utcnow,
        server_default=func.now(),
        nullable=False,
    )

    user: Mapped["User"] = relationship(
        "User",
        back_populates="outgoing_relationships",
        foreign_keys=[user_id],
    )
    target_user: Mapped["User"] = relationship(
        "User",
        back_populates="incoming_relationships",
        foreign_keys=[target_user_id],
    )

    __table_args__ = (
        Index(
            "idx_user_relationships_user_blocked_created",
            "user_id",
            "is_blocked",
            text("created_at DESC"),
        ),
        Index(
            "idx_user_relationships_target_blocked",
            "target_user_id",
            "is_blocked",
        ),
        Index(
            "idx_user_relationships_user_muted",
            "user_id",
            "is_muted",
        ),
    )
