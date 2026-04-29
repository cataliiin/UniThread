import uuid
from datetime import datetime
from typing import TYPE_CHECKING

from sqlalchemy import DateTime, ForeignKey, Index, String, Text, func, text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database.models.base import Base

if TYPE_CHECKING:
    from app.database.models.university import University
    from app.database.models.community import (
        Community,
        CommunityJoinAnswer,
        CommunityMember,
        CommunityInvitation,
        CommunityInviteLink,
    )
    from app.database.models.post import Post
    from app.database.models.vote import Vote


class User(Base):
    __tablename__ = "users"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        server_default=text("gen_random_uuid()"),
        default=uuid.uuid4,
    )
    university_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("universities.id", ondelete="RESTRICT"),
        nullable=False,
    )
    email: Mapped[str] = mapped_column(String(255), unique=True, nullable=False)
    username: Mapped[str] = mapped_column(String(50), unique=True, nullable=False)
    password_hash: Mapped[str] = mapped_column(Text, nullable=False)

    # MinIO object key — bucket: "profile-pictures". NULL = use default avatar.
    avatar_key: Mapped[str | None] = mapped_column(Text, nullable=True)

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False,
    )

    # --- relationships ---
    university: Mapped["University"] = relationship(
        "University", back_populates="users"
    )
    owned_communities: Mapped[list["Community"]] = relationship(
        "Community", back_populates="owner", foreign_keys="Community.owner_id"
    )
    community_memberships: Mapped[list["CommunityMember"]] = relationship(
        "CommunityMember", back_populates="user", cascade="all, delete-orphan"
    )
    posts: Mapped[list["Post"]] = relationship(
        "Post", back_populates="author", foreign_keys="Post.author_id"
    )
    votes: Mapped[list["Vote"]] = relationship(
        "Vote", back_populates="user", cascade="all, delete-orphan"
    )
    sent_invitations: Mapped[list["CommunityInvitation"]] = relationship(
        "CommunityInvitation",
        back_populates="inviter",
        foreign_keys="CommunityInvitation.invited_by",
        passive_deletes=True,
    )
    received_invitations: Mapped[list["CommunityInvitation"]] = relationship(
        "CommunityInvitation",
        back_populates="invited_user_obj",
        foreign_keys="CommunityInvitation.invited_user",
        passive_deletes=True,
    )
    created_invite_links: Mapped[list["CommunityInviteLink"]] = relationship(
        "CommunityInviteLink", back_populates="creator", passive_deletes=True
    )
    join_answers: Mapped[list["CommunityJoinAnswer"]] = relationship(
        "CommunityJoinAnswer", back_populates="user", cascade="all, delete-orphan"
    )

    __table_args__ = (Index("idx_users_university", "university_id"),)

    def __repr__(self) -> str:
        return f"<User id={self.id} username={self.username!r}>"
