"""
Candidate service — business logic for candidate management.
"""

from uuid import UUID

from sqlalchemy.ext.asyncio import AsyncSession

from app.models.candidate import Candidate, CandidateStatus
from app.repositories.candidate_repo import CandidateRepository
from app.schemas.candidate import CandidateCreate, CandidateUpdate


class CandidateService:
    """Business logic for candidate CRUD operations."""

    def __init__(self, db: AsyncSession):
        self.repo = CandidateRepository(db)

    async def create_candidate(self, data: CandidateCreate, created_by: UUID) -> Candidate:
        """Create a new candidate."""
        if data.email:
            existing = await self.repo.get_by_email(data.email)
            if existing:
                raise ValueError("A candidate with this email already exists.")

        candidate = Candidate(
            name=data.name,
            email=data.email,
            phone=data.phone,
            status=CandidateStatus.PENDING,
            created_by=created_by,
        )
        return await self.repo.create(candidate)

    async def get_candidate(self, candidate_id: UUID) -> Candidate:
        """Get a candidate by ID."""
        candidate = await self.repo.get_by_id(candidate_id)
        if not candidate:
            raise ValueError("Candidate not found.")
        return candidate

    async def update_candidate(self, candidate_id: UUID, data: CandidateUpdate) -> Candidate:
        """Update candidate info."""
        candidate = await self.repo.get_by_id(candidate_id)
        if not candidate:
            raise ValueError("Candidate not found.")

        if data.name is not None:
            candidate.name = data.name
        if data.email is not None:
            candidate.email = data.email
        if data.phone is not None:
            candidate.phone = data.phone

        return await self.repo.update(candidate)

    async def delete_candidate(self, candidate_id: UUID) -> None:
        """Delete a candidate."""
        candidate = await self.repo.get_by_id(candidate_id)
        if not candidate:
            raise ValueError("Candidate not found.")
        await self.repo.delete(candidate)

    async def list_candidates(self, **kwargs) -> tuple[list[Candidate], int]:
        """List candidates with filters."""
        return await self.repo.list_candidates(**kwargs)
