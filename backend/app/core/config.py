"""
Application configuration settings
"""

from typing import List, Optional

from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    """Application settings loaded from environment variables"""

    # Database Configuration
    MONGODB_URL: str
    MONGODB_DB_NAME: str

    # Redis Configuration
    REDIS_HOST: str = "localhost"
    REDIS_PORT: int = 6379
    REDIS_DB: int = 0

    # Server Configuration
    BACKEND_HOST: str = "localhost"
    BACKEND_PORT: int = 8000
    BACKEND_URL: str = "http://localhost:8000"
    CORS_ORIGINS: str

    # Security Configuration
    SECRET_KEY: str
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int
    API_V1_STR: str = "/api/v1"
    API_RATE_LIMIT: int = 100

    # Social Configuration
    SOCIAL_AUTH_PROVIDERS: List[str] = ["google", "linkedin"]
    SOCIAL_AUTH_REDIRECT_URI: str = "http://localhost:8000/auth/callback"
    GOOGLE_CLIENT_ID: Optional[str] = None
    GOOGLE_CLIENT_SECRET: Optional[str] = None

    # AI Services Configuration
    GROQ_API_KEY: Optional[str] = None
    OPENAI_API_KEY: Optional[str] = None

    # AI Scoring / LLM Provider Configuration (additive)
    PROVIDER: str = "openai"  # openai | groq
    OPENAI_BASE_URL: Optional[str] = None
    OPENAI_MODEL: str = "gpt-4"
    GROQ_MODEL: str = "llama-3.1-70b-versatile"
    ENABLE_SCORING: bool = True
    SCORING_TEMPERATURE: float = 0.2
    SCORING_MAX_TOKENS: int = 1200
    CACHE_TTL_SECONDS: int = 300

    # Scoring Prompt/Response Logging
    LOG_SCORING_PROMPTS: bool = False
    LOG_SCORING_RESPONSES: bool = False
    LOG_SCORING_TRUNCATE_CHARS: int = 2000


    # Vector DB (Qdrant) Configuration
    QDRANT_URL: Optional[str] = None
    QDRANT_API_KEY: Optional[str] = None
    QDRANT_PATH: str = "qdrant_db"
    QDRANT_COLLECTION: str = "resume_chunks"
    EMBEDDING_DIM: int = 1536

    # LinkedIn Integration
    LINKEDIN_CLIENT_ID: Optional[str] = None
    LINKEDIN_CLIENT_SECRET: Optional[str] = None
    LINKEDIN_REDIRECT_URI: Optional[str] = None

    # Indeed Integration
    INDEED_API_KEY: Optional[str] = None
    INDEED_PUBLISHER_ID: Optional[str] = None

    # Glassdoor Integration
    GLASSDOOR_API_KEY: Optional[str] = None
    GLASSDOOR_PARTNER_ID: Optional[str] = None

    # ZipRecruiter Integration
    ZIPRECRUITER_API_KEY: Optional[str] = None
    ZIPRECRUITER_ACCOUNT_ID: Optional[str] = None

    # Google Drive Integration
    GOOGLE_DRIVE_CLIENT_ID: Optional[str] = None
    GOOGLE_DRIVE_CLIENT_SECRET: Optional[str] = None
    GOOGLE_DRIVE_REDIRECT_URI: str = "http://localhost:8000/api/v1/google-drive/callback"

    # File Upload Configuration
    MAX_FILE_SIZE: int = 10485760  # 10MB
    UPLOAD_DIR: str = "./uploads"
    ALLOWED_EXTENSIONS: str = ".pdf,.doc,.docx,.txt"

    # Redis Cache Configuration
    REDIS_URL: str
    CACHE_EXPIRE_SECONDS: int
    OTP_EXPIRE: int

    # Email Configuration
    SMTP_HOST: Optional[str] = None
    SMTP_PORT: int = 587
    SMTP_USER: Optional[str] = None
    SMTP_PASSWORD: Optional[str] = None
    EMAIL_FROM: str = "noreply@resumescreener.com"

    # Development Settings
    DEBUG: bool = True
    LOG_LEVEL: str = "INFO"
    ENVIRONMENT: str

    # Job Board Settings
    DEFAULT_JOB_EXPIRY_DAYS: int = 30
    MAX_JOBS_PER_USER: int = 50
    MAX_CANDIDATES_PER_USER: int = 1000

    # Analytics Configuration
    ANALYTICS_RETENTION_DAYS: int = 365
    ENABLE_ANALYTICS: bool = True

    # Security Headers
    ENABLE_CORS: bool = True
    ENABLE_RATE_LIMITING: bool = True
    ENABLE_HTTPS_REDIRECT: bool = False

    @property
    def allowed_extensions_list(self) -> List[str]:
        """Convert comma-separated extensions to list"""
        return [ext.strip() for ext in self.ALLOWED_EXTENSIONS.split(",")]

    @property
    def cors_origins_list(self) -> List[str]:
        """Convert comma-separated origins to list"""
        return [origin.strip() for origin in self.CORS_ORIGINS.split(",")]

    @property
    def is_production(self) -> bool:
        """Check if running in production environment"""
        return self.ENVIRONMENT.lower() == "production"

    @property
    def is_development(self) -> bool:
        """Check if running in development environment"""
        return self.ENVIRONMENT.lower() == "development"

    def get_database_url(self) -> str:
        """Get the complete database URL"""
        return f"{self.MONGODB_URL}/{self.MONGODB_DB_NAME}"

    class Config:
        # Ensure we always read backend/.env regardless of current working directory
        import os as _os
        env_file = _os.path.join(_os.path.dirname(_os.path.dirname(_os.path.dirname(__file__))), ".env")
        env_file_encoding = "utf-8"
        case_sensitive = True
        extra = "ignore"


# Create settings instance
settings = Settings()
