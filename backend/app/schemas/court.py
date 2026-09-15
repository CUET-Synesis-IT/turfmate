from datetime import datetime
from decimal import Decimal
from typing import Optional
import uuid
from pydantic import BaseModel, ConfigDict, Field
from app.models.court import SportType
from app.models.venue import FacilityStatus


class CourtBase(BaseModel):
    name: str = Field(min_length=2, max_length=100, description="Court or field name")
    sport_type: SportType = Field(default=SportType.FOOTBALL, description="Type of sport")
    surface_type: Optional[str] = Field(default=None, max_length=100, description="Surface material (e.g. Artificial Turf)")
    court_size: Optional[str] = Field(default=None, max_length=50, description="Size/capacity (e.g. 5-a-side, 7-a-side)")
    base_price_per_hour: Decimal = Field(default=Decimal("1000.00"), ge=0, description="Base hourly price in BDT")
    is_indoor: bool = Field(default=False, description="Whether court is indoor or covered")
    status: FacilityStatus = Field(default=FacilityStatus.ACTIVE, description="Operational status: active, maintenance, inactive")
    status_note: Optional[str] = Field(default=None, description="Status details (e.g. Grass patching until Friday)")


class CourtCreate(CourtBase):
    venue_id: Optional[uuid.UUID] = Field(default=None, description="Optional if provided in route path")


class CourtUpdate(BaseModel):
    name: Optional[str] = Field(default=None, min_length=2, max_length=100)
    sport_type: Optional[SportType] = None
    surface_type: Optional[str] = Field(default=None, max_length=100)
    court_size: Optional[str] = Field(default=None, max_length=50)
    base_price_per_hour: Optional[Decimal] = Field(default=None, ge=0)
    is_indoor: Optional[bool] = None
    status: Optional[FacilityStatus] = None
    status_note: Optional[str] = None
    is_active: Optional[bool] = None


class CourtResponse(CourtBase):
    id: uuid.UUID
    venue_id: uuid.UUID
    is_active: bool
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)
