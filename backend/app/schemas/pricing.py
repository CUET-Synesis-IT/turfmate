from datetime import datetime, time
from decimal import Decimal
from typing import Optional
import uuid
from pydantic import BaseModel, ConfigDict, Field


class PricingRuleBase(BaseModel):
    name: str = Field(min_length=2, max_length=100, description="Rule name, e.g. Night Floodlight, Friday Peak")
    day_of_week: Optional[int] = Field(
        default=None,
        ge=0,
        le=6,
        description="Day of week (0=Monday, 4=Friday, 6=Sunday), or None for every day",
    )
    start_time: time = Field(description="Rule start time")
    end_time: time = Field(description="Rule end time")
    price_per_hour: Decimal = Field(ge=0, description="Price per hour under this rule in BDT")
    is_active: bool = Field(default=True, description="Whether rule is enabled")


class PricingRuleCreate(PricingRuleBase):
    pass


class PricingRuleUpdate(BaseModel):
    name: Optional[str] = Field(default=None, min_length=2, max_length=100)
    day_of_week: Optional[int] = Field(default=None, ge=0, le=6)
    start_time: Optional[time] = None
    end_time: Optional[time] = None
    price_per_hour: Optional[Decimal] = Field(default=None, ge=0)
    is_active: Optional[bool] = None


class PricingRuleResponse(PricingRuleBase):
    id: uuid.UUID
    court_id: uuid.UUID
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)
