"""
Models package — imports all ORM models so Alembic can discover them.
"""

from app.models.user import User, UserRole
from app.models.candidate import Candidate, CandidateStatus, Recommendation
from app.models.resume import Resume
from app.models.interview import Interview, InterviewStatus
from app.models.score import Score
from app.models.report import Report
from app.models.job_posting import JobPosting, JobStatus

__all__ = [
    "User",
    "UserRole",
    "Candidate",
    "CandidateStatus",
    "Recommendation",
    "Resume",
    "Interview",
    "InterviewStatus",
    "Score",
    "Report",
    "JobPosting",
    "JobStatus",
]
