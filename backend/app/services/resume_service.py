"""
Resume service — orchestrates the resume upload and analysis pipeline.
"""

import logging
from datetime import datetime, timezone
from uuid import UUID

from sqlalchemy.ext.asyncio import AsyncSession

from app.ai.resume_analyzer import ResumeAnalyzer
from app.ai.embeddings import generate_embedding
from app.models.candidate import CandidateStatus
from app.models.resume import Resume
from app.repositories.candidate_repo import CandidateRepository
from app.repositories.resume_repo import ResumeRepository

logger = logging.getLogger(__name__)


class ResumeService:
    """Orchestrates the complete resume analysis workflow."""

    def __init__(self, db: AsyncSession):
        self.db = db
        self.resume_repo = ResumeRepository(db)
        self.candidate_repo = CandidateRepository(db)
        self.analyzer = ResumeAnalyzer()

    async def upload_and_analyze(
        self,
        candidate_id: UUID,
        file_path: str,
        file_name: str,
        file_type: str,
    ) -> Resume:
        """
        Upload a resume and run the full analysis pipeline.

        Steps:
            1. Create resume record with file path
            2. Extract text from PDF/DOCX
            3. Send to LLM for structured analysis
            4. Generate embedding for semantic search
            5. Update candidate status and score
        """
        # Verify candidate exists
        candidate = await self.candidate_repo.get_by_id(candidate_id)
        if not candidate:
            raise ValueError("Candidate not found.")

        # Check for existing resume
        existing = await self.resume_repo.get_by_candidate_id(candidate_id)
        if existing:
            raise ValueError("Candidate already has a resume. Delete the existing one first.")

        # Step 1: Create resume record
        resume = Resume(
            candidate_id=candidate_id,
            file_path=file_path,
            file_name=file_name,
            file_type=file_type,
        )
        resume = await self.resume_repo.create(resume)

        # Update candidate status
        candidate.status = CandidateStatus.RESUME_UPLOADED
        await self.candidate_repo.update(candidate)

        try:
            # Step 2 & 3: Extract text + LLM analysis
            raw_text, analysis = await self.analyzer.full_pipeline(file_path, file_type)

            # Step 4: Generate embedding
            embedding = generate_embedding(raw_text)

            # Step 5: Update resume with results
            resume.raw_text = raw_text
            resume.parsed_data = analysis
            resume.skills = analysis.get("skills", [])
            resume.education = analysis.get("education", [])
            resume.experience = analysis.get("experience", [])
            resume.certifications = analysis.get("certifications", [])
            resume.projects = analysis.get("projects", [])
            resume.contact_info = {
                "name": analysis.get("name"),
                "email": analysis.get("email"),
                "phone": analysis.get("phone"),
            }
            resume.strengths = analysis.get("strengths", "")
            resume.weaknesses = analysis.get("weaknesses", "")
            resume.skill_summary = analysis.get("skill_summary", "")
            resume.job_fit_score = analysis.get("job_fit_score", 0)
            resume.overall_score = analysis.get("overall_score", 0)
            resume.embedding = embedding
            resume.analyzed_at = datetime.now(timezone.utc)

            await self.resume_repo.update(resume)

            # Update candidate status and name if extracted
            candidate.status = CandidateStatus.RESUME_ANALYZED
            if analysis.get("name") and candidate.name == "Unknown":
                candidate.name = analysis["name"]
            if analysis.get("email") and not candidate.email:
                candidate.email = analysis["email"]
            if analysis.get("phone") and not candidate.phone:
                candidate.phone = analysis["phone"]
            await self.candidate_repo.update(candidate)

            logger.info(f"Resume analyzed for candidate {candidate_id}: score={resume.overall_score}")

        except Exception as e:
            logger.error(f"Resume analysis failed for {candidate_id}: {e}")
            # Resume record exists but analysis failed — surface the error
            raise ValueError(f"Resume uploaded but analysis failed: {e}")

        return resume

    async def get_resume(self, resume_id: UUID) -> Resume:
        """Get a resume by ID."""
        resume = await self.resume_repo.get_by_id(resume_id)
        if not resume:
            raise ValueError("Resume not found.")
        return resume

    async def get_by_candidate(self, candidate_id: UUID) -> Resume | None:
        """Get resume for a candidate."""
        return await self.resume_repo.get_by_candidate_id(candidate_id)
