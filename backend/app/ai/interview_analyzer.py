"""
Interview analysis pipeline.

Pipeline: Video → Audio Extraction → Whisper Transcription → LLM Analysis
Supports MP4 and MOV formats, with both API and local Whisper modes.
"""

import logging
import tempfile
from pathlib import Path

from app.ai.llm_provider import get_llm_provider
from app.ai.prompts import INTERVIEW_ANALYSIS_PROMPT
from app.config import settings
from app.schemas.interview import InterviewAnalysisResult

logger = logging.getLogger(__name__)


class InterviewAnalyzer:
    """Handles the complete video interview processing pipeline."""

    def __init__(self):
        self.llm = get_llm_provider()

    def extract_audio(self, video_path: str, output_path: str | None = None) -> str:
        """
        Extract audio from a video file using moviepy.

        Args:
            video_path: Path to the input video file.
            output_path: Optional path for the output WAV file.

        Returns:
            Path to the extracted audio file.
        """
        try:
            from moviepy import VideoFileClip

            if not output_path:
                output_path = str(
                    settings.upload_path / "audio" / f"{Path(video_path).stem}.wav"
                )

            Path(output_path).parent.mkdir(parents=True, exist_ok=True)

            video = VideoFileClip(video_path)
            video.audio.write_audiofile(
                output_path,
                codec="pcm_s16le",  # WAV format
                fps=16000,  # 16kHz for Whisper
                logger=None,  # Suppress moviepy console output
            )
            video.close()

            logger.info(f"Audio extracted: {output_path}")
            return output_path

        except Exception as e:
            logger.error(f"Audio extraction failed: {e}")
            raise ValueError(f"Could not extract audio from video: {e}")

    async def transcribe_api(self, audio_path: str) -> str:
        """Transcribe audio using Google Gemini API."""
        try:
            import google.generativeai as genai

            genai.configure(api_key=settings.GEMINI_API_KEY)

            # Upload audio file to Gemini API
            audio_file = genai.upload_file(audio_path)
            model = genai.GenerativeModel("gemini-2.5-flash")

            response = model.generate_content([
                "Generate a clear and accurate verbatim transcription of this audio interview. Return only the transcript text without any introductory commentary or markdown formatting.",
                audio_file
            ])

            transcript = response.text.strip()
            logger.info(f"Gemini API transcription complete: {len(transcript)} chars")
            return transcript

        except Exception as e:
            logger.error(f"Gemini API transcription failed: {e}")
            raise ValueError(f"Transcription failed: {e}")

    def transcribe_local(self, audio_path: str) -> str:
        """Transcribe audio using local Whisper model."""
        try:
            import whisper

            model = whisper.load_model(settings.WHISPER_LOCAL_MODEL)
            result = model.transcribe(audio_path)
            transcript = result["text"]

            logger.info(f"Local transcription complete: {len(transcript)} chars")
            return transcript

        except ImportError:
            msg = (
                "Local Whisper package is not installed. Please set WHISPER_MODE=api in your .env "
                "or install optional local ML dependencies: pip install -r requirements-ml.txt"
            )
            logger.error(msg)
            raise ValueError(msg)
        except Exception as e:
            logger.error(f"Local Whisper transcription failed: {e}")
            raise ValueError(f"Local transcription failed: {e}")

    async def transcribe(self, audio_path: str) -> str:
        """Route to the correct transcription method based on config."""
        if settings.WHISPER_MODE == "api":
            return await self.transcribe_api(audio_path)
        else:
            return self.transcribe_local(audio_path)

    async def analyze_transcript(self, transcript: str) -> dict:
        """
        Send interview transcript to LLM for structured analysis.

        Returns:
            Dict matching InterviewAnalysisResult schema.
        """
        if not transcript or len(transcript.strip()) < 20:
            raise ValueError("Transcript is too short to analyze.")

        # Truncate very long transcripts
        max_chars = 20000
        if len(transcript) > max_chars:
            transcript = transcript[:max_chars] + "\n\n[Transcript truncated for analysis]"

        prompt = INTERVIEW_ANALYSIS_PROMPT.format(transcript=transcript)

        result = await self.llm.analyze(
            prompt=prompt,
            response_model=InterviewAnalysisResult,
            system_prompt=(
                "You are an expert interview evaluator. Analyze interview transcripts "
                "and return structured JSON. Be thorough, objective, and fair. "
                "Scores should be on a 0-100 scale."
            ),
        )

        return result

    async def full_pipeline(self, video_path: str) -> tuple[str, str, dict]:
        """
        Run the complete interview analysis pipeline.

        Returns:
            Tuple of (audio_path, transcript, analysis_result_dict).
        """
        # Step 1: Extract audio
        audio_path = self.extract_audio(video_path)

        # Step 2: Transcribe
        transcript = await self.transcribe(audio_path)

        # Step 3: LLM analysis
        analysis = await self.analyze_transcript(transcript)

        return audio_path, transcript, analysis
