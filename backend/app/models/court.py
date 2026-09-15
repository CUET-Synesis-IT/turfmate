from decimal import Decimal
from enum import Enum
from typing import Optional
import uuid
from sqlmodel import Field
from sqlalchemy import Numeric, UniqueConstraint
from app.models.base import BaseUUIDModel


class SportType(str, Enum):
    FOOTBALL = "football"
    CRICKET = "cricket"
    BADMINTON = "badminton"
    OTHER = "other"


class Court(BaseUUIDModel, table=True):
    __tablename__ = "courts"
    __table_args__ = (
        UniqueConstraint("venue_id", "name", name="uq_court_venue_name"),
    )

    venue_id: uuid.UUID = Field(
        foreign_key="venues.id",
        ondelete="CASCADE",
        index=True,
        nullable=False,
    )
    name: str = Field(nullable=False)
    sport_type: SportType = Field(default=SportType.FOOTBALL, nullable=False)
    surface_type: Optional[str] = Field(default=None, nullable=True)
    court_size: Optional[str] = Field(default=None, nullable=True)
    base_price_per_hour: Decimal = Field(
        default=Decimal("1000.00"),
        sa_type=Numeric(10, 2),
        nullable=False,
    )
    is_indoor: bool = Field(default=False, nullable=False)
    is_active: bool = Field(default=True, nullable=False)
