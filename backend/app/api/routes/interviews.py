"""
Interview API routes — upload and analysis endpoints.
"""

from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.api.deps import get_current_user
from app.models.user import User
from app.schemas.interview import InterviewResponse
from app.services.interview_service import InterviewService
from app.services.ranking_service import RankingService
from app.utils.file_handler import save_upload, ALLOWED_VIDEO_TYPES

router = APIRouter()


@router.post("/upload/{candidate_id}", response_model=InterviewResponse)
async def upload_interview(
    candidate_id: UUID,
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Upload a video interview and trigger the AI analysis pipeline.

    The pipeline:
    1. Saves the video file
    2. Extracts audio using moviepy
    3. Transcribes audio using Whisper (API or local)
    4. Analyzes transcript with LLM
    5. Returns the analysis results
    """
    try:
        # Save file
        file_path, _ = await save_upload(
            file, "videos", ALLOWED_VIDEO_TYPES
        )

        # Run analysis pipeline
        service = InterviewService(db)
        interview = await service.upload_and_analyze(
            candidate_id=candidate_id,
            video_path=file_path,
            file_name=file.filename,
        )

        # Trigger ranking recalculation
        ranking_service = RankingService(db)
        await ranking_service.calculate_score(candidate_id)

        return InterviewResponse.model_validate(interview)

    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))


@router.get("/{interview_id}", response_model=InterviewResponse)
async def get_interview(
    interview_id: UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Get interview analysis results."""
    try:
        service = InterviewService(db)
        interview = await service.get_interview(interview_id)
        return InterviewResponse.model_validate(interview)
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))


@router.get("/{interview_id}/transcript")
async def get_transcript(
    interview_id: UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Get the full interview transcript."""
    try:
        service = InterviewService(db)
        interview = await service.get_interview(interview_id)
        return {
            "interview_id": str(interview.id),
            "transcript": interview.transcript,
            "key_points": interview.key_points,
        }
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))
