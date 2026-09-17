from datetime import date, datetime
from decimal import Decimal
from typing import Optional
import uuid
from pydantic import BaseModel, ConfigDict, Field
from app.models.booking import BookingStatus
from app.models.court import SportType
from app.models.venue import FacilityStatus


class SlotInfo(BaseModel):
    start_time: datetime
    end_time: datetime
    price: Decimal
    is_available: bool
    status: str  # "available", "booked", "blocked", "maintenance"
    reason: Optional[str] = None


class CourtAvailabilityResponse(BaseModel):
    court_id: uuid.UUID
    court_name: str
    date: date
    venue_id: uuid.UUID
    venue_name: str
    venue_status: FacilityStatus
    court_status: FacilityStatus
    slots: list[SlotInfo]


class BookingCreate(BaseModel):
    court_id: uuid.UUID
    start_datetime: datetime
    end_datetime: datetime
    customer_notes: Optional[str] = None


class BookingStaffCreate(BaseModel):
    court_id: uuid.UUID
    start_datetime: datetime
    end_datetime: datetime
    customer_id: Optional[uuid.UUID] = None
    customer_phone: Optional[str] = None
    customer_name: Optional[str] = None
    deposit_paid: Decimal = Field(default=Decimal("0.00"), ge=0)
    status: BookingStatus = BookingStatus.CONFIRMED
    customer_notes: Optional[str] = None
    internal_notes: Optional[str] = None


class BookingBlockCreate(BaseModel):
    court_id: uuid.UUID
    start_datetime: datetime
    end_datetime: datetime
    reason: str
    internal_notes: Optional[str] = None


class BookingStatusUpdate(BaseModel):
    status: BookingStatus
    internal_notes: Optional[str] = None


class BookingCancel(BaseModel):
    cancellation_reason: str


class CustomerSummary(BaseModel):
    id: uuid.UUID
    full_name: str
    phone_number: str
    email: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)


class CourtSummary(BaseModel):
    id: uuid.UUID
    name: str
    sport_type: SportType
    venue_id: uuid.UUID
    venue_name: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)


class BookingResponse(BaseModel):
    id: uuid.UUID
    booking_reference: str
    court_id: uuid.UUID
    court: Optional[CourtSummary] = None
    customer_id: uuid.UUID
    customer: Optional[CustomerSummary] = None
    start_datetime: datetime
    end_datetime: datetime
    status: BookingStatus
    total_amount: Decimal
    deposit_paid: Decimal
    remaining_balance: Decimal
    customer_notes: Optional[str] = None
    internal_notes: Optional[str] = None
    cancellation_reason: Optional[str] = None
    cancelled_at: Optional[datetime] = None
    created_by_user_id: Optional[uuid.UUID] = None
    expires_at: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)
