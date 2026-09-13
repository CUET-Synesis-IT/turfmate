from enum import Enum
from typing import Optional
import uuid
from sqlmodel import Field
from sqlalchemy import UniqueConstraint
from app.models.base import BaseUUIDModel


class BusinessRole(str, Enum):
    OWNER = "owner"
    MANAGER = "manager"
    STAFF = "staff"


class Business(BaseUUIDModel, table=True):
    __tablename__ = "businesses"

    name: str = Field(nullable=False)
    slug: str = Field(unique=True, index=True, nullable=False)
    email: Optional[str] = Field(default=None, nullable=True)
    phone_number: Optional[str] = Field(default=None, nullable=True)
    description: Optional[str] = Field(default=None, nullable=True)
    logo_url: Optional[str] = Field(default=None, nullable=True)
    is_active: bool = Field(default=True, nullable=False)


class BusinessMember(BaseUUIDModel, table=True):
    __tablename__ = "business_members"
    __table_args__ = (
        UniqueConstraint("business_id", "user_id", name="uq_business_member"),
    )

    business_id: uuid.UUID = Field(
        foreign_key="businesses.id",
        ondelete="CASCADE",
        index=True,
        nullable=False,
    )
    user_id: uuid.UUID = Field(
        foreign_key="users.id",
        ondelete="CASCADE",
        index=True,
        nullable=False,
    )
    role: BusinessRole = Field(default=BusinessRole.STAFF, nullable=False)
    is_active: bool = Field(default=True, nullable=False)
