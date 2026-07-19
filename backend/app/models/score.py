"""
SQLAlchemy ORM model for the Scores table.

Stores the weighted composite score and recommendation for each candidate.
"""

from datetime import datetime

from sqlalchemy import String, Float, DateTime, ForeignKey, Enum as SAEnum
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base, UUIDMixin
from app.models.candidate import Recommendation


class Score(Base, UUIDMixin):
    """Weighted composite score and recommendation for a candidate."""

    __tablename__ = "scores"

    candidate_id: Mapped[str] = mapped_column(
        UUID(as_uuid=True), ForeignKey("candidates.id", ondelete="CASCADE"),
        nullable=False, unique=True,
    )

    # ── Individual Scores (0-100) ────────────────────────────────────────
    resume_score: Mapped[float | None] = mapped_column(Float, nullable=True)
    interview_score: Mapped[float | None] = mapped_column(Float, nullable=True)
    skills_match_score: Mapped[float | None] = mapped_column(Float, nullable=True)

    # ── Composite ────────────────────────────────────────────────────────
    final_score: Mapped[float | None] = mapped_column(Float, nullable=True)
    weights: Mapped[dict | None] = mapped_column(JSONB, nullable=True)
    breakdown: Mapped[dict | None] = mapped_column(JSONB, nullable=True)

    # ── Recommendation ───────────────────────────────────────────────────
    recommendation: Mapped[Recommendation | None] = mapped_column(
        SAEnum(Recommendation, name="recommendation", create_constraint=False),
        nullable=True,
    )

    # ── Timestamps ───────────────────────────────────────────────────────
    calculated_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True
    )

    # ── Relationships ────────────────────────────────────────────────────
    candidate = relationship("Candidate", back_populates="score")

    def __repr__(self) -> str:
        return f"<Score candidate={self.candidate_id} final={self.final_score}>"
