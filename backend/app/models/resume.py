"""
SQLAlchemy ORM model for the Resumes table.

Stores uploaded resume files and LLM-analyzed structured data.
"""

from datetime import datetime

from sqlalchemy import String, Float, Text, DateTime, ForeignKey
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base, UUIDMixin, TimestampMixin


class Resume(Base, UUIDMixin, TimestampMixin):
    """A parsed and analyzed resume linked to a candidate."""

    __tablename__ = "resumes"

    # ── File Storage ─────────────────────────────────────────────────────
    candidate_id: Mapped[str] = mapped_column(
        UUID(as_uuid=True), ForeignKey("candidates.id", ondelete="CASCADE"),
        nullable=False, unique=True,
    )
    file_path: Mapped[str] = mapped_column(String(500), nullable=False)
    file_type: Mapped[str] = mapped_column(String(10), nullable=False)  # "pdf" or "docx"
    file_name: Mapped[str] = mapped_column(String(255), nullable=False)

    # ── Raw Extracted Text ───────────────────────────────────────────────
    raw_text: Mapped[str | None] = mapped_column(Text, nullable=True)

    # ── LLM-Extracted Structured Data (stored as JSONB) ──────────────────
    parsed_data: Mapped[dict | None] = mapped_column(JSONB, nullable=True)
    skills: Mapped[list | None] = mapped_column(JSONB, nullable=True)
    education: Mapped[list | None] = mapped_column(JSONB, nullable=True)
    experience: Mapped[list | None] = mapped_column(JSONB, nullable=True)
    certifications: Mapped[list | None] = mapped_column(JSONB, nullable=True)
    projects: Mapped[list | None] = mapped_column(JSONB, nullable=True)
    contact_info: Mapped[dict | None] = mapped_column(JSONB, nullable=True)

    # ── LLM Analysis Results ─────────────────────────────────────────────
    strengths: Mapped[str | None] = mapped_column(Text, nullable=True)
    weaknesses: Mapped[str | None] = mapped_column(Text, nullable=True)
    skill_summary: Mapped[str | None] = mapped_column(Text, nullable=True)
    job_fit_score: Mapped[float | None] = mapped_column(Float, nullable=True)
    overall_score: Mapped[float | None] = mapped_column(Float, nullable=True)

    # ── Embedding for Semantic Search ────────────────────────────────────
    embedding: Mapped[list | None] = mapped_column(JSONB, nullable=True)

    # ── Timestamps ───────────────────────────────────────────────────────
    analyzed_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True
    )

    # ── Relationships ────────────────────────────────────────────────────
    candidate = relationship("Candidate", back_populates="resume")

    def __repr__(self) -> str:
        return f"<Resume {self.file_name} (score={self.overall_score})>"
