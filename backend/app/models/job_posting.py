"""
SQLAlchemy ORM model for the Job Postings table.

Stores job requirements that candidates are matched against.
"""

import enum

from sqlalchemy import String, Integer, Text, ForeignKey, Enum as SAEnum
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base, UUIDMixin, TimestampMixin


class JobStatus(str, enum.Enum):
    """Job posting status."""
    ACTIVE = "active"
    CLOSED = "closed"
    DRAFT = "draft"


class JobPosting(Base, UUIDMixin, TimestampMixin):
    """A job posting with requirements for candidate matching."""

    __tablename__ = "job_postings"

    created_by: Mapped[str] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id"), nullable=False
    )

    title: Mapped[str] = mapped_column(String(255), nullable=False)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    required_skills: Mapped[list | None] = mapped_column(JSONB, nullable=True)
    preferred_skills: Mapped[list | None] = mapped_column(JSONB, nullable=True)
    min_experience_years: Mapped[int | None] = mapped_column(Integer, nullable=True)
    required_education: Mapped[list | None] = mapped_column(JSONB, nullable=True)
    status: Mapped[JobStatus] = mapped_column(
        SAEnum(JobStatus, name="job_status"),
        default=JobStatus.ACTIVE,
        nullable=False,
    )

    # ── Relationships ────────────────────────────────────────────────────
    created_by_user = relationship("User", back_populates="job_postings")

    def __repr__(self) -> str:
        return f"<JobPosting {self.title} ({self.status.value})>"
