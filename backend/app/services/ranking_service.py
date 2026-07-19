"""
Ranking service — weighted scoring and candidate ranking engine.
"""

import logging
from datetime import datetime, timezone
from uuid import UUID

from sqlalchemy.ext.asyncio import AsyncSession

from app.models.candidate import Candidate, CandidateStatus, Recommendation
from app.models.score import Score
from app.repositories.candidate_repo import CandidateRepository
from app.repositories.score_repo import ScoreRepository

logger = logging.getLogger(__name__)

# Default scoring weights
DEFAULT_WEIGHTS = {
    "resume_score": 0.35,
    "interview_score": 0.40,
    "skills_match_score": 0.25,
}

# Recommendation thresholds
RECOMMENDATION_THRESHOLDS = [
    (85, Recommendation.HIGHLY_RECOMMENDED),
    (70, Recommendation.RECOMMENDED),
    (50, Recommendation.CONSIDER),
    (0, Recommendation.NOT_RECOMMENDED),
]


class RankingService:
    """Business logic for candidate scoring and ranking."""

    def __init__(self, db: AsyncSession):
        self.db = db
        self.candidate_repo = CandidateRepository(db)
        self.score_repo = ScoreRepository(db)

    def _get_recommendation(self, score: float) -> Recommendation:
        """Determine recommendation category based on final score."""
        for threshold, recommendation in RECOMMENDATION_THRESHOLDS:
            if score >= threshold:
                return recommendation
        return Recommendation.NOT_RECOMMENDED

    async def calculate_score(
        self,
        candidate_id: UUID,
        weights: dict | None = None,
    ) -> Score:
        """
        Calculate the weighted composite score for a candidate.

        Uses resume score, interview score, and skills match score
        with configurable weights.
        """
        candidate = await self.candidate_repo.get_by_id(candidate_id)
        if not candidate:
            raise ValueError("Candidate not found.")

        w = weights or DEFAULT_WEIGHTS

        # Gather component scores
        resume_score = None
        interview_score = None
        skills_match_score = None

        if candidate.resume and candidate.resume.overall_score is not None:
            resume_score = candidate.resume.overall_score

        if candidate.interview and candidate.interview.overall_score is not None:
            interview_score = candidate.interview.overall_score

        if candidate.resume and candidate.resume.job_fit_score is not None:
            skills_match_score = candidate.resume.job_fit_score

        # Calculate weighted score (handle partial data)
        total_weight = 0
        weighted_sum = 0

        if resume_score is not None:
            weighted_sum += resume_score * w["resume_score"]
            total_weight += w["resume_score"]

        if interview_score is not None:
            weighted_sum += interview_score * w["interview_score"]
            total_weight += w["interview_score"]

        if skills_match_score is not None:
            weighted_sum += skills_match_score * w["skills_match_score"]
            total_weight += w["skills_match_score"]

        # Normalize if not all scores are available
        final_score = (weighted_sum / total_weight) if total_weight > 0 else 0
        final_score = round(final_score, 2)

        recommendation = self._get_recommendation(final_score)

        # Build breakdown
        breakdown = {
            "resume_score": resume_score,
            "resume_weight": w["resume_score"],
            "interview_score": interview_score,
            "interview_weight": w["interview_score"],
            "skills_match_score": skills_match_score,
            "skills_match_weight": w["skills_match_score"],
            "total_weight_used": round(total_weight, 2),
            "formula": "weighted_sum / total_weight_used",
        }

        # Create/update score record
        score = Score(
            candidate_id=candidate_id,
            resume_score=resume_score,
            interview_score=interview_score,
            skills_match_score=skills_match_score,
            final_score=final_score,
            weights=w,
            breakdown=breakdown,
            recommendation=recommendation,
            calculated_at=datetime.now(timezone.utc),
        )
        score = await self.score_repo.upsert(score)

        # Update candidate
        candidate.final_score = final_score
        candidate.recommendation = recommendation
        candidate.status = CandidateStatus.SCORED
        await self.candidate_repo.update(candidate)

        return score

    async def recalculate_all_rankings(self, weights: dict | None = None) -> list[Candidate]:
        """Recalculate scores and ranks for ALL candidates."""
        candidates = await self.candidate_repo.get_all_for_ranking()

        # Also include candidates who may now have scores
        all_candidates, _ = await self.candidate_repo.list_candidates(page_size=10000)

        for candidate in all_candidates:
            if candidate.resume or candidate.interview:
                await self.calculate_score(candidate.id, weights)

        # Re-fetch and rank
        scored_candidates = await self.candidate_repo.get_all_for_ranking()
        for rank, candidate in enumerate(scored_candidates, 1):
            candidate.rank = rank
            await self.candidate_repo.update(candidate)

        return scored_candidates

    async def get_rankings(self) -> list[Candidate]:
        """Get all candidates ordered by rank."""
        return await self.candidate_repo.get_all_for_ranking()
