from datetime import datetime
from typing import Optional
import uuid
from pydantic import BaseModel, ConfigDict, EmailStr, Field


class VenueBase(BaseModel):
    name: str = Field(min_length=2, max_length=150, description="Venue name")
    description: Optional[str] = None
    address: str = Field(min_length=3, max_length=300, description="Physical address")
    city: str = Field(min_length=2, max_length=100, description="City")
    state_province: Optional[str] = Field(default=None, max_length=100)
    postal_code: Optional[str] = Field(default=None, max_length=20)
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
    city: Optional[str] = Field(default=None, min_length=2, max_length=100)
    state_province: Optional[str] = Field(default=None, max_length=100)
    postal_code: Optional[str] = Field(default=None, max_length=20)
    latitude: Optional[float] = Field(default=None, ge=-90.0, le=90.0)
    longitude: Optional[float] = Field(default=None, ge=-180.0, le=180.0)
    contact_phone: Optional[str] = Field(default=None, max_length=20)
    contact_email: Optional[EmailStr] = None
    is_active: Optional[bool] = None


class VenueResponse(VenueBase):
    id: uuid.UUID
    business_id: uuid.UUID
    slug: str
    is_active: bool
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)
