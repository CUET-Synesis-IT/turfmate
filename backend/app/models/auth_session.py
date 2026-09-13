from datetime import datetime
from typing import Optional
import uuid
from sqlmodel import Field
from sqlalchemy import DateTime
from app.models.base import BaseUUIDModel


class UserSession(BaseUUIDModel, table=True):
    __tablename__ = "user_sessions"

    user_id: uuid.UUID = Field(
        foreign_key="users.id",
        ondelete="CASCADE",
        index=True,
        nullable=False,
    )
    refresh_token_hash: str = Field(unique=True, index=True, nullable=False)
    device_info: Optional[str] = Field(default=None, nullable=True)
    ip_address: Optional[str] = Field(default=None, nullable=True)
    expires_at: datetime = Field(sa_type=DateTime(timezone=True), nullable=False)
    is_revoked: bool = Field(default=False, nullable=False)
