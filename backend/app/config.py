import os
from pydantic_settings import BaseSettings
from typing import Optional

class Settings(BaseSettings):
    APP_NAME: str = "AIVOA Pharma QMS - AI Complaint Management"
    APP_VERSION: str = "1.0.0"
    API_PREFIX: str = "/api"
    
    # LLM Settings (Groq default)
    GROQ_API_KEY: Optional[str] = os.getenv("GROQ_API_KEY", "")
    GROQ_MODEL: str = os.getenv("GROQ_MODEL", "gemma2-9b-it") # Or llama-3.3-70b-versatile
    FALLBACK_MODEL: str = "llama-3.3-70b-versatile"
    
    # Database Settings
    DATABASE_URL: str = os.getenv("DATABASE_URL", "sqlite:///./pharma_qms.db")
    
    # CORS
    CORS_ORIGINS: list[str] = ["*"]
    
    class Config:
        env_file = ".env"
        extra = "allow"

settings = Settings()
