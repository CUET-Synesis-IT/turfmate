from datetime import datetime
from typing import Optional
import uuid
from pydantic import BaseModel, ConfigDict, EmailStr, Field
from app.models.user import UserRole


class UserBase(BaseModel):
    phone_number: str = Field(min_length=6, max_length=20, description="Primary user phone number")
    email: Optional[EmailStr] = Field(default=None, description="Optional user email address")
    full_name: str = Field(min_length=1, max_length=100)
    avatar_url: Optional[str] = None


class UserCreate(UserBase):
    password: str = Field(min_length=6, max_length=128)
    role: Optional[UserRole] = UserRole.CUSTOMER


class UserUpdate(BaseModel):
    phone_number: Optional[str] = Field(default=None, min_length=6, max_length=20)
    email: Optional[EmailStr] = None
    full_name: Optional[str] = Field(default=None, min_length=1, max_length=100)
    avatar_url: Optional[str] = None
    role: Optional[UserRole] = None
    password: Optional[str] = Field(default=None, min_length=6, max_length=128)


class UserResponse(UserBase):
    id: uuid.UUID
    role: UserRole
    is_active: bool
    is_superuser: bool
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)
