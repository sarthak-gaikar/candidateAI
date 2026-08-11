"""
FastAPI application entry point.

Sets up CORS, routers, lifespan events, and global exception handlers.
"""

from contextlib import asynccontextmanager

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.config import settings


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application startup and shutdown events."""
    # ── Startup ───────────────────────────────────────────────────────────
    # Ensure upload directories exist
    settings.upload_path.mkdir(parents=True, exist_ok=True)
    (settings.upload_path / "resumes").mkdir(exist_ok=True)
    (settings.upload_path / "videos").mkdir(exist_ok=True)
    (settings.upload_path / "audio").mkdir(exist_ok=True)
    (settings.upload_path / "reports").mkdir(exist_ok=True)

    print(f"🚀 {settings.APP_NAME} v{settings.APP_VERSION} starting...")
    print(f"   LLM Provider: {settings.LLM_PROVIDER}")
    print(f"   Whisper Mode: {settings.WHISPER_MODE}")
    database_label = (
        "configured via DATABASE_URL"
        if settings.DATABASE_URL
        else f"{settings.POSTGRES_HOST}:{settings.POSTGRES_PORT}/{settings.POSTGRES_DB}"
    )
    print(f"   Database: {database_label}")

    # Ensure database tables exist
    try:
        from app.database import engine, Base
        import app.models  # noqa: F401
        async with engine.begin() as conn:
            await conn.run_sync(Base.metadata.create_all)
        print("   Database tables verified.")
    except Exception as e:
        print(f"   Warning: Database init error: {e}")

    yield

    # ── Shutdown ──────────────────────────────────────────────────────────
    print(f"👋 {settings.APP_NAME} shutting down...")


def create_app() -> FastAPI:
    """Application factory — creates and configures the FastAPI app."""
    app = FastAPI(
        title=settings.APP_NAME,
        version=settings.APP_VERSION,
        description=(
            "AI-powered candidate evaluation system that automates "
            "resume screening, interview analysis, and candidate ranking."
        ),
        docs_url=f"{settings.API_PREFIX}/docs",
        redoc_url=f"{settings.API_PREFIX}/redoc",
        openapi_url=f"{settings.API_PREFIX}/openapi.json",
        lifespan=lifespan,
    )

    # ── CORS Middleware ───────────────────────────────────────────────────
    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.CORS_ORIGINS,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    # ── Register Routers ─────────────────────────────────────────────────
    from app.api.routes import auth, candidates, resumes, interviews, rankings, reports, search

    app.include_router(auth.router, prefix=f"{settings.API_PREFIX}/auth", tags=["Authentication"])
    app.include_router(candidates.router, prefix=f"{settings.API_PREFIX}/candidates", tags=["Candidates"])
    app.include_router(resumes.router, prefix=f"{settings.API_PREFIX}/resumes", tags=["Resumes"])
    app.include_router(interviews.router, prefix=f"{settings.API_PREFIX}/interviews", tags=["Interviews"])
    app.include_router(rankings.router, prefix=f"{settings.API_PREFIX}/rankings", tags=["Rankings"])
    app.include_router(reports.router, prefix=f"{settings.API_PREFIX}/reports", tags=["Reports"])
    app.include_router(search.router, prefix=f"{settings.API_PREFIX}/search", tags=["Search"])

    # ── Health Check ─────────────────────────────────────────────────────
    @app.get(f"{settings.API_PREFIX}/health", tags=["Health"])
    async def health_check():
        return {
            "status": "healthy",
            "app": settings.APP_NAME,
            "version": settings.APP_VERSION,
        }

    # ── Global Exception Handlers ────────────────────────────────────────
    @app.exception_handler(ValueError)
    async def value_error_handler(request: Request, exc: ValueError):
        return JSONResponse(
            status_code=400,
            content={"detail": str(exc)},
        )

    @app.exception_handler(Exception)
    async def general_exception_handler(request: Request, exc: Exception):
        if settings.DEBUG:
            return JSONResponse(
                status_code=500,
                content={"detail": str(exc), "type": type(exc).__name__},
            )
        return JSONResponse(
            status_code=500,
            content={"detail": "Internal server error"},
        )

    return app


app = create_app()
