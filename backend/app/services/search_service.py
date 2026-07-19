"""
Search service — natural language candidate search and semantic matching.
"""

import logging
from uuid import UUID

from sqlalchemy.ext.asyncio import AsyncSession

from app.ai.llm_provider import get_llm_provider
from app.ai.prompts import SEARCH_QUERY_PROMPT
from app.ai.embeddings import generate_embedding, find_similar
from app.repositories.candidate_repo import CandidateRepository
from app.repositories.resume_repo import ResumeRepository

logger = logging.getLogger(__name__)


class SearchService:
    """Natural language search and semantic candidate matching."""

    def __init__(self, db: AsyncSession):
        self.db = db
        self.candidate_repo = CandidateRepository(db)
        self.resume_repo = ResumeRepository(db)
        self.llm = get_llm_provider()

    async def natural_language_search(self, query: str) -> list[dict]:
        """
        Search candidates using natural language.

        Example: "Show candidates with Python, Machine Learning, and 3 years experience"

        Steps:
            1. Parse query with LLM → structured filters
            2. Apply SQL filters
            3. Rank by relevance
        """
        # Step 1: Parse the query
        prompt = SEARCH_QUERY_PROMPT.format(query=query)
        filters = await self.llm.analyze(prompt=prompt)

        # Step 2: Apply filters
        search_kwargs = {}
        if filters.get("min_score"):
            search_kwargs["min_score"] = filters["min_score"]
        if filters.get("max_score"):
            search_kwargs["max_score"] = filters["max_score"]
        if filters.get("keywords"):
            search_kwargs["search"] = " ".join(filters["keywords"])

        candidates, total = await self.candidate_repo.list_candidates(
            page_size=50,
            **search_kwargs,
        )

        # Step 3: Filter by skills if specified
        results = []
        required_skills = {s.lower() for s in (filters.get("skills") or [])}
        min_exp = filters.get("min_experience_years")

        for candidate in candidates:
            match_score = 100  # Start with perfect score

            if required_skills and candidate.resume and candidate.resume.skills:
                candidate_skills = {s.lower() for s in candidate.resume.skills}
                matched = required_skills & candidate_skills
                if len(required_skills) > 0:
                    skill_match = len(matched) / len(required_skills) * 100
                    match_score = min(match_score, skill_match)
                if not matched:
                    continue  # No matching skills at all

            # Experience filter
            if min_exp and candidate.resume and candidate.resume.parsed_data:
                total_exp = candidate.resume.parsed_data.get("total_experience_years", 0)
                if total_exp < min_exp:
                    match_score *= 0.5  # Penalize but don't exclude

            results.append({
                "candidate_id": str(candidate.id),
                "name": candidate.name,
                "email": candidate.email,
                "final_score": candidate.final_score,
                "recommendation": candidate.recommendation.value if candidate.recommendation else None,
                "match_score": round(match_score, 1),
                "skills": candidate.resume.skills if candidate.resume else [],
            })

        # Sort by match score
        results.sort(key=lambda x: x["match_score"], reverse=True)
        return results

    async def find_similar_candidates(self, candidate_id: UUID, top_k: int = 10) -> list[dict]:
        """Find candidates similar to the given candidate based on resume embeddings."""
        # Get the target candidate's resume
        target_resume = await self.resume_repo.get_by_candidate_id(candidate_id)
        if not target_resume or not target_resume.embedding:
            raise ValueError("Candidate has no resume embedding for comparison.")

        # Get all other candidate embeddings
        all_resumes = await self.resume_repo.get_all_embeddings()
        candidates_with_embeddings = [
            (str(r.candidate_id), r.embedding)
            for r in all_resumes
            if str(r.candidate_id) != str(candidate_id)
        ]

        # Find similar
        similar = find_similar(
            target_embedding=target_resume.embedding,
            candidates=candidates_with_embeddings,
            top_k=top_k,
        )

        # Enrich with candidate details
        results = []
        for cid, similarity_score in similar:
            candidate = await self.candidate_repo.get_by_id(cid)
            if candidate:
                results.append({
                    "candidate_id": cid,
                    "name": candidate.name,
                    "similarity_score": round(similarity_score, 3),
                    "final_score": candidate.final_score,
                    "recommendation": candidate.recommendation.value if candidate.recommendation else None,
                })

        return results
