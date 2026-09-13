from functools import lru_cache
from typing import Annotated, Any
from pydantic import BeforeValidator
from pydantic_settings import BaseSettings, SettingsConfigDict


def parse_cors(v: Any) -> list[str] | str:
    if isinstance(v, str) and not v.startswith("["):
        return [i.strip() for i in v.split(",") if i.strip()]
    elif isinstance(v, list):
        return [str(i) for i in v]
    return v


class Settings(BaseSettings):
    PROJECT_NAME: str = "TurfMate API"
    API_V1_STR: str = "/api/v1"

    FRONTEND_URL: str = "http://localhost:3000"
    BACKEND_API_URL: str = "http://localhost:8000"
    DATABASE_URL: str = "postgresql://postgres:postgres@localhost:5432/turfmate"

    BACKEND_CORS_ORIGINS: Annotated[list[str], BeforeValidator(parse_cors)] = [
        "http://localhost:3000",
        "http://localhost:8000",
    ]

    @property
    def POSTGRES_DATABASE_URL(self) -> str:
        return self.DATABASE_URL

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
        case_sensitive=True,
    )


@lru_cache()
def get_settings() -> Settings:
    return Settings()


settings = get_settings()
