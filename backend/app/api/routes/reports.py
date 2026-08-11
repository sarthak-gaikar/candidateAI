"""
Report API routes — generation and download endpoints.
"""

from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import FileResponse
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.api.deps import get_current_user
from app.models.user import User
from app.schemas.report import ReportResponse, ReportGenerateRequest
from app.services.report_service import ReportService

router = APIRouter()


@router.post("/generate/{candidate_id}", response_model=ReportResponse)
async def generate_report(
    candidate_id: UUID,
    request: ReportGenerateRequest = ReportGenerateRequest(),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Generate a comprehensive evaluation report for a candidate."""
    try:
        service = ReportService(db)
        report = await service.generate_report(
            candidate_id=candidate_id,
            generated_by=current_user.id,
            report_format=request.format,
        )
        return ReportResponse.model_validate(report)
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))


@router.get("", response_model=list[ReportResponse])
@router.get("/", response_model=list[ReportResponse], include_in_schema=False)
async def list_reports(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """List all generated reports."""
    service = ReportService(db)
    reports = await service.list_reports(generated_by=current_user.id)
    return [ReportResponse.model_validate(r) for r in reports]


@router.get("/{report_id}", response_model=ReportResponse)
async def get_report(
    report_id: UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Get report details."""
    try:
        service = ReportService(db)
        report = await service.get_report(report_id)
        return ReportResponse.model_validate(report)
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))


@router.get("/{report_id}/download")
async def download_report(
    report_id: UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Download the generated report file."""
    try:
        service = ReportService(db)
        report = await service.get_report(report_id)

        if not report.file_path:
            raise ValueError("Report file not found.")

        media_types = {
            "pdf": "application/pdf",
            "docx": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        }

        return FileResponse(
            path=report.file_path,
            filename=f"report.{report.format}",
            media_type=media_types.get(report.format, "application/octet-stream"),
        )
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))
