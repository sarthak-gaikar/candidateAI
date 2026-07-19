"""
Pydantic schemas for Scoring and Ranking operations.
"""

from uuid import UUID

from pydantic import BaseModel, Field


class ScoreResponse(BaseModel):
    """Score breakdown for a candidate."""
    id: UUID
    candidate_id: UUID
    resume_score: float | None = None
    interview_score: float | None = None
    skills_match_score: float | None = None
    final_score: float | None = None
    weights: dict | None = None
    breakdown: dict | None = None
    recommendation: str | None = None

    model_config = {"from_attributes": True}


class WeightsUpdate(BaseModel):
    """Update scoring weights."""
    resume_weight: float = Field(0.35, ge=0, le=1)
    interview_weight: float = Field(0.40, ge=0, le=1)
    skills_match_weight: float = Field(0.25, ge=0, le=1)


class RankingEntry(BaseModel):
    """A single entry in the ranking leaderboard."""
    rank: int
    candidate_id: UUID
    candidate_name: str
    final_score: float
    resume_score: float | None = None
    interview_score: float | None = None
    skills_match_score: float | None = None
    recommendation: str
    status: str
