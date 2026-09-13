from datetime import datetime
from typing import Optional
import uuid
from sqlmodel import Field
from sqlalchemy import DateTime
from app.models.base import BaseUUIDModel


class CourtBlock(BaseUUIDModel, table=True):
    __tablename__ = "court_blocks"

    court_id: uuid.UUID = Field(
        foreign_key="courts.id",
        ondelete="CASCADE",
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
    reason: str = Field(nullable=False)
    created_by_user_id: Optional[uuid.UUID] = Field(
        default=None,
        foreign_key="users.id",
        ondelete="SET NULL",
        nullable=True,
    )
