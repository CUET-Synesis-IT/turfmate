from datetime import datetime
from typing import Optional
import uuid
from pydantic import BaseModel, ConfigDict, EmailStr, Field
from app.models.business import BusinessRole
from app.schemas.user import UserResponse


class BusinessBase(BaseModel):
    name: str = Field(min_length=2, max_length=150, description="Business name")
    email: Optional[EmailStr] = None
    phone_number: Optional[str] = Field(default=None, max_length=20)
    description: Optional[str] = None
    logo_url: Optional[str] = None


class BusinessCreate(BusinessBase):
    slug: Optional[str] = Field(
        default=None,
        min_length=2,
        max_length=150,
        description="Optional custom URL slug. If omitted, will be generated from name.",
    )


class BusinessUpdate(BaseModel):
    name: Optional[str] = Field(default=None, min_length=2, max_length=150)
    slug: Optional[str] = Field(default=None, min_length=2, max_length=150)
    email: Optional[EmailStr] = None
    phone_number: Optional[str] = Field(default=None, max_length=20)
    description: Optional[str] = None
    logo_url: Optional[str] = None
    is_active: Optional[bool] = None


class BusinessResponse(BusinessBase):
    id: uuid.UUID
    slug: str
    is_active: bool
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class BusinessWithRoleResponse(BusinessResponse):
    user_role: BusinessRole


class BusinessMemberCreate(BaseModel):
    phone_number: str = Field(
        min_length=6,
        max_length=20,
        description="Phone number of registered user to invite as staff",
    )
    role: BusinessRole = Field(
        default=BusinessRole.STAFF,
        description="Role assigned to member: owner, manager, or staff",
    )


class BusinessMemberUpdate(BaseModel):
    role: Optional[BusinessRole] = None
    is_active: Optional[bool] = None


class BusinessMemberResponse(BaseModel):
    id: uuid.UUID
    business_id: uuid.UUID
    user_id: uuid.UUID
    role: BusinessRole
    is_active: bool
    created_at: datetime
    updated_at: datetime
    user: UserResponse

    model_config = ConfigDict(from_attributes=True)
