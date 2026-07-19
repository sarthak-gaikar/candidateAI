"""
Pydantic schemas for Report operations.
"""

from datetime import datetime
from uuid import UUID

from pydantic import BaseModel


class ReportResponse(BaseModel):
    """Report metadata."""
    id: UUID
    candidate_id: UUID
    format: str
    file_path: str | None = None
    content: dict
    created_at: datetime

    model_config = {"from_attributes": True}


class ReportGenerateRequest(BaseModel):
    """Request to generate a report."""
    format: str = "pdf"  # "pdf" or "docx"
