"""
Search API routes — natural language and semantic search.
"""

from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.api.deps import get_current_user
from app.models.user import User
from app.services.search_service import SearchService

router = APIRouter()


class SearchRequest(BaseModel):
    """Natural language search query."""
    query: str


class SimilarRequest(BaseModel):
    """Find similar candidates request."""
    candidate_id: UUID
    top_k: int = 10


@router.post("")
@router.post("/", include_in_schema=False)
async def search_candidates(
    request: SearchRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Search candidates using natural language.

    Example queries:
    - "Show candidates with Python and Machine Learning skills"
    - "Find candidates with at least 3 years experience"
    - "Show top-rated candidates with React and Node.js"
    """
    try:
        service = SearchService(db)
        results = await service.natural_language_search(request.query)
        return {"query": request.query, "results": results, "count": len(results)}
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))


@router.post("/similar")
async def find_similar(
    request: SimilarRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Find candidates similar to a given candidate based on resume embeddings."""
    try:
        service = SearchService(db)
        results = await service.find_similar_candidates(
            candidate_id=request.candidate_id,
            top_k=request.top_k,
        )
        return {"candidate_id": str(request.candidate_id), "similar": results}
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
