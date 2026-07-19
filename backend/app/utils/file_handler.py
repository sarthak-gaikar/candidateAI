"""
File upload and storage utilities.
"""

import uuid
from pathlib import Path

import aiofiles
from fastapi import UploadFile

from app.config import settings


ALLOWED_RESUME_TYPES = {".pdf", ".docx"}
ALLOWED_VIDEO_TYPES = {".mp4", ".mov", ".avi", ".webm"}


async def save_upload(
    file: UploadFile,
    subdirectory: str,
    allowed_types: set[str] | None = None,
) -> tuple[str, str]:
    """
    Save an uploaded file to disk.

    Returns:
        Tuple of (saved file path, original file extension).

    Raises:
        ValueError: If the file type is not allowed or file exceeds size limit.
    """
    if not file.filename:
        raise ValueError("No filename provided.")

    # Validate file extension
    ext = Path(file.filename).suffix.lower()
    if allowed_types and ext not in allowed_types:
        raise ValueError(
            f"File type '{ext}' not allowed. Accepted types: {', '.join(allowed_types)}"
        )

    # Generate unique filename
    unique_name = f"{uuid.uuid4().hex}{ext}"
    upload_dir = settings.upload_path / subdirectory
    upload_dir.mkdir(parents=True, exist_ok=True)
    file_path = upload_dir / unique_name

    # Stream file to disk (memory-efficient for large files)
    total_bytes = 0
    async with aiofiles.open(file_path, "wb") as f:
        while chunk := await file.read(1024 * 1024):  # 1MB chunks
            total_bytes += len(chunk)
            if total_bytes > settings.max_upload_bytes:
                # Clean up partial file
                file_path.unlink(missing_ok=True)
                raise ValueError(
                    f"File exceeds maximum size of {settings.MAX_UPLOAD_SIZE_MB}MB."
                )
            await f.write(chunk)

    return str(file_path), ext.lstrip(".")


def delete_file(file_path: str) -> bool:
    """Delete a file from disk. Returns True if deleted, False if not found."""
    path = Path(file_path)
    if path.exists():
        path.unlink()
        return True
    return False
