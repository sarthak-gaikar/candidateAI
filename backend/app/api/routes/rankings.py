"""
Ranking API routes — candidate ranking and weight management.
"""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.api.deps import get_current_user
from app.models.user import User
from app.schemas.score import WeightsUpdate, RankingEntry
from app.services.ranking_service import RankingService

router = APIRouter()


@router.get("", response_model=list[RankingEntry])
@router.get("/", response_model=list[RankingEntry], include_in_schema=False)
async def get_rankings(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Get the ranked candidate leaderboard."""
    service = RankingService(db)
    candidates = await service.get_rankings()

    return [
        RankingEntry(
            rank=c.rank or i + 1,
            candidate_id=c.id,
            candidate_name=c.name,
            final_score=c.final_score or 0,
            resume_score=c.score.resume_score if c.score else None,
            interview_score=c.score.interview_score if c.score else None,
            skills_match_score=c.score.skills_match_score if c.score else None,
            recommendation=c.recommendation.value if c.recommendation else "pending",
            status=c.status.value,
        )
        for i, c in enumerate(candidates)
    ]


@router.post("/recalculate", response_model=list[RankingEntry])
async def recalculate_rankings(
    weights: WeightsUpdate | None = None,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Recalculate all candidate rankings with optional custom weights."""
    service = RankingService(db)

    weight_dict = None
    if weights:
        total = weights.resume_weight + weights.interview_weight + weights.skills_match_weight
        if abs(total - 1.0) > 0.01:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Weights must sum to 1.0 (got {total:.2f})",
            )
        weight_dict = {
            "resume_score": weights.resume_weight,
            "interview_score": weights.interview_weight,
            "skills_match_score": weights.skills_match_weight,
        }

    candidates = await service.recalculate_all_rankings(weight_dict)

    return [
        RankingEntry(
            rank=c.rank or i + 1,
            candidate_id=c.id,
            candidate_name=c.name,
            final_score=c.final_score or 0,
            resume_score=c.score.resume_score if c.score else None,
            interview_score=c.score.interview_score if c.score else None,
            skills_match_score=c.score.skills_match_score if c.score else None,
            recommendation=c.recommendation.value if c.recommendation else "pending",
            status=c.status.value,
        )
        for i, c in enumerate(candidates)
    ]
