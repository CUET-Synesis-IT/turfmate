from datetime import time
from decimal import Decimal
from typing import Optional
import uuid
from sqlmodel import Field
from sqlalchemy import Numeric, Time
from app.models.base import BaseUUIDModel


class PricingRule(BaseUUIDModel, table=True):
    __tablename__ = "pricing_rules"

    court_id: uuid.UUID = Field(
        foreign_key="courts.id",
        ondelete="CASCADE",
        index=True,
        nullable=False,
    )
    name: str = Field(nullable=False)
    day_of_week: Optional[int] = Field(
        default=None,
        ge=0,
        le=6,
        nullable=True,
        description="Specific day 0-6 (0=Mon, 4=Fri), or null for every day",
    )
    start_time: time = Field(sa_type=Time, nullable=False)
    end_time: time = Field(sa_type=Time, nullable=False)
    price_per_hour: Decimal = Field(
        default=Decimal("0.00"),
        sa_type=Numeric(10, 2),
        nullable=False,
    )
    is_active: bool = Field(default=True, nullable=False)
