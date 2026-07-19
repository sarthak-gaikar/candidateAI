"""
Pydantic schemas for Candidate operations.
"""

from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, EmailStr, Field


class CandidateCreate(BaseModel):
    """Create a new candidate."""
    name: str = Field(..., min_length=1, max_length=255)
    email: EmailStr | None = None
    phone: str | None = Field(None, max_length=50)


class CandidateUpdate(BaseModel):
    """Update candidate info."""
    name: str | None = Field(None, max_length=255)
    email: EmailStr | None = None
    phone: str | None = Field(None, max_length=50)


class CandidateListResponse(BaseModel):
    """Candidate summary for list views."""
    id: UUID
    name: str
    email: str | None = None
    phone: str | None = None
    status: str
    final_score: float | None = None
    recommendation: str | None = None
    rank: int | None = None
    created_at: datetime

    model_config = {"from_attributes": True}


class CandidateDetailResponse(CandidateListResponse):
    """Full candidate detail with nested analysis data."""
    resume_score: float | None = None
    interview_score: float | None = None
    skills: list | None = None
    education: list | None = None
    experience: list | None = None
    certifications: list | None = None
    strengths: str | None = None
    weaknesses: str | None = None
    updated_at: datetime

    model_config = {"from_attributes": True}


class CandidateListParams(BaseModel):
    """Query parameters for candidate listing."""
    page: int = Field(1, ge=1)
    page_size: int = Field(20, ge=1, le=100)
    sort_by: str = "created_at"
    sort_order: str = "desc"
    status: str | None = None
    search: str | None = None
    min_score: float | None = Field(None, ge=0, le=100)
    max_score: float | None = Field(None, ge=0, le=100)
    skills: list[str] | None = None
