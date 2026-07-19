"""
Report service — generates detailed candidate evaluation reports.
"""

import logging
from uuid import UUID

from sqlalchemy.ext.asyncio import AsyncSession

from app.ai.llm_provider import get_llm_provider
from app.ai.prompts import REPORT_GENERATION_PROMPT
from app.models.report import Report
from app.repositories.candidate_repo import CandidateRepository
from app.repositories.report_repo import ReportRepository
from app.utils.pdf_generator import generate_pdf_report, generate_docx_report

logger = logging.getLogger(__name__)


class ReportService:
    """Business logic for report generation and export."""

    def __init__(self, db: AsyncSession):
        self.db = db
        self.candidate_repo = CandidateRepository(db)
        self.report_repo = ReportRepository(db)
        self.llm = get_llm_provider()

    async def generate_report(
        self,
        candidate_id: UUID,
        generated_by: UUID,
        report_format: str = "pdf",
    ) -> Report:
        """Generate a comprehensive evaluation report for a candidate."""
        candidate = await self.candidate_repo.get_by_id(candidate_id)
        if not candidate:
            raise ValueError("Candidate not found.")

        # Gather all data for the report
        resume = candidate.resume
        interview = candidate.interview
        score = candidate.score

        # Generate LLM report content
        prompt = REPORT_GENERATION_PROMPT.format(
            name=candidate.name,
            resume_score=resume.overall_score if resume else "N/A",
            interview_score=interview.overall_score if interview else "N/A",
            final_score=candidate.final_score or "N/A",
            skills=", ".join(resume.skills) if resume and resume.skills else "N/A",
            experience=str(resume.experience) if resume and resume.experience else "N/A",
            education=str(resume.education) if resume and resume.education else "N/A",
            resume_strengths=resume.strengths if resume else "N/A",
            resume_weaknesses=resume.weaknesses if resume else "N/A",
            interview_strengths=interview.strengths if interview else "N/A",
            interview_weaknesses=interview.weaknesses if interview else "N/A",
            interview_summary=interview.summary if interview else "N/A",
        )

        report_content = await self.llm.analyze(prompt=prompt)

        # Add raw data to report content
        report_content["candidate"] = {
            "name": candidate.name,
            "email": candidate.email,
            "phone": candidate.phone,
        }
        report_content["scores"] = {
            "resume_score": resume.overall_score if resume else None,
            "interview_score": interview.overall_score if interview else None,
            "final_score": candidate.final_score,
            "recommendation": candidate.recommendation.value if candidate.recommendation else None,
        }
        if resume:
            report_content["skills"] = resume.skills
            report_content["education"] = resume.education
            report_content["experience"] = resume.experience
            report_content["certifications"] = resume.certifications

        # Generate file
        file_path = None
        if report_format == "pdf":
            file_path = generate_pdf_report(report_content, candidate.name)
        elif report_format == "docx":
            file_path = generate_docx_report(report_content, candidate.name)

        # Save report record
        report = Report(
            candidate_id=candidate_id,
            generated_by=generated_by,
            content=report_content,
            format=report_format,
            file_path=file_path,
        )
        report = await self.report_repo.create(report)

        logger.info(f"Report generated for candidate {candidate_id}: {report_format}")
        return report

    async def get_report(self, report_id: UUID) -> Report:
        """Get a report by ID."""
        report = await self.report_repo.get_by_id(report_id)
        if not report:
            raise ValueError("Report not found.")
        return report

    async def list_reports(self, generated_by: UUID | None = None) -> list[Report]:
        """List all reports."""
        return await self.report_repo.list_all(generated_by)
