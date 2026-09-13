from typing import Optional
import uuid
from sqlmodel import Field
from sqlalchemy import UniqueConstraint
from app.models.base import BaseUUIDModel


class Venue(BaseUUIDModel, table=True):
    __tablename__ = "venues"
    __table_args__ = (
        UniqueConstraint("business_id", "slug", name="uq_venue_business_slug"),
    )

    business_id: uuid.UUID = Field(
        foreign_key="businesses.id",
        ondelete="CASCADE",
        index=True,
        nullable=False,
    )
    name: str = Field(nullable=False)
    slug: str = Field(index=True, nullable=False)
    description: Optional[str] = Field(default=None, nullable=True)
    address: str = Field(nullable=False)
    city: str = Field(index=True, nullable=False)
    state_province: Optional[str] = Field(default=None, nullable=True)
    postal_code: Optional[str] = Field(default=None, nullable=True)
    latitude: Optional[float] = Field(default=None, nullable=True)
    longitude: Optional[float] = Field(default=None, nullable=True)
    contact_phone: Optional[str] = Field(default=None, nullable=True)
    contact_email: Optional[str] = Field(default=None, nullable=True)
    is_active: bool = Field(default=True, nullable=False)
