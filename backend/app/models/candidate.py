"""
SQLAlchemy ORM model for the Candidates table.

Central entity linking resumes, interviews, scores, and reports.
"""

import enum

from sqlalchemy import String, Float, Integer, ForeignKey, Enum as SAEnum
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base, UUIDMixin, TimestampMixin


class CandidateStatus(str, enum.Enum):
    """Candidate processing status."""
    PENDING = "pending"
    RESUME_UPLOADED = "resume_uploaded"
    RESUME_ANALYZED = "resume_analyzed"
    INTERVIEW_UPLOADED = "interview_uploaded"
    INTERVIEW_ANALYZED = "interview_analyzed"
    SCORED = "scored"
    REPORT_GENERATED = "report_generated"


class Recommendation(str, enum.Enum):
    """Hiring recommendation categories."""
    HIGHLY_RECOMMENDED = "highly_recommended"
    RECOMMENDED = "recommended"
    CONSIDER = "consider"
    NOT_RECOMMENDED = "not_recommended"


class Candidate(Base, UUIDMixin, TimestampMixin):
    """A candidate being evaluated."""

    __tablename__ = "candidates"

    # ── Basic Info ────────────────────────────────────────────────────────
    name: Mapped[str] = mapped_column(String(255), nullable=False, index=True)
    email: Mapped[str | None] = mapped_column(String(255), unique=True, index=True, nullable=True)
    phone: Mapped[str | None] = mapped_column(String(50), nullable=True)

    # ── Status & Scoring ─────────────────────────────────────────────────
    status: Mapped[CandidateStatus] = mapped_column(
        SAEnum(CandidateStatus, name="candidate_status"),
        default=CandidateStatus.PENDING,
        nullable=False,
    )
    final_score: Mapped[float | None] = mapped_column(Float, nullable=True)
    recommendation: Mapped[Recommendation | None] = mapped_column(
        SAEnum(Recommendation, name="recommendation"),
        nullable=True,
    )
    rank: Mapped[int | None] = mapped_column(Integer, nullable=True)

    # ── Foreign Keys ─────────────────────────────────────────────────────
    created_by: Mapped[str] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id"), nullable=False
    )

    # ── Relationships ────────────────────────────────────────────────────
    created_by_user = relationship("User", back_populates="candidates")
    resume = relationship(
        "Resume",
        back_populates="candidate",
        uselist=False,
        lazy="selectin",
        cascade="all, delete-orphan",
    )
    interview = relationship(
        "Interview",
        back_populates="candidate",
        uselist=False,
        lazy="selectin",
    )
    score = relationship(
        "Score",
        back_populates="candidate",
        uselist=False,
        lazy="selectin",
        cascade="all, delete-orphan",
    )
    reports = relationship(
        "Report",
        back_populates="candidate",
        lazy="selectin",
    )

    def __repr__(self) -> str:
        return f"<Candidate {self.name} ({self.status.value})>"