"""
Data access layer for Resume entities.
"""

from uuid import UUID

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.resume import Resume


class ResumeRepository:
    """Repository for Resume CRUD operations."""

    def __init__(self, db: AsyncSession):
        self.db = db

    async def get_by_id(self, resume_id: UUID) -> Resume | None:
        result = await self.db.execute(
            select(Resume).where(Resume.id == resume_id)
        )
        return result.scalar_one_or_none()

    async def get_by_candidate_id(self, candidate_id: UUID) -> Resume | None:
        result = await self.db.execute(
            select(Resume).where(Resume.candidate_id == candidate_id)
        )
        return result.scalar_one_or_none()

    async def create(self, resume: Resume) -> Resume:
        self.db.add(resume)
        await self.db.flush()
        await self.db.refresh(resume)
        return resume

    async def update(self, resume: Resume) -> Resume:
        await self.db.flush()
        await self.db.refresh(resume)
        return resume

    async def get_all_embeddings(self) -> list[Resume]:
        """Get all resumes with embeddings for similarity search."""
        result = await self.db.execute(
            select(Resume).where(Resume.embedding.isnot(None))
        )
        return list(result.scalars().all())

    async def delete(self, resume: Resume) -> None:
        """Delete a resume entity."""
        await self.db.delete(resume)
        await self.db.flush()
