from enum import Enum
from typing import Optional
from sqlmodel import Field
from app.models.base import BaseUUIDModel


class UserRole(str, Enum):
    ADMIN = "admin"
    STAFF = "staff"
    CUSTOMER = "customer"


class User(BaseUUIDModel, table=True):
    __tablename__ = "users"

    phone_number: str = Field(unique=True, index=True, nullable=False)
    email: Optional[str] = Field(default=None, unique=True, index=True, nullable=True)
    full_name: str = Field(nullable=False)
    hashed_password: str = Field(nullable=False)
    role: UserRole = Field(default=UserRole.CUSTOMER, index=True, nullable=False)
    is_active: bool = Field(default=True, nullable=False)
    is_superuser: bool = Field(default=False, nullable=False)
    avatar_url: Optional[str] = Field(default=None, nullable=True)
