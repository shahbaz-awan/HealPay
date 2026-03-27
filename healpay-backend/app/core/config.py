from pydantic_settings import BaseSettings
from typing import List
import os
import logging
from dotenv import load_dotenv

load_dotenv()

logger = logging.getLogger(__name__)

_DEFAULT_SECRET = "your-super-secret-key-change-in-production-make-it-long-and-random"

class Settings(BaseSettings):
    # Application
    APP_NAME: str = "HealPay Medical Billing System"
    APP_VERSION: str = "1.0.0"
    ENVIRONMENT: str = os.getenv("ENVIRONMENT", "development")  # development | production

    @property
    def DEBUG(self) -> bool:
        return self.ENVIRONMENT == "development"

    # Database — SQLite for dev, Postgres for production
    DATABASE_URL: str = os.getenv(
        "DATABASE_URL",
        "sqlite:///./healpay.db"  # Override with postgres:// in production .env
    )

    # JWT
    SECRET_KEY: str = os.getenv("SECRET_KEY", _DEFAULT_SECRET)
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "30"))
    REFRESH_TOKEN_EXPIRE_DAYS: int = int(os.getenv("REFRESH_TOKEN_EXPIRE_DAYS", "7"))

    # CORS
    BACKEND_CORS_ORIGINS: List[str] = [
        "http://localhost:5173",
        "http://localhost:3000",
        "http://localhost:8000"
    ]

    # Google OAuth
    GOOGLE_CLIENT_ID: str = os.getenv("GOOGLE_CLIENT_ID", "your-google-client-id")
    GOOGLE_CLIENT_SECRET: str = os.getenv("GOOGLE_CLIENT_SECRET", "your-google-client-secret")

    # Frontend / Backend URLs (for email links and Google SSO callback)
    FRONTEND_URL: str = os.getenv("FRONTEND_URL", "http://localhost:5173")
    BACKEND_URL: str = os.getenv("BACKEND_URL", "http://localhost:8000")

    # Field-level encryption key (PHI: SSN, DOB, insurance numbers)
    ENCRYPTION_KEY: str = os.getenv("ENCRYPTION_KEY", "your-encryption-key-32-chars!!")

    # Email Configuration (SMTP)
    # Leave SMTP_USER empty for development mode (OTPs logged to console)
    SMTP_HOST: str = os.getenv("SMTP_HOST", "smtp.gmail.com")
    SMTP_PORT: int = int(os.getenv("SMTP_PORT", "587"))
    SMTP_USER: str = os.getenv("SMTP_USER", "")
    SMTP_PASSWORD: str = os.getenv("SMTP_PASSWORD", "")
    SMTP_FROM_EMAIL: str = os.getenv("SMTP_FROM_EMAIL", "noreply@healpay.com")
    SMTP_FROM_NAME: str = "HealPay System"

    # OTP Configuration
    OTP_EXPIRE_MINUTES: int = 10
    OTP_LENGTH: int = 6

    # ---------------------------------------------------------------------------
    # Mock Services Configuration
    # ---------------------------------------------------------------------------
    # Delay (seconds) before a submitted claim is auto-adjudicated in demo mode
    MOCK_ADJUDICATION_DELAY_SECONDS: int = int(os.getenv("MOCK_ADJUDICATION_DELAY_SECONDS", "120"))
    # Approval rate for mock clearinghouse (0.0 - 1.0)
    MOCK_APPROVAL_RATE: float = float(os.getenv("MOCK_APPROVAL_RATE", "0.82"))

    # ---------------------------------------------------------------------------
    # AI Recommendation Engine
    # ---------------------------------------------------------------------------
    # paraphrase-MiniLM-L3-v2: 3-layer model, ~60MB, 384 dims
    # Significantly lighter than L6 or PubMedBert; fits Koyeb 512MB RAM
    EMBEDDING_MODEL: str = "paraphrase-MiniLM-L3-v2"
    # Maximum codes per type to embed (memory budget: 5k × 384 × 4B ≈ 7.7MB each)
    MAX_CODES_PER_TYPE: int = 5000
    DENSE_WEIGHT: float = 0.75
    BM25_WEIGHT: float = 0.25
    MEDICAL_VALIDATION_THRESHOLD: float = 0.18
    # Deterministic directory for precomputed index files (baked into Docker image)
    EMBEDDINGS_CACHE_DIR: str = "embeddings_cache"
    ICD_DATASET_PATH: str = os.path.join(
        os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))),
        "Recommendation_Dataset", "ICD10codes.csv"
    )
    CPT_DATASET_PATH: str = os.path.join(
        os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))),
        "Recommendation_Dataset", "cpt_codes.csv"
    )

    class Config:
        case_sensitive = True
        env_file = ".env"
        extra = "ignore"

settings = Settings()

# Warn loudly if the default insecure secret key is still in use
if settings.SECRET_KEY == _DEFAULT_SECRET:
    logger.warning(
        "SECURITY WARNING: Using the default SECRET_KEY. "
        "Set a secure random value in your .env file before deploying to production."
    )

if settings.ENVIRONMENT == "production" and "sqlite" in settings.DATABASE_URL:
    logger.warning(
        "CONFIGURATION WARNING: SQLite is not suitable for production. "
        "Set DATABASE_URL to a PostgreSQL connection string."
    )
