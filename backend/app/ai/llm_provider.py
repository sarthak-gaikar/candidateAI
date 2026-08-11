"""
LLM Provider abstraction layer.

Supports OpenAI GPT and Google Gemini, switchable via configuration.
All calls return parsed JSON validated against Pydantic schemas.
"""

import json
import logging
from typing import Type

from pydantic import BaseModel
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_core.messages import HumanMessage, SystemMessage

from app.config import settings

logger = logging.getLogger(__name__)


class LLMProvider:
    """
    LLM interface using Google Gemini AI.

    Usage:
        provider = LLMProvider()
        result = await provider.analyze(prompt, ResponseSchema)
    """

    def __init__(self):
        self._llm = self._create_llm()

    def _create_llm(self):
        """Create Google Gemini LangChain LLM client based on config."""
        model_name = settings.LLM_MODEL or "gemini-2.5-flash"
        return ChatGoogleGenerativeAI(
            model=model_name,
            temperature=settings.LLM_TEMPERATURE,
            max_output_tokens=settings.LLM_MAX_TOKENS,
            google_api_key=settings.GEMINI_API_KEY,
        )

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
            if response_model:
                structured_llm = self._llm.with_structured_output(response_model)
                result = await structured_llm.ainvoke(messages)

                if isinstance(result, BaseModel):
                    return result.model_dump()

                return result

            response = await self._llm.ainvoke(messages)
            content = response.content

            json_str = self._extract_json(content)
            parsed = json.loads(json_str)

            return parsed

        except json.JSONDecodeError as e:
            logger.error(f"Failed to parse LLM JSON response: {e}")
            logger.error(f"Raw response: {content[:500]}")
            raise ValueError(f"LLM returned invalid JSON: {e}")
        except Exception as e:
            logger.error(f"LLM analysis failed: {e}")
            if 'content' in locals():
                logger.error(f"Raw LLM response: {content[:2000]}")
            raise

    # def _extract_json(self, text: str) -> str:
    #     """Extract JSON from LLM response, handling markdown code blocks."""
    #     text = text.strip()

    #     # Handle ```json ... ``` blocks
    #     if "```json" in text:
    #         start = text.index("```json") + 7
    #         end = text.index("```", start)
    #         return text[start:end].strip()

    #     # Handle ``` ... ``` blocks
    #     if text.startswith("```"):
    #         start = text.index("\n") + 1
    #         end = text.rindex("```")
    #         return text[start:end].strip()

    #     # Already plain JSON
    #     return text
    def _extract_json(self, text: str) -> str:
        text = text.strip()

        # Case 1: ```json ... ```
        if "```json" in text:
            start = text.find("```json") + len("```json")
            end = text.find("```", start)

            if end != -1:
                return text[start:end].strip()

        # Case 2: ``` ... ```
        if text.startswith("```"):
            first_newline = text.find("\n")

            if first_newline != -1:
                end = text.find("```", first_newline + 1)

                if end != -1:
                    return text[first_newline + 1:end].strip()

        # Case 3: Plain JSON
        if text.startswith("{") and text.endswith("}"):
            return text

        # Case 4: JSON embedded in additional text
        start = text.find("{")
        end = text.rfind("}")

        if start != -1 and end != -1 and end > start:
            return text[start:end + 1].strip()

        raise ValueError(
            f"Could not find JSON object in LLM response. "
            f"Response preview: {text[:500]}"
        )


# ── Module-level singleton ───────────────────────────────────────────────
_provider: LLMProvider | None = None


def get_llm_provider() -> LLMProvider:
    """Get or create the singleton LLM provider."""
    global _provider
    if _provider is None:
        _provider = LLMProvider()
    return _provider
