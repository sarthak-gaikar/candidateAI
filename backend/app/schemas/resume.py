"""
Pydantic schemas for Resume operations.
"""

from datetime import datetime
from uuid import UUID

from pydantic import BaseModel


class ResumeResponse(BaseModel):
    """Resume analysis results."""
    id: UUID
    candidate_id: UUID
    file_name: str
    file_type: str
    raw_text: str | None = None

    # Extracted data
    skills: list | None = None
    education: list | None = None
    experience: list | None = None
    certifications: list | None = None
    projects: list | None = None
    contact_info: dict | None = None

    # LLM analysis
    strengths: str | None = None
    weaknesses: str | None = None
    skill_summary: str | None = None
    job_fit_score: float | None = None
    overall_score: float | None = None

    analyzed_at: datetime | None = None
    created_at: datetime

    model_config = {"from_attributes": True}


class ResumeAnalysisResult(BaseModel):
    """Structured output from the LLM resume analysis."""
    name: str | None = None
    email: str | None = None
    phone: str | None = None
    skills: list[str] = []
    education: list[dict] = []
    experience: list[dict] = []
    certifications: list[str] = []
    projects: list[dict] = []
    strengths: str = ""
    weaknesses: str = ""
    skill_summary: str = ""
    job_fit_score: float = 0.0
    overall_score: float = 0.0
