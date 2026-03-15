import logging
import asyncio
from contextlib import asynccontextmanager
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from slowapi import _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded
from slowapi.middleware import SlowAPIMiddleware
from app.core.config import settings
from app.core.limiter import limiter
from app.core.audit_middleware import HIPAAAuditMiddleware
from app.api.v1.router import api_router
from app.db.database import engine
from app.db import models
from app.services import index_loader

# ---------------------------------------------------------------------------
# Logging configuration
# ---------------------------------------------------------------------------
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
)
logger = logging.getLogger(__name__)

# Create database tables (Safe for production: won't touch existing data)
try:
    models.Base.metadata.create_all(bind=engine)
    logger.info("Database tables created/verified.")
except Exception as e:
    logger.warning(f"Database table verification skipped/failed: {e}")

# ---------------------------------------------------------------------------
# Lifespan – warm up AI indices on startup in a background thread
# ---------------------------------------------------------------------------
@asynccontextmanager
async def lifespan(app: FastAPI):
    # Auto-seed medical codes if necessary (safe, checks for existing data)
    try:
        from seed_code_library import seed_data
        seed_data()
        logger.info("Medical code library verified/seeded.")
    except Exception as e:
        logger.error(f"Auto-seeding failed: {e}")

    logger.info("Starting AI recommendation index warm-up (async executor)...")
    loop = asyncio.get_event_loop()
    loop.run_in_executor(None, index_loader.warm_up)
    yield
    logger.info("HealPay backend shutting down.")


app = FastAPI(
    lifespan=lifespan,
    title=settings.APP_NAME,
    version=settings.APP_VERSION,
    description="AI-Powered Medical Billing System API",
    docs_url=None if settings.ENVIRONMENT == "production" else "/api/docs",
    redoc_url=None if settings.ENVIRONMENT == "production" else "/api/redoc",
    openapi_url=None if settings.ENVIRONMENT == "production" else "/api/openapi.json",
    servers=[
        {"url": settings.BACKEND_URL, "description": "API server"}
    ]
)

# ---------------------------------------------------------------------------
# CORS – driven by FRONTEND_URL env var so Vercel URL is automatically included
# ---------------------------------------------------------------------------
_dev_origins = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "http://localhost:3000",
]
_prod_origins = [settings.FRONTEND_URL] if settings.FRONTEND_URL else []
allowed_origins = list(set(_dev_origins + _prod_origins))

app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)
app.add_middleware(SlowAPIMiddleware)
app.add_middleware(HIPAAAuditMiddleware)

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ---------------------------------------------------------------------------
# Global exception handler
# ---------------------------------------------------------------------------
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    logger.exception("Unhandled exception on %s %s", request.method, request.url)
    return JSONResponse(
        status_code=500,
        content={"detail": "An internal server error occurred. Please try again later."},
    )

# ---------------------------------------------------------------------------
# API router
# ---------------------------------------------------------------------------
app.include_router(api_router, prefix="/api/v1")

logger.info("HealPay backend started — routes registered.")


@app.get("/")
async def root():
    return {
        "message": "Welcome to HealPay Medical Billing System API",
        "version": settings.APP_VERSION,
        "docs": "/api/docs",
    }


@app.get("/health", tags=["System"])
@app.get("/api/v1/health", tags=["System"])   # Also at /api/v1/health for Render health checks
async def health_check():
    from app.services import index_loader
    from app.db.database import engine
    db_ok = True
    try:
        with engine.connect() as conn:
            conn.execute(__import__('sqlalchemy').text("SELECT 1"))
    except Exception:
        db_ok = False
    return {
        "status": "healthy" if db_ok else "degraded",
        "app": settings.APP_NAME,
        "version": settings.APP_VERSION,
        "environment": settings.ENVIRONMENT,
        "ai_index_ready": index_loader._is_loaded,
        "database": "ok" if db_ok else "error",
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8000,
        reload=True,
    )

