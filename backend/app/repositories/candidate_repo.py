"""
Data access layer for Candidate entities.
"""

from uuid import UUID

from sqlalchemy import select, func, or_
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models.candidate import Candidate


class CandidateRepository:
    """Repository for Candidate CRUD operations."""

    def __init__(self, db: AsyncSession):
        self.db = db

    async def get_by_id(self, candidate_id: UUID) -> Candidate | None:
        result = await self.db.execute(
            select(Candidate)
            .where(Candidate.id == candidate_id)
            .options(
                selectinload(Candidate.resume),
                selectinload(Candidate.interview),
                selectinload(Candidate.score),
            )
        )
        return result.scalar_one_or_none()

    async def get_by_email(self, email: str) -> Candidate | None:
        result = await self.db.execute(
            select(Candidate).where(Candidate.email == email.lower())
        )
        return result.scalar_one_or_none()

    async def list_candidates(
        self,
        created_by: UUID | None = None,
        status: str | None = None,
        search: str | None = None,
        min_score: float | None = None,
        max_score: float | None = None,
        sort_by: str = "created_at",
        sort_order: str = "desc",
        page: int = 1,
        page_size: int = 20,
    ) -> tuple[list[Candidate], int]:
        """List candidates with filtering, sorting, and pagination."""
        query = select(Candidate).options(
            selectinload(Candidate.resume),
            selectinload(Candidate.interview),
            selectinload(Candidate.score),
        )

        # Filters
        if created_by:
            query = query.where(Candidate.created_by == created_by)
        if status:
            query = query.where(Candidate.status == status)
        if search:
            query = query.where(
                or_(
                    Candidate.name.ilike(f"%{search}%"),
                    Candidate.email.ilike(f"%{search}%"),
                )
            )
        if min_score is not None:
            query = query.where(Candidate.final_score >= min_score)
        if max_score is not None:
            query = query.where(Candidate.final_score <= max_score)

        # Count total
        count_query = select(func.count()).select_from(query.subquery())
        total_result = await self.db.execute(count_query)
        total = total_result.scalar() or 0

        # Sorting
        sort_column = getattr(Candidate, sort_by, Candidate.created_at)
        if sort_order == "desc":
            query = query.order_by(sort_column.desc())
        else:
            query = query.order_by(sort_column.asc())

        # Pagination
        query = query.offset((page - 1) * page_size).limit(page_size)

        result = await self.db.execute(query)
        return list(result.scalars().all()), total

    async def create(self, candidate: Candidate) -> Candidate:
        self.db.add(candidate)
        await self.db.flush()
        await self.db.refresh(candidate)
        return candidate

    async def update(self, candidate: Candidate) -> Candidate:
        await self.db.flush()
        await self.db.refresh(candidate)
        return candidate

    async def delete(self, candidate: Candidate) -> None:
        await self.db.delete(candidate)
        await self.db.flush()

    async def get_all_for_ranking(self) -> list[Candidate]:
        """Get all candidates with scores for ranking."""
        result = await self.db.execute(
            select(Candidate)
            .where(Candidate.final_score.isnot(None))
            .options(selectinload(Candidate.score))
            .order_by(Candidate.final_score.desc())
        )
        return list(result.scalars().all())
