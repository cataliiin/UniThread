import uuid
from datetime import datetime

from sqlalchemy import Boolean, DateTime, ForeignKey, Index, String, Text, UniqueConstraint, func, text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database.models.base import Base
from app.database.models.enums import CommunityType, MemberStatus, InvitationStatus


class Community(Base):
    __tablename__ = "communities"

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
    owner_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="RESTRICT"),
        nullable=False,
    )
    name: Mapped[str] = mapped_column(String(100), nullable=False)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    type: Mapped[CommunityType] = mapped_column(
        String(10),  # stored as varchar, mapped to enum
        nullable=False,
        default=CommunityType.public,
        server_default=CommunityType.public.value,
    )

    # If TRUE, posts with author_id = NULL are allowed.
    # If FALSE, anonymous posts are rejected at the application layer.
    allow_anonymous: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False, server_default="false")

    # MinIO object keys — bucket: "communities"
    icon_key: Mapped[str | None] = mapped_column(Text, nullable=True)
    banner_key: Mapped[str | None] = mapped_column(Text, nullable=True)

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False,
    )

    # --- relationships ---
    university: Mapped["University"] = relationship("University", back_populates="communities")
    owner: Mapped["User"] = relationship("User", back_populates="owned_communities", foreign_keys=[owner_id])
    members: Mapped[list["CommunityMember"]] = relationship(
        "CommunityMember", back_populates="community", cascade="all, delete-orphan"
    )
    posts: Mapped[list["Post"]] = relationship(
        "Post", back_populates="community", cascade="all, delete-orphan"
    )
    invite_links: Mapped[list["CommunityInviteLink"]] = relationship(
        "CommunityInviteLink", back_populates="community", cascade="all, delete-orphan"
    )
    invitations: Mapped[list["CommunityInvitation"]] = relationship(
        "CommunityInvitation", back_populates="community", cascade="all, delete-orphan"
    )
    join_questions: Mapped[list["CommunityJoinQuestion"]] = relationship(
        "CommunityJoinQuestion", back_populates="community", cascade="all, delete-orphan"
    )

    __table_args__ = (
        # Same community name can exist at different universities
        UniqueConstraint("university_id", "name", name="uq_community_university_name"),
        # Global feed filters by university_id + type='public' frequently
        Index("idx_communities_university_type", "university_id", "type"),
    )

    def __repr__(self) -> str:
        return f"<Community id={self.id} name={self.name!r}>"


class CommunityMember(Base):
    __tablename__ = "community_members"

    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="CASCADE"),
        primary_key=True,
    )
    community_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("communities.id", ondelete="CASCADE"),
        primary_key=True,
    )

    # public  → 'approved' set automatically on join
    # request → 'pending' until admin decides
    # invite  → 'approved' set automatically after accepting invitation
    status: Mapped[MemberStatus] = mapped_column(
        String(10),
        nullable=False,
        default=MemberStatus.approved,
        server_default=MemberStatus.approved.value,
    )

    # Admin can: approve/reject join requests, toggle anonymous posts,
    # manage invite links and direct invitations
    is_admin: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False, server_default="false")

    joined_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False,
    )

    # --- relationships ---
    user: Mapped["User"] = relationship("User", back_populates="community_memberships")
    community: Mapped["Community"] = relationship("Community", back_populates="members")

    __table_args__ = (
        # Partial index: "approved communities of user X" — used by personalized feed + access checks
        Index("idx_members_user_approved", "user_id", postgresql_where=text("status = 'approved'")),
        # Admin listing all members of a community
        Index("idx_members_community", "community_id", "status"),
    )

    def __repr__(self) -> str:
        return f"<CommunityMember user_id={self.user_id} community_id={self.community_id} status={self.status}>"


class CommunityInviteLink(Base):
    __tablename__ = "community_invite_links"

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
    created_by: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="RESTRICT"),
        nullable=False,
    )
    # Randomly generated in the app via secrets.token_urlsafe(16)
    code: Mapped[str] = mapped_column(String(32), unique=True, nullable=False)

    # Optional constraints — NULL means unlimited / never expires
    expires_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    max_uses: Mapped[int | None] = mapped_column(nullable=True)
    use_count: Mapped[int] = mapped_column(nullable=False, default=0, server_default="0")

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False,
    )

    # --- relationships ---
    community: Mapped["Community"] = relationship("Community", back_populates="invite_links")
    creator: Mapped["User"] = relationship("User", back_populates="created_invite_links")

    def __repr__(self) -> str:
        return f"<CommunityInviteLink code={self.code!r} community_id={self.community_id}>"


class CommunityInvitation(Base):
    """Direct (nominal) invitation: admin explicitly invites a specific user."""

    __tablename__ = "community_invitations"

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
    invited_by: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="RESTRICT"),
        nullable=False,
    )
    invited_user: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
    )
    status: Mapped[InvitationStatus] = mapped_column(
        String(10),
        nullable=False,
        default=InvitationStatus.pending,
        server_default=InvitationStatus.pending.value,
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False,
    )

    # --- relationships ---
    community: Mapped["Community"] = relationship("Community", back_populates="invitations")
    inviter: Mapped["User"] = relationship("User", back_populates="sent_invitations", foreign_keys=[invited_by])
    invited_user_obj: Mapped["User"] = relationship(
        "User", back_populates="received_invitations", foreign_keys=[invited_user]
    )

    __table_args__ = (
        # A user cannot be invited twice to the same community
        UniqueConstraint("community_id", "invited_user", name="uq_invitation_community_user"),
        # "pending invitations for user X" — used by notification queries
        Index(
            "idx_invitations_user_pending",
            "invited_user",
            postgresql_where=text("status = 'pending'"),
        ),
    )

    def __repr__(self) -> str:
        return f"<CommunityInvitation id={self.id} status={self.status}>"


class CommunityJoinQuestion(Base):
    """Questions the admin defines; a user must answer them before submitting a join request."""

    __tablename__ = "community_join_questions"

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
    question: Mapped[str] = mapped_column(String(300), nullable=False)
    is_required: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True, server_default="true")
    # Controls display order in the join form
    order_index: Mapped[int] = mapped_column(nullable=False, default=0, server_default="0")

    # --- relationships ---
    community: Mapped["Community"] = relationship("Community", back_populates="join_questions")
    answers: Mapped[list["CommunityJoinAnswer"]] = relationship(
        "CommunityJoinAnswer", back_populates="question", cascade="all, delete-orphan"
    )

    __table_args__ = (
        Index("idx_join_questions_community", "community_id", "order_index"),
    )

    def __repr__(self) -> str:
        return f"<CommunityJoinQuestion id={self.id} community_id={self.community_id}>"


class CommunityJoinAnswer(Base):
    """User's answers submitted alongside a join request."""

    __tablename__ = "community_join_answers"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        server_default=text("gen_random_uuid()"),
        default=uuid.uuid4,
    )
    question_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("community_join_questions.id", ondelete="CASCADE"),
        nullable=False,
    )
    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
    )
    answer: Mapped[str] = mapped_column(Text, nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False,
    )

    # --- relationships ---
    question: Mapped["CommunityJoinQuestion"] = relationship("CommunityJoinQuestion", back_populates="answers")
    user: Mapped["User"] = relationship("User", back_populates="join_answers")

    __table_args__ = (
        # A user can answer each question only once
        UniqueConstraint("question_id", "user_id", name="uq_join_answer_question_user"),
        Index("idx_join_answers_user", "user_id"),
    )

    def __repr__(self) -> str:
        return f"<CommunityJoinAnswer question_id={self.question_id} user_id={self.user_id}>"
