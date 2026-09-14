from typing import Optional
from sqlmodel import Field
from app.models.base import BaseUUIDModel


class User(BaseUUIDModel, table=True):
    __tablename__ = "users"

    phone_number: str = Field(unique=True, index=True, nullable=False)
    email: Optional[str] = Field(default=None, unique=True, index=True, nullable=True)
    full_name: str = Field(nullable=False)
    hashed_password: str = Field(nullable=False)
    is_active: bool = Field(default=True, nullable=False)
    is_superuser: bool = Field(default=False, nullable=False)
    avatar_url: Optional[str] = Field(default=None, nullable=True)
