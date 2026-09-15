"""SQLModel database models package.

All database models are imported and re-exported here
so that Alembic autogeneration discovers all metadata tables.
"""
from sqlmodel import SQLModel

from app.models.base import BaseUUIDModel, TimestampMixin, UUIDModel, utc_now
from app.models.user import User, UserRole
from app.models.auth_session import UserSession
from app.models.venue import FacilityStatus, Venue
from app.models.court import Court, SportType
from app.models.schedule import PricingRule
from app.models.booking import Booking, BookingStatus
from app.models.payment import Payment, PaymentMethod, PaymentStatus

__all__ = [
    "SQLModel",
    "BaseUUIDModel",
    "TimestampMixin",
    "UUIDModel",
    "utc_now",
    "User",
    "UserRole",
    "UserSession",
    "FacilityStatus",
    "Venue",
    "Court",
    "SportType",
    "PricingRule",
    "Booking",
    "BookingStatus",
    "Payment",
    "PaymentMethod",
    "PaymentStatus",
]
