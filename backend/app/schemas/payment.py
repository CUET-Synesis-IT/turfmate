from datetime import datetime
from decimal import Decimal
from typing import Optional
import uuid
from pydantic import BaseModel, ConfigDict, Field
from app.models.payment import PaymentMethod, PaymentStatus


class PaymentCreateManual(BaseModel):
    amount: Decimal = Field(..., gt=0)
    payment_method: PaymentMethod
    transaction_id: Optional[str] = None
    notes: Optional[str] = None


class SSLCommerzInitRequest(BaseModel):
    booking_id: uuid.UUID
    amount: Optional[Decimal] = Field(default=None, gt=0)


class SSLCommerzInitResponse(BaseModel):
    status: str
    gateway_url: str
    session_key: Optional[str] = None
    transaction_id: str
    amount: Decimal
    currency: str = "BDT"


class PaymentResponse(BaseModel):
    id: uuid.UUID
    booking_id: uuid.UUID
    amount: Decimal
    currency: str
    payment_method: PaymentMethod
    status: PaymentStatus
    transaction_id: Optional[str] = None
    paid_at: Optional[datetime] = None
    refunded_at: Optional[datetime] = None
    recorded_by_user_id: Optional[uuid.UUID] = None
    notes: Optional[str] = None
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)
