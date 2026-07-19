"""
Resume API routes — upload and analysis endpoints.
"""

from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, status, BackgroundTasks
from fastapi.responses import FileResponse
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.api.deps import get_current_user
from app.models.user import User
from app.schemas.resume import ResumeResponse
from app.services.resume_service import ResumeService
from app.services.ranking_service import RankingService
from app.utils.file_handler import save_upload, ALLOWED_RESUME_TYPES

router = APIRouter()


@router.post("/upload/{candidate_id}", response_model=ResumeResponse)
async def upload_resume(
    candidate_id: UUID,
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Upload a resume (PDF/DOCX) and trigger the AI analysis pipeline.

    The pipeline:
    1. Saves the file
    2. Extracts text (PDF via pdfplumber, DOCX via python-docx)
    3. Sends to LLM for structured analysis
    4. Generates embedding for semantic search
    5. Returns the analysis results
    """
    try:
        # Save file
        file_path, file_ext = await save_upload(
            file, "resumes", ALLOWED_RESUME_TYPES
        )

        # Run analysis pipeline
        service = ResumeService(db)
        resume = await service.upload_and_analyze(
            candidate_id=candidate_id,
            file_path=file_path,
            file_name=file.filename,
            file_type=file_ext,
        )

        # Trigger ranking recalculation
        ranking_service = RankingService(db)
        await ranking_service.calculate_score(candidate_id)

        return ResumeResponse.model_validate(resume)

    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))


@router.get("/{resume_id}", response_model=ResumeResponse)
async def get_resume(
    resume_id: UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Get resume analysis results."""
    try:
        service = ResumeService(db)
        resume = await service.get_resume(resume_id)
        return ResumeResponse.model_validate(resume)
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))


@router.get("/{resume_id}/download")
async def download_resume(
    resume_id: UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Download the original resume file."""
    try:
        service = ResumeService(db)
        resume = await service.get_resume(resume_id)
        return FileResponse(
            path=resume.file_path,
            filename=resume.file_name,
            media_type="application/octet-stream",
        )
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))
