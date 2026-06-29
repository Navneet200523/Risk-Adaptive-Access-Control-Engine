"""Application configuration using Pydantic BaseSettings."""
from pydantic_settings import BaseSettings
from typing import Optional
import os


class Settings(BaseSettings):
    # Application
    APP_NAME: str = "RAAC Engine"
    APP_VERSION: str = "1.0.0"
    DEBUG: bool = True
    API_PREFIX: str = "/api"

    # Database
    DATABASE_URL: str = "sqlite+aiosqlite:///./raac.db"
    POSTGRES_URL: Optional[str] = None

    # Redis
    REDIS_URL: str = "redis://localhost:6379/0"
    REDIS_ENABLED: bool = False

    # JWT
    JWT_SECRET: str = "super-secret-change-in-production"
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7

    # SMTP (Gmail)
    SMTP_HOST: str = "smtp.gmail.com"
    SMTP_PORT: int = 587
    SMTP_USER: str = ""
    SMTP_PASS: str = ""

    # OTP
    OTP_EXPIRE_MINUTES: int = 5
    OTP_LENGTH: int = 6

    # Rate Limiting
    RATE_LIMIT_LOGIN: int = 10  # per minute
    RATE_LIMIT_WINDOW: int = 60  # seconds
    ACCOUNT_LOCKOUT_ATTEMPTS: int = 5
    ACCOUNT_LOCKOUT_DURATION: int = 300  # 5 minutes

    # Risk Engine
    RISK_LOW_THRESHOLD: int = 30
    RISK_HIGH_THRESHOLD: int = 60

    # File Storage
    UPLOAD_DIR: str = "uploads"
    MAX_FILE_SIZE: int = 50 * 1024 * 1024  # 50MB

    # GeoIP
    GEOIP_API_URL: str = "http://ip-api.com/json"

    # CORS
    CORS_ORIGINS: list[str] = ["http://localhost:3000", "http://localhost:8000"]

    @property
    def effective_database_url(self) -> str:
        return self.POSTGRES_URL or self.DATABASE_URL

    class Config:
        env_file = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))), ".env")
        case_sensitive = True
        extra = "ignore"


settings = Settings()
