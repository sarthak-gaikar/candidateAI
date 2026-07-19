"""
Data access layer for Interview entities.
"""

from uuid import UUID

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.interview import Interview


class InterviewRepository:
    """Repository for Interview CRUD operations."""

    def __init__(self, db: AsyncSession):
        self.db = db

    async def get_by_id(self, interview_id: UUID) -> Interview | None:
        result = await self.db.execute(
            select(Interview).where(Interview.id == interview_id)
        )
        return result.scalar_one_or_none()

    async def get_by_candidate_id(self, candidate_id: UUID) -> Interview | None:
        result = await self.db.execute(
            select(Interview).where(Interview.candidate_id == candidate_id)
        )
        return result.scalar_one_or_none()

    async def create(self, interview: Interview) -> Interview:
        self.db.add(interview)
        await self.db.flush()
        await self.db.refresh(interview)
        return interview

    async def update(self, interview: Interview) -> Interview:
        await self.db.flush()
        await self.db.refresh(interview)
        return interview
