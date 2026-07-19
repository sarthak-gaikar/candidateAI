"""
SQLAlchemy ORM model for the Interviews table.

Stores video interview files, transcripts, and LLM analysis.
"""

import enum
from datetime import datetime

from sqlalchemy import String, Float, Text, DateTime, ForeignKey, Enum as SAEnum
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base, UUIDMixin, TimestampMixin


class InterviewStatus(str, enum.Enum):
    """Interview processing pipeline status."""
    UPLOADED = "uploaded"
    EXTRACTING_AUDIO = "extracting_audio"
    TRANSCRIBING = "transcribing"
    ANALYZING = "analyzing"
    COMPLETED = "completed"
    FAILED = "failed"


class Interview(Base, UUIDMixin, TimestampMixin):
    """A video interview linked to a candidate."""

    __tablename__ = "interviews"

    # ── File Storage ─────────────────────────────────────────────────────
    candidate_id: Mapped[str] = mapped_column(
        UUID(as_uuid=True), ForeignKey("candidates.id", ondelete="CASCADE"),
        nullable=False, unique=True,
    )
    video_path: Mapped[str] = mapped_column(String(500), nullable=False)
    audio_path: Mapped[str | None] = mapped_column(String(500), nullable=True)
    file_name: Mapped[str] = mapped_column(String(255), nullable=False)

    # ── Transcription ────────────────────────────────────────────────────
    transcript: Mapped[str | None] = mapped_column(Text, nullable=True)
    key_points: Mapped[list | None] = mapped_column(JSONB, nullable=True)

    # ── LLM Analysis Scores (0-100) ──────────────────────────────────────
    communication_score: Mapped[float | None] = mapped_column(Float, nullable=True)
    technical_score: Mapped[float | None] = mapped_column(Float, nullable=True)
    confidence_score: Mapped[float | None] = mapped_column(Float, nullable=True)
    clarity_score: Mapped[float | None] = mapped_column(Float, nullable=True)
    problem_solving_score: Mapped[float | None] = mapped_column(Float, nullable=True)
    overall_score: Mapped[float | None] = mapped_column(Float, nullable=True)

    # ── LLM Analysis Text ────────────────────────────────────────────────
    strengths: Mapped[str | None] = mapped_column(Text, nullable=True)
    weaknesses: Mapped[str | None] = mapped_column(Text, nullable=True)
    summary: Mapped[str | None] = mapped_column(Text, nullable=True)

    # ── Processing Status ────────────────────────────────────────────────
    status: Mapped[InterviewStatus] = mapped_column(
        SAEnum(InterviewStatus, name="interview_status"),
        default=InterviewStatus.UPLOADED,
        nullable=False,
    )
    error_message: Mapped[str | None] = mapped_column(Text, nullable=True)

    # ── Timestamps ───────────────────────────────────────────────────────
    analyzed_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True
    )

    # ── Relationships ────────────────────────────────────────────────────
    candidate = relationship("Candidate", back_populates="interview")

    def __repr__(self) -> str:
        return f"<Interview {self.file_name} ({self.status.value})>"
