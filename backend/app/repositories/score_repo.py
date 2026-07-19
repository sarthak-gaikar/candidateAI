"""
Data access layer for Score entities.
"""

from uuid import UUID

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.score import Score


class ScoreRepository:
    """Repository for Score CRUD operations."""

    def __init__(self, db: AsyncSession):
        self.db = db

    async def get_by_candidate_id(self, candidate_id: UUID) -> Score | None:
        result = await self.db.execute(
            select(Score).where(Score.candidate_id == candidate_id)
        )
        return result.scalar_one_or_none()

    async def create(self, score: Score) -> Score:
        self.db.add(score)
        await self.db.flush()
        await self.db.refresh(score)
        return score

    async def update(self, score: Score) -> Score:
        await self.db.flush()
        await self.db.refresh(score)
        return score

    async def upsert(self, score: Score) -> Score:
        """Create or update a score."""
        existing = await self.get_by_candidate_id(score.candidate_id)
        if existing:
            existing.resume_score = score.resume_score
            existing.interview_score = score.interview_score
            existing.skills_match_score = score.skills_match_score
            existing.final_score = score.final_score
            existing.weights = score.weights
            existing.breakdown = score.breakdown
            existing.recommendation = score.recommendation
            existing.calculated_at = score.calculated_at
            return await self.update(existing)
        return await self.create(score)
