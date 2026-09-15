from datetime import datetime
from typing import Optional
import uuid
from pydantic import BaseModel, ConfigDict, EmailStr, Field


class VenueBase(BaseModel):
    name: str = Field(min_length=2, max_length=150, description="Venue name")
    description: Optional[str] = None
    address: str = Field(min_length=3, max_length=300, description="Road, Block, Landmark address")
    area: Optional[str] = Field(default=None, max_length=100, description="Thana or Area (e.g. Agrabad, Dhanmondi)")
    district: str = Field(default="Chattogram", min_length=2, max_length=100, description="District (e.g. Chattogram, Dhaka)")
    google_maps_url: Optional[str] = Field(default=None, description="Google Maps location link")
    latitude: Optional[float] = Field(default=None, ge=-90.0, le=90.0)
    longitude: Optional[float] = Field(default=None, ge=-180.0, le=180.0)
    contact_phone: Optional[str] = Field(default=None, max_length=20)
    contact_email: Optional[EmailStr] = None


class VenueCreate(VenueBase):
    slug: Optional[str] = Field(
        default=None,
        min_length=2,
        max_length=150,
        description="Optional custom URL slug. If omitted, will be derived from name.",
    )


class VenueUpdate(BaseModel):
    name: Optional[str] = Field(default=None, min_length=2, max_length=150)
    slug: Optional[str] = Field(default=None, min_length=2, max_length=150)
    description: Optional[str] = None
    address: Optional[str] = Field(default=None, min_length=3, max_length=300)
    area: Optional[str] = Field(default=None, max_length=100)
    district: Optional[str] = Field(default=None, min_length=2, max_length=100)
    google_maps_url: Optional[str] = None
    latitude: Optional[float] = Field(default=None, ge=-90.0, le=90.0)
    longitude: Optional[float] = Field(default=None, ge=-180.0, le=180.0)
    contact_phone: Optional[str] = Field(default=None, max_length=20)
    contact_email: Optional[EmailStr] = None
    is_active: Optional[bool] = None


class VenueResponse(VenueBase):
    id: uuid.UUID
    slug: str
    is_active: bool
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)
