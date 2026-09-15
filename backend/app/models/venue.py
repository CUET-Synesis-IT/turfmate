from typing import Optional
from sqlmodel import Field
from app.models.base import BaseUUIDModel


class Venue(BaseUUIDModel, table=True):
    __tablename__ = "venues"

    name: str = Field(nullable=False)
    slug: str = Field(unique=True, index=True, nullable=False)
    description: Optional[str] = Field(default=None, nullable=True)
    address: str = Field(nullable=False)
    area: Optional[str] = Field(default=None, index=True, nullable=True)
    district: str = Field(default="Chattogram", index=True, nullable=False)
    google_maps_url: Optional[str] = Field(default=None, nullable=True)
    latitude: Optional[float] = Field(default=None, nullable=True)
    longitude: Optional[float] = Field(default=None, nullable=True)
    contact_phone: Optional[str] = Field(default=None, nullable=True)
    contact_email: Optional[str] = Field(default=None, nullable=True)
    is_active: bool = Field(default=True, nullable=False)
