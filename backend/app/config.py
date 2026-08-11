"""
Application configuration using Pydantic BaseSettings.

All environment variables are loaded, validated, and typed here.
Access settings anywhere via: `from app.config import settings`
"""

from pathlib import Path
from functools import lru_cache
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Global application settings loaded from environment variables."""

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore",
    )

    # ── Application ───────────────────────────────────────────────────────
    APP_NAME: str = "AI Candidate Evaluation System"
    APP_VERSION: str = "1.0.0"
    DEBUG: bool = False
    API_PREFIX: str = "/api"

    # ── Database ──────────────────────────────────────────────────────────
    POSTGRES_USER: str = "candidate_eval"
    POSTGRES_PASSWORD: str = "password"
    POSTGRES_DB: str = "candidate_eval_db"
    POSTGRES_HOST: str = "localhost"
    POSTGRES_PORT: int = 5432
    DATABASE_URL: str | None = None

    @property
    def database_url(self) -> str:
        """Construct the async database URL."""
        if self.DATABASE_URL:
            return self.DATABASE_URL
        return (
            f"postgresql+asyncpg://{self.POSTGRES_USER}:{self.POSTGRES_PASSWORD}"
            f"@{self.POSTGRES_HOST}:{self.POSTGRES_PORT}/{self.POSTGRES_DB}"
        )

    @property
    def database_url_sync(self) -> str:
        """Construct the sync database URL (for Alembic migrations)."""
        return self.database_url.replace("+asyncpg", "")

    # ── Authentication ────────────────────────────────────────────────────
    JWT_SECRET_KEY: str = "change-this-in-production"
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7

    # ── AI / LLM ─────────────────────────────────────────────────────────
    LLM_PROVIDER: str = "gemini"
    GEMINI_API_KEY: str = ""
    LLM_MODEL: str = "gemini-2.5-flash"
    LLM_TEMPERATURE: float = 0.1
    LLM_MAX_TOKENS: int = 4096

    # ── Whisper / Audio Transcription ─────────────────────────────────────
    WHISPER_MODE: str = "api"  # "api" (Gemini API) or "local" (local whisper model)
    WHISPER_LOCAL_MODEL: str = "base"  # For local mode: tiny, base, small, medium, large

    # ── Embeddings ────────────────────────────────────────────────────────
    EMBEDDING_MODEL: str = "all-MiniLM-L6-v2"

    # ── File Upload ───────────────────────────────────────────────────────
    MAX_UPLOAD_SIZE_MB: int = 500
    UPLOAD_DIR: str = "./uploads"

    @property
    def upload_path(self) -> Path:
        """Get the upload directory as a Path object, creating it if needed."""
        path = Path(self.UPLOAD_DIR)
        path.mkdir(parents=True, exist_ok=True)
        return path

    @property
    def max_upload_bytes(self) -> int:
        return self.MAX_UPLOAD_SIZE_MB * 1024 * 1024

    # ── CORS ──────────────────────────────────────────────────────────────
    CORS_ORIGINS: list[str] = [
        "http://localhost:5173",
        "http://localhost:3000",
        "http://127.0.0.1:5173",
    ]


@lru_cache()
def get_settings() -> Settings:
    """Cache and return the global settings instance."""
    return Settings()


settings = get_settings()
