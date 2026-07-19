"""
Data access layer for Report entities.
"""

from uuid import UUID

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.report import Report


class ReportRepository:
    """Repository for Report CRUD operations."""

    def __init__(self, db: AsyncSession):
        self.db = db

    async def get_by_id(self, report_id: UUID) -> Report | None:
        result = await self.db.execute(
            select(Report).where(Report.id == report_id)
        )
        return result.scalar_one_or_none()

    async def get_by_candidate_id(self, candidate_id: UUID) -> list[Report]:
        result = await self.db.execute(
            select(Report)
            .where(Report.candidate_id == candidate_id)
            .order_by(Report.created_at.desc())
        )
        return list(result.scalars().all())

    async def list_all(self, generated_by: UUID | None = None) -> list[Report]:
        query = select(Report).order_by(Report.created_at.desc())
        if generated_by:
            query = query.where(Report.generated_by == generated_by)
        result = await self.db.execute(query)
        return list(result.scalars().all())

    async def create(self, report: Report) -> Report:
        self.db.add(report)
        await self.db.flush()
        await self.db.refresh(report)
        return report
