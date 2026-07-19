"""
Pydantic schemas for Interview operations.
"""

from datetime import datetime
from uuid import UUID

from pydantic import BaseModel


class InterviewResponse(BaseModel):
    """Interview analysis results."""
    id: UUID
    candidate_id: UUID
    file_name: str
    status: str

    # Transcription
    transcript: str | None = None
    key_points: list | None = None

    # Scores
    communication_score: float | None = None
    technical_score: float | None = None
    confidence_score: float | None = None
    clarity_score: float | None = None
    problem_solving_score: float | None = None
    overall_score: float | None = None

    # Analysis
    strengths: str | None = None
    weaknesses: str | None = None
    summary: str | None = None

    error_message: str | None = None
    analyzed_at: datetime | None = None
    created_at: datetime

    model_config = {"from_attributes": True}


class InterviewAnalysisResult(BaseModel):
    """Structured output from the LLM interview analysis."""
    communication_score: float = 0.0
    technical_score: float = 0.0
    confidence_score: float = 0.0
    clarity_score: float = 0.0
    problem_solving_score: float = 0.0
    overall_score: float = 0.0
    key_points: list[str] = []
    strengths: str = ""
    weaknesses: str = ""
    summary: str = ""
