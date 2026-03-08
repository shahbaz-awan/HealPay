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
    DEBUG: bool = True
    
    # Database
    DATABASE_URL: str = os.getenv(
        "DATABASE_URL",
        "sqlite:///./healpay.db"
    )
    
    # JWT
    SECRET_KEY: str = os.getenv("SECRET_KEY", "your-super-secret-key-change-in-production-make-it-long-and-random")
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7
    
    # CORS
    BACKEND_CORS_ORIGINS: List[str] = [
        "http://localhost:5173",
        "http://localhost:3000",
        "http://localhost:8000"
    ]

    # Google OAuth
    GOOGLE_CLIENT_ID: str = os.getenv("GOOGLE_CLIENT_ID", "your-google-client-id")
    GOOGLE_CLIENT_SECRET: str = os.getenv("GOOGLE_CLIENT_SECRET", "your-google-client-secret")
    
    # Frontend URL (for email links and Google SSO callback)
    FRONTEND_URL: str = os.getenv("FRONTEND_URL", "http://localhost:5173")
    BACKEND_URL: str = os.getenv("BACKEND_URL", "http://localhost:8000")
    
    # Encryption
    ENCRYPTION_KEY: str = os.getenv("ENCRYPTION_KEY", "your-encryption-key-32-chars!!")
    
    # Email Configuration (SMTP)
    # Leave empty for development mode (OTPs will be logged to console)
    SMTP_HOST: str = os.getenv("SMTP_HOST", "smtp.gmail.com")
    SMTP_PORT: int = int(os.getenv("SMTP_PORT", "587"))
    SMTP_USER: str = os.getenv("SMTP_USER", "")  # Empty = Development Mode
    SMTP_PASSWORD: str = os.getenv("SMTP_PASSWORD", "")  # Empty = Development Mode
    SMTP_FROM_EMAIL: str = os.getenv("SMTP_FROM_EMAIL", "noreply@healpay.com")
    SMTP_FROM_NAME: str = "HealPay System"
    
    # OTP Configuration
    OTP_EXPIRE_MINUTES: int = 10  # OTP expires in 10 minutes
    OTP_LENGTH: int = 6
    
    # ---------------------------------------------------------------------------
    # AI Recommendation Engine
    # ---------------------------------------------------------------------------
    EMBEDDING_MODEL: str = "pritamdeka/S-PubMedBert-MS-MARCO"
    EMBEDDING_FALLBACK_MODEL: str = "all-MiniLM-L6-v2"
    MAX_ICD_EMBED: int = 5000          # ICD codes sampled for FAISS
    DENSE_WEIGHT: float = 0.75         # FAISS semantic weight in hybrid score
    BM25_WEIGHT: float = 0.25          # BM25 lexical weight in hybrid score
    MEDICAL_VALIDATION_THRESHOLD: float = 0.18  # Min cosine sim for medical check
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
        extra = "ignore"  # Allow extra fields from .env

settings = Settings()

# Warn loudly if the default insecure secret key is still in use
if settings.SECRET_KEY == _DEFAULT_SECRET:
    logger.warning(
        "SECURITY WARNING: Using the default SECRET_KEY. "
        "Set a secure random value in your .env file before deploying to production."
    )

