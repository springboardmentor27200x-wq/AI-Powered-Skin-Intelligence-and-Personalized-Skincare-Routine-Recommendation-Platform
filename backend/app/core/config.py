from typing import List, Union
from pydantic_settings import BaseSettings, SettingsConfigDict
from pydantic import AnyHttpUrl, field_validator


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", case_sensitive=False, extra="ignore")

    PROJECT_NAME: str = "AI Skin Intelligence & Personalized Skincare Planner"
    API_V1_STR: str = "/api"
    SECRET_KEY: str = "change-this-to-a-super-secret-jwt-key-for-development-milestone-1-min-32-chars"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24  # 24 hours

    DATABASE_URL: str = "sqlite+aiosqlite:///./skincare.db"
    MONGODB_URL: str = "mongodb://mongo:27017"
    ENVIRONMENT: str = "development"

    # CORS origins
    BACKEND_CORS_ORIGINS: List[str] = [
        "http://localhost:5173",
        "http://localhost:3000",
        "http://127.0.0.1:5173",
        "http://127.0.0.1:3000",
    ]

    @property
    def is_sqlite(self) -> bool:
        return self.DATABASE_URL.startswith("sqlite")


settings = Settings()
