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


class UserRegister(UserBase):
    """Schema for public user registration. Does NOT allow setting role."""
    password: str = Field(min_length=6, max_length=128)


class UserCreate(UserRegister):
    """Schema for internal/admin user creation with explicit role."""
    role: Optional[UserRole] = UserRole.CUSTOMER


class StaffCreate(BaseModel):
    """Schema for Admin creating staff members."""
    phone_number: str = Field(min_length=6, max_length=20)
    full_name: str = Field(min_length=1, max_length=100)
    password: str = Field(min_length=6, max_length=128)
    email: Optional[EmailStr] = None
    avatar_url: Optional[str] = None


class AdminCreate(BaseModel):
    """Schema for Superuser creating business admin accounts."""
    phone_number: str = Field(min_length=6, max_length=20)
    full_name: str = Field(min_length=1, max_length=100)
    password: str = Field(min_length=6, max_length=128)
    email: Optional[EmailStr] = None
    avatar_url: Optional[str] = None


class UserUpdateMe(BaseModel):
    """Schema for users updating their own profile. Strictly prevents role escalation."""
    email: Optional[EmailStr] = None
    full_name: Optional[str] = Field(default=None, min_length=1, max_length=100)
    avatar_url: Optional[str] = None
    password: Optional[str] = Field(default=None, min_length=6, max_length=128)


class UserRoleUpdate(BaseModel):
    """Schema for Admin promoting/demoting user roles."""
    role: UserRole = Field(description="Role to assign: admin, staff, or customer")


class UserAdminUpdate(BaseModel):
    """Schema for Admin updating any user's profile and status."""
    phone_number: Optional[str] = Field(default=None, min_length=6, max_length=20)
    email: Optional[EmailStr] = None
    full_name: Optional[str] = Field(default=None, min_length=1, max_length=100)
    avatar_url: Optional[str] = None
    role: Optional[UserRole] = None
    is_active: Optional[bool] = None
    password: Optional[str] = Field(default=None, min_length=6, max_length=128)

class UserResponse(UserBase):
    id: uuid.UUID
    role: UserRole
    is_active: bool
    is_superuser: bool
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)
