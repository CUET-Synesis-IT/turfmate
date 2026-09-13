from datetime import datetime
from decimal import Decimal
from enum import Enum
from typing import Optional
import uuid
from sqlmodel import Field
from sqlalchemy import DateTime, Numeric
from app.models.base import BaseUUIDModel


class PaymentMethod(str, Enum):
    CASH = "cash"
    BKASH = "bkash"
    NAGAD = "nagad"
    CARD = "card"
    ONLINE_GATEWAY = "online_gateway"
    BANK_TRANSFER = "bank_transfer"


class PaymentStatus(str, Enum):
    PENDING = "pending"
    COMPLETED = "completed"
    FAILED = "failed"
    REFUNDED = "refunded"


class Payment(BaseUUIDModel, table=True):
    __tablename__ = "payments"

    booking_id: uuid.UUID = Field(
        foreign_key="bookings.id",
        ondelete="CASCADE",
        index=True,
        nullable=False,
    )
    amount: Decimal = Field(
        default=Decimal("0.00"),
        sa_type=Numeric(10, 2),
        nullable=False,
    )
    currency: str = Field(default="BDT", max_length=10, nullable=False)
    payment_method: PaymentMethod = Field(
        default=PaymentMethod.CASH,
        nullable=False,
    )
    status: PaymentStatus = Field(
        default=PaymentStatus.PENDING,
        index=True,
        nullable=False,
    )
    transaction_id: Optional[str] = Field(default=None, index=True, nullable=True)
    paid_at: Optional[datetime] = Field(
        default=None,
        sa_type=DateTime(timezone=True),
        nullable=True,
    )
    refunded_at: Optional[datetime] = Field(
        default=None,
        sa_type=DateTime(timezone=True),
        nullable=True,
    )
    recorded_by_user_id: Optional[uuid.UUID] = Field(
        default=None,
        foreign_key="users.id",
        ondelete="SET NULL",
        nullable=True,
    )
    notes: Optional[str] = Field(default=None, nullable=True)
