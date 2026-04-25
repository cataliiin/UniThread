import uuid
from typing import TYPE_CHECKING

from sqlalchemy import String, text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database.models.base import Base

if TYPE_CHECKING:
    from app.database.models.user import User
    from app.database.models.community import Community


class University(Base):
    __tablename__ = "universities"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        server_default=text("gen_random_uuid()"),
        default=uuid.uuid4,
    )
    name: Mapped[str] = mapped_column(String(200), unique=True, nullable=False)
    # Used at registration to auto-assign university_id:
    # if email ends with "@unitbv.ro" → this university is selected automatically.
    domain: Mapped[str] = mapped_column(String(100), unique=True, nullable=False)

    # --- relationships ---
    users: Mapped[list["User"]] = relationship("User", back_populates="university")
    communities: Mapped[list["Community"]] = relationship("Community", back_populates="university")

    def __repr__(self) -> str:
        return f"<University id={self.id} domain={self.domain!r}>"
