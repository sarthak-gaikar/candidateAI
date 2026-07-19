"""
LLM Provider abstraction layer.

Supports OpenAI GPT and Google Gemini, switchable via configuration.
All calls return parsed JSON validated against Pydantic schemas.
"""

import json
import logging
from typing import Type

from pydantic import BaseModel
from langchain_openai import ChatOpenAI
from langchain_core.messages import HumanMessage, SystemMessage

from app.config import settings

logger = logging.getLogger(__name__)


class LLMProvider:
    """
    Unified LLM interface supporting OpenAI and Gemini.

    Usage:
        provider = LLMProvider()
        result = await provider.analyze(prompt, ResponseSchema)
    """

    def __init__(self):
        self.provider = settings.LLM_PROVIDER
        self._llm = self._create_llm()

    def _create_llm(self):
        """Create the appropriate LangChain LLM client based on config."""
        if self.provider == "openai":
            return ChatOpenAI(
                model=settings.LLM_MODEL,
                temperature=settings.LLM_TEMPERATURE,
                max_tokens=settings.LLM_MAX_TOKENS,
                api_key=settings.OPENAI_API_KEY,
            )
        elif self.provider == "gemini":
            try:
                from langchain_google_genai import ChatGoogleGenerativeAI
                return ChatGoogleGenerativeAI(
                    model="gemini-1.5-pro",
                    temperature=settings.LLM_TEMPERATURE,
                    max_tokens=settings.LLM_MAX_TOKENS,
                    google_api_key=settings.GEMINI_API_KEY,
                )
            except ImportError:
                logger.warning("langchain-google-genai not installed, falling back to OpenAI")
                return ChatOpenAI(
                    model=settings.LLM_MODEL,
                    temperature=settings.LLM_TEMPERATURE,
                    max_tokens=settings.LLM_MAX_TOKENS,
                    api_key=settings.OPENAI_API_KEY,
                )
        else:
            raise ValueError(f"Unsupported LLM provider: {self.provider}")

    async def analyze(
        self,
        prompt: str,
        response_model: Type[BaseModel] | None = None,
        system_prompt: str = "You are a helpful AI assistant. Always respond with valid JSON.",
    ) -> dict:
        """
        Send a prompt to the LLM and return parsed JSON.

        Args:
            prompt: The formatted prompt to send.
            response_model: Optional Pydantic model for validation.
            system_prompt: System message for the LLM.

        Returns:
            Parsed JSON as a dict (validated if response_model provided).
        """
        messages = [
            SystemMessage(content=system_prompt),
            HumanMessage(content=prompt),
        ]

        try:
            response = await self._llm.ainvoke(messages)
            content = response.content

            # Extract JSON from the response (handle markdown code blocks)
            json_str = self._extract_json(content)
            parsed = json.loads(json_str)

            # Validate against Pydantic model if provided
            if response_model:
                validated = response_model(**parsed)
                return validated.model_dump()

            return parsed

        except json.JSONDecodeError as e:
            logger.error(f"Failed to parse LLM JSON response: {e}")
            logger.error(f"Raw response: {content[:500]}")
            raise ValueError(f"LLM returned invalid JSON: {e}")
        except Exception as e:
            logger.error(f"LLM analysis failed: {e}")
            raise

    def _extract_json(self, text: str) -> str:
        """Extract JSON from LLM response, handling markdown code blocks."""
        text = text.strip()

        # Handle ```json ... ``` blocks
        if "```json" in text:
            start = text.index("```json") + 7
            end = text.index("```", start)
            return text[start:end].strip()

        # Handle ``` ... ``` blocks
        if text.startswith("```"):
            start = text.index("\n") + 1
            end = text.rindex("```")
            return text[start:end].strip()

        # Already plain JSON
        return text


# ── Module-level singleton ───────────────────────────────────────────────
_provider: LLMProvider | None = None


def get_llm_provider() -> LLMProvider:
    """Get or create the singleton LLM provider."""
    global _provider
    if _provider is None:
        _provider = LLMProvider()
    return _provider
