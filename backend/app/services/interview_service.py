"""
Interview service — orchestrates the video interview processing pipeline.
"""

import logging
from datetime import datetime, timezone
from uuid import UUID

from sqlalchemy.ext.asyncio import AsyncSession

from app.ai.interview_analyzer import InterviewAnalyzer
from app.models.candidate import CandidateStatus
from app.models.interview import Interview, InterviewStatus
from app.repositories.candidate_repo import CandidateRepository
from app.repositories.interview_repo import InterviewRepository

logger = logging.getLogger(__name__)


class InterviewService:
    """Orchestrates the complete interview processing workflow."""

    def __init__(self, db: AsyncSession):
        self.db = db
        self.interview_repo = InterviewRepository(db)
        self.candidate_repo = CandidateRepository(db)
        self.analyzer = InterviewAnalyzer()

    async def upload_and_analyze(
        self,
        candidate_id: UUID,
        video_path: str,
        file_name: str,
    ) -> Interview:
        """
        Upload a video interview and run the full analysis pipeline.

        Steps:
            1. Create interview record
            2. Extract audio from video
            3. Transcribe audio with Whisper
            4. Analyze transcript with LLM
            5. Update candidate status
        """
        # Verify candidate exists
        candidate = await self.candidate_repo.get_by_id(candidate_id)
        if not candidate:
            raise ValueError("Candidate not found.")

        # Check for existing interview
        existing = await self.interview_repo.get_by_candidate_id(candidate_id)
        if existing:
            raise ValueError("Candidate already has an interview. Delete the existing one first.")

        # Step 1: Create interview record
        interview = Interview(
            candidate_id=candidate_id,
            video_path=video_path,
            file_name=file_name,
            status=InterviewStatus.UPLOADED,
        )
        interview = await self.interview_repo.create(interview)

        # Update candidate status
        candidate.status = CandidateStatus.INTERVIEW_UPLOADED
        await self.candidate_repo.update(candidate)

        try:
            # Step 2: Extract audio
            interview.status = InterviewStatus.EXTRACTING_AUDIO
            await self.interview_repo.update(interview)

            # Step 3: Transcribe + Step 4: Analyze
            interview.status = InterviewStatus.TRANSCRIBING
            await self.interview_repo.update(interview)

            audio_path, transcript, analysis = await self.analyzer.full_pipeline(video_path)

            interview.status = InterviewStatus.ANALYZING
            await self.interview_repo.update(interview)

            # Step 5: Update interview with results
            interview.audio_path = audio_path
            interview.transcript = transcript
            interview.key_points = analysis.get("key_points", [])
            interview.communication_score = analysis.get("communication_score", 0)
            interview.technical_score = analysis.get("technical_score", 0)
            interview.confidence_score = analysis.get("confidence_score", 0)
            interview.clarity_score = analysis.get("clarity_score", 0)
            interview.problem_solving_score = analysis.get("problem_solving_score", 0)
            interview.overall_score = analysis.get("overall_score", 0)
            interview.strengths = analysis.get("strengths", "")
            interview.weaknesses = analysis.get("weaknesses", "")
            interview.summary = analysis.get("summary", "")
            interview.status = InterviewStatus.COMPLETED
            interview.analyzed_at = datetime.now(timezone.utc)

            await self.interview_repo.update(interview)

            # Update candidate status
            candidate.status = CandidateStatus.INTERVIEW_ANALYZED
            await self.candidate_repo.update(candidate)

            logger.info(f"Interview analyzed for candidate {candidate_id}: score={interview.overall_score}")

        except Exception as e:
            logger.error(f"Interview analysis failed for {candidate_id}: {e}")
            interview.status = InterviewStatus.FAILED
            interview.error_message = str(e)
            await self.interview_repo.update(interview)
            raise ValueError(f"Interview processing failed: {e}")

        return interview

    async def get_interview(self, interview_id: UUID) -> Interview:
        """Get an interview by ID."""
        interview = await self.interview_repo.get_by_id(interview_id)
        if not interview:
            raise ValueError("Interview not found.")
        return interview

    async def get_by_candidate(self, candidate_id: UUID) -> Interview | None:
        """Get interview for a candidate."""
        return await self.interview_repo.get_by_candidate_id(candidate_id)

    async def delete_interview(self, interview_id: UUID) -> None:
        """Delete an interview and update candidate status."""
        interview = await self.interview_repo.get_by_id(interview_id)
        if not interview:
            raise ValueError("Interview not found.")

        candidate = await self.candidate_repo.get_by_id(interview.candidate_id)
        await self.interview_repo.delete(interview)

        if candidate:
            if candidate.resume:
                candidate.status = CandidateStatus.RESUME_ANALYZED
            else:
                candidate.status = CandidateStatus.PENDING
            await self.candidate_repo.update(candidate)
