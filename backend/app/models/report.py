"""
SQLAlchemy ORM model for the Reports table.

Stores generated recruiter reports and their export files.
"""

from sqlalchemy import String, ForeignKey
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base, UUIDMixin, TimestampMixin


class Report(Base, UUIDMixin, TimestampMixin):
    """A generated evaluation report for a candidate."""

    __tablename__ = "reports"

    candidate_id: Mapped[str] = mapped_column(
        UUID(as_uuid=True), ForeignKey("candidates.id", ondelete="CASCADE"),
        nullable=False,
    )
    generated_by: Mapped[str] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id"),
        nullable=False,
    )

    # ── Report Content ───────────────────────────────────────────────────
    content: Mapped[dict] = mapped_column(JSONB, nullable=False)
    format: Mapped[str] = mapped_column(String(10), nullable=False, default="pdf")
    file_path: Mapped[str | None] = mapped_column(String(500), nullable=True)

    # ── Relationships ────────────────────────────────────────────────────
    candidate = relationship("Candidate", back_populates="reports")
    generated_by_user = relationship("User", back_populates="reports")

    def __repr__(self) -> str:
        return f"<Report candidate={self.candidate_id} format={self.format}>"
