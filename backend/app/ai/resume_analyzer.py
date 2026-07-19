"""
Resume analysis pipeline.

Pipeline: File Upload → Text Extraction → LLM Analysis → Embedding → Storage
Supports PDF (via pdfplumber + PyPDF2 fallback) and DOCX (via python-docx).
"""

import logging
from pathlib import Path

from app.ai.llm_provider import get_llm_provider
from app.ai.prompts import RESUME_ANALYSIS_PROMPT
from app.schemas.resume import ResumeAnalysisResult

logger = logging.getLogger(__name__)


class ResumeAnalyzer:
    """Handles the complete resume processing pipeline."""

    def __init__(self):
        self.llm = get_llm_provider()

    def extract_text_from_pdf(self, file_path: str) -> str:
        """Extract text from a PDF file using pdfplumber (primary) + PyPDF2 (fallback)."""
        text = ""

        # Primary: pdfplumber (better for complex layouts, tables)
        try:
            import pdfplumber
            with pdfplumber.open(file_path) as pdf:
                for page in pdf.pages:
                    page_text = page.extract_text()
                    if page_text:
                        text += page_text + "\n"

            if text.strip():
                logger.info(f"PDF text extracted via pdfplumber: {len(text)} chars")
                return text.strip()
        except Exception as e:
            logger.warning(f"pdfplumber extraction failed: {e}")

        # Fallback: PyPDF2
        try:
            from PyPDF2 import PdfReader
            reader = PdfReader(file_path)
            for page in reader.pages:
                page_text = page.extract_text()
                if page_text:
                    text += page_text + "\n"

            logger.info(f"PDF text extracted via PyPDF2: {len(text)} chars")
            return text.strip()
        except Exception as e:
            logger.error(f"PyPDF2 extraction also failed: {e}")
            raise ValueError(f"Could not extract text from PDF: {e}")

    def extract_text_from_docx(self, file_path: str) -> str:
        """Extract text from a DOCX file using python-docx."""
        try:
            from docx import Document
            doc = Document(file_path)
            paragraphs = [p.text for p in doc.paragraphs if p.text.strip()]
            text = "\n".join(paragraphs)
            logger.info(f"DOCX text extracted: {len(text)} chars")
            return text
        except Exception as e:
            logger.error(f"DOCX extraction failed: {e}")
            raise ValueError(f"Could not extract text from DOCX: {e}")

    def extract_text(self, file_path: str, file_type: str) -> str:
        """Route to the correct extractor based on file type."""
        if file_type == "pdf":
            return self.extract_text_from_pdf(file_path)
        elif file_type == "docx":
            return self.extract_text_from_docx(file_path)
        else:
            raise ValueError(f"Unsupported file type: {file_type}")

    async def analyze(self, raw_text: str) -> dict:
        """
        Send extracted resume text to LLM for structured analysis.

        Returns:
            Dict matching ResumeAnalysisResult schema.
        """
        if not raw_text or len(raw_text.strip()) < 50:
            raise ValueError("Resume text is too short to analyze meaningfully.")

        # Truncate extremely long resumes to avoid token limits
        max_chars = 15000
        if len(raw_text) > max_chars:
            raw_text = raw_text[:max_chars] + "\n\n[Text truncated for analysis]"

        prompt = RESUME_ANALYSIS_PROMPT.format(resume_text=raw_text)

        result = await self.llm.analyze(
            prompt=prompt,
            response_model=ResumeAnalysisResult,
            system_prompt=(
                "You are an expert HR analyst. Analyze resumes and return structured JSON. "
                "Be thorough and objective in your analysis. Scores should be on a 0-100 scale."
            ),
        )

        return result

    async def full_pipeline(self, file_path: str, file_type: str) -> tuple[str, dict]:
        """
        Run the complete resume analysis pipeline.

        Returns:
            Tuple of (raw_text, analysis_result_dict).
        """
        # Step 1: Extract text
        raw_text = self.extract_text(file_path, file_type)

        # Step 2: LLM analysis
        analysis = await self.analyze(raw_text)

        return raw_text, analysis
