"""
Candidate API routes — CRUD operations for candidates.
"""

from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.api.deps import get_current_user
from app.models.user import User
from app.schemas.candidate import (
    CandidateCreate,
    CandidateUpdate,
    CandidateListResponse,
    CandidateDetailResponse,
)
from app.services.candidate_service import CandidateService

router = APIRouter()


@router.post("/", response_model=CandidateListResponse, status_code=status.HTTP_201_CREATED)
async def create_candidate(
    data: CandidateCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Create a new candidate."""
    try:
        service = CandidateService(db)
        candidate = await service.create_candidate(data, current_user.id)
        return CandidateListResponse(
            id=candidate.id,
            name=candidate.name,
            email=candidate.email,
            phone=candidate.phone,
            status=candidate.status.value,
            final_score=candidate.final_score,
            recommendation=candidate.recommendation.value if candidate.recommendation else None,
            rank=candidate.rank,
            created_at=candidate.created_at,
        )
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))


@router.get("/", response_model=dict)
async def list_candidates(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    sort_by: str = Query("created_at"),
    sort_order: str = Query("desc"),
    status_filter: str | None = Query(None, alias="status"),
    search: str | None = Query(None),
    min_score: float | None = Query(None, ge=0, le=100),
    max_score: float | None = Query(None, ge=0, le=100),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """List candidates with filtering and pagination."""
    service = CandidateService(db)
    candidates, total = await service.list_candidates(
        page=page,
        page_size=page_size,
        sort_by=sort_by,
        sort_order=sort_order,
        status=status_filter,
        search=search,
        min_score=min_score,
        max_score=max_score,
    )

    return {
        "items": [
            CandidateListResponse(
                id=c.id,
                name=c.name,
                email=c.email,
                phone=c.phone,
                status=c.status.value,
                final_score=c.final_score,
                recommendation=c.recommendation.value if c.recommendation else None,
                rank=c.rank,
                created_at=c.created_at,
            ).model_dump()
            for c in candidates
        ],
        "total": total,
        "page": page,
        "page_size": page_size,
        "total_pages": (total + page_size - 1) // page_size,
    }


@router.get("/{candidate_id}")
async def get_candidate(
    candidate_id: UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Get detailed candidate information."""
    try:
        service = CandidateService(db)
        candidate = await service.get_candidate(candidate_id)

        response = {
            "id": str(candidate.id),
            "name": candidate.name,
            "email": candidate.email,
            "phone": candidate.phone,
            "status": candidate.status.value,
            "final_score": candidate.final_score,
            "recommendation": candidate.recommendation.value if candidate.recommendation else None,
            "rank": candidate.rank,
            "created_at": candidate.created_at.isoformat(),
            "updated_at": candidate.updated_at.isoformat(),
        }

        # Include resume data if available
        if candidate.resume:
            response["resume"] = {
                "id": str(candidate.resume.id),
                "file_name": candidate.resume.file_name,
                "skills": candidate.resume.skills,
                "education": candidate.resume.education,
                "experience": candidate.resume.experience,
                "certifications": candidate.resume.certifications,
                "projects": candidate.resume.projects,
                "strengths": candidate.resume.strengths,
                "weaknesses": candidate.resume.weaknesses,
                "skill_summary": candidate.resume.skill_summary,
                "job_fit_score": candidate.resume.job_fit_score,
                "overall_score": candidate.resume.overall_score,
                "analyzed_at": candidate.resume.analyzed_at.isoformat() if candidate.resume.analyzed_at else None,
            }

        # Include interview data if available
        if candidate.interview:
            response["interview"] = {
                "id": str(candidate.interview.id),
                "file_name": candidate.interview.file_name,
                "status": candidate.interview.status.value,
                "transcript": candidate.interview.transcript,
                "key_points": candidate.interview.key_points,
                "communication_score": candidate.interview.communication_score,
                "technical_score": candidate.interview.technical_score,
                "confidence_score": candidate.interview.confidence_score,
                "clarity_score": candidate.interview.clarity_score,
                "problem_solving_score": candidate.interview.problem_solving_score,
                "overall_score": candidate.interview.overall_score,
                "strengths": candidate.interview.strengths,
                "weaknesses": candidate.interview.weaknesses,
                "summary": candidate.interview.summary,
                "analyzed_at": candidate.interview.analyzed_at.isoformat() if candidate.interview.analyzed_at else None,
            }

        # Include score breakdown if available
        if candidate.score:
            response["score_breakdown"] = {
                "resume_score": candidate.score.resume_score,
                "interview_score": candidate.score.interview_score,
                "skills_match_score": candidate.score.skills_match_score,
                "final_score": candidate.score.final_score,
                "weights": candidate.score.weights,
                "breakdown": candidate.score.breakdown,
            }

        return response

    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))


@router.put("/{candidate_id}", response_model=CandidateListResponse)
async def update_candidate(
    candidate_id: UUID,
    data: CandidateUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Update candidate information."""
    try:
        service = CandidateService(db)
        candidate = await service.update_candidate(candidate_id, data)
        return CandidateListResponse(
            id=candidate.id,
            name=candidate.name,
            email=candidate.email,
            phone=candidate.phone,
            status=candidate.status.value,
            final_score=candidate.final_score,
            recommendation=candidate.recommendation.value if candidate.recommendation else None,
            rank=candidate.rank,
            created_at=candidate.created_at,
        )
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))


@router.delete("/{candidate_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_candidate(
    candidate_id: UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Delete a candidate."""
    try:
        service = CandidateService(db)
        await service.delete_candidate(candidate_id)
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))
