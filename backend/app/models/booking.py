from datetime import datetime
from decimal import Decimal
from enum import Enum
from typing import Optional
import uuid
from sqlmodel import Field
from sqlalchemy import DateTime, Numeric
from app.models.base import BaseUUIDModel


class BookingStatus(str, Enum):
    PENDING = "pending"
    CONFIRMED = "confirmed"
    COMPLETED = "completed"
    CANCELLED = "cancelled"
    NO_SHOW = "no_show"
    BLOCKED = "blocked"


class Booking(BaseUUIDModel, table=True):
    __tablename__ = "bookings"

    booking_reference: str = Field(unique=True, index=True, nullable=False)
    court_id: uuid.UUID = Field(
        foreign_key="courts.id",
        ondelete="RESTRICT",
        index=True,
        nullable=False,
    )
    customer_id: uuid.UUID = Field(
        foreign_key="users.id",
        ondelete="RESTRICT",
        index=True,
        nullable=False,
    )
    start_datetime: datetime = Field(
        sa_type=DateTime(timezone=True),
        index=True,
        nullable=False,
    )
    end_datetime: datetime = Field(
        sa_type=DateTime(timezone=True),
        index=True,
        nullable=False,
    )
    status: BookingStatus = Field(
        default=BookingStatus.PENDING,
        index=True,
        nullable=False,
    )
    total_amount: Decimal = Field(
        default=Decimal("0.00"),
        sa_type=Numeric(10, 2),
        nullable=False,
    )
    deposit_paid: Decimal = Field(
        default=Decimal("0.00"),
        sa_type=Numeric(10, 2),
        nullable=False,
    )
    customer_notes: Optional[str] = Field(default=None, nullable=True)
    internal_notes: Optional[str] = Field(default=None, nullable=True)
    cancellation_reason: Optional[str] = Field(default=None, nullable=True)
    cancelled_at: Optional[datetime] = Field(
        default=None,
        sa_type=DateTime(timezone=True),
        nullable=True,
    )
    created_by_user_id: Optional[uuid.UUID] = Field(
        default=None,
        foreign_key="users.id",
        ondelete="SET NULL",
        nullable=True,
    )
