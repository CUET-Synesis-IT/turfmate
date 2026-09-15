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

    # JWT Security Settings
    SECRET_KEY: str = "turfmate-super-secret-jwt-key-2026-production-change-me"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60
    REFRESH_TOKEN_EXPIRE_DAYS: int = 30

    # SSLCOMMERZ Payment Gateway Settings
    SSLCOMMERZ_STORE_ID: str = "testbox"
    SSLCOMMERZ_STORE_PASS: str = "qwerty"
    SSLCOMMERZ_IS_SANDBOX: bool = True
    SSLCOMMERZ_SANDBOX_URL: str = "https://sandbox-gw.sslcommerz.com"
    SSLCOMMERZ_LIVE_URL: str = "https://securepay.sslcommerz.com"

    @property
    def SSLCOMMERZ_BASE_URL(self) -> str:
        return (
            self.SSLCOMMERZ_SANDBOX_URL
            if self.SSLCOMMERZ_IS_SANDBOX
            else self.SSLCOMMERZ_LIVE_URL
        )

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
