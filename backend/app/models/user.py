"""
SQLAlchemy ORM model for the Users table.

Stores recruiter accounts with role-based access control.
"""

from sqlalchemy import String, Enum as SAEnum
from sqlalchemy.orm import Mapped, mapped_column, relationship
import enum

from app.database import Base, UUIDMixin, TimestampMixin


class UserRole(str, enum.Enum):
    """Available user roles for RBAC."""
    ADMIN = "admin"
    RECRUITER = "recruiter"
    VIEWER = "viewer"


class User(Base, UUIDMixin, TimestampMixin):
    """Recruiter user account."""

    __tablename__ = "users"

    email: Mapped[str] = mapped_column(
        String(255), unique=True, index=True, nullable=False
    )
    hashed_password: Mapped[str] = mapped_column(String(255), nullable=False)
    full_name: Mapped[str] = mapped_column(String(255), nullable=False)
    role: Mapped[UserRole] = mapped_column(
        SAEnum(UserRole, name="user_role"),
        default=UserRole.RECRUITER,
        nullable=False,
    )
    is_active: Mapped[bool] = mapped_column(default=True, nullable=False)

    # ── Relationships ─────────────────────────────────────────────────────
    candidates = relationship("Candidate", back_populates="created_by_user", lazy="selectin")
    reports = relationship("Report", back_populates="generated_by_user", lazy="selectin")
    job_postings = relationship("JobPosting", back_populates="created_by_user", lazy="selectin")

    def __repr__(self) -> str:
        return f"<User {self.email} ({self.role.value})>"
