from typing import Annotated
import uuid
from fastapi import APIRouter, Depends, status
from app.api.deps import CurrentUserDep, SessionDep, get_current_superuser, require_business_roles
from app.models.business import BusinessMember, BusinessRole
from app.models.user import User
from app.schemas.business import (
    BusinessCreate,
    BusinessMemberCreate,
    BusinessMemberResponse,
    BusinessMemberUpdate,
    BusinessResponse,
    BusinessUpdate,
    BusinessWithRoleResponse,
)
from app.services import business_service

router = APIRouter(prefix="/businesses", tags=["businesses"])


@router.post(
    "",
    response_model=BusinessResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create a new business (Superuser only)",
)
def create_business(
    business_in: BusinessCreate,
    current_admin: Annotated[User, Depends(get_current_superuser)],
    session: SessionDep,
) -> BusinessResponse:
    """Create a new turf business. Only platform superusers/admins can initialize or create a business."""
    business, _ = business_service.create_business(
        session=session,
        user=current_admin,
        business_in=business_in,
    )
    return BusinessResponse.model_validate(business)


@router.get(
    "",
    response_model=list[BusinessResponse],
    summary="List all active businesses",
)
@router.get(
    "/all-businesses",
    response_model=list[BusinessResponse],
    summary="List all active businesses (alias)",
)
def list_all_businesses(session: SessionDep) -> list[BusinessResponse]:
    """Retrieve all active turf businesses (accessible by customers and public)."""
    businesses = business_service.list_all_businesses(session)
    return [BusinessResponse.model_validate(b) for b in businesses]


@router.get(
    "/my",
    response_model=list[BusinessWithRoleResponse],
    summary="List businesses for current user",
)
def list_my_businesses(
    current_user: CurrentUserDep,
    session: SessionDep,
) -> list[BusinessWithRoleResponse]:
    """Retrieve all active businesses where the current user has a role (owner, manager, staff)."""
    return business_service.list_my_businesses(
        session=session,
        user=current_user,
    )


@router.get(
    "/{business_id}",
    response_model=BusinessResponse,
    summary="Get business details",
)
def get_business(
    business_id: uuid.UUID,
    session: SessionDep,
    _member: Annotated[
        BusinessMember,
        Depends(require_business_roles([BusinessRole.OWNER, BusinessRole.MANAGER, BusinessRole.STAFF])),
    ],
) -> BusinessResponse:
    """Retrieve business profile details (accessible by any authorized member of this business)."""
    business = business_service.get_business(session, business_id)
    return BusinessResponse.model_validate(business)


@router.patch(
    "/{business_id}",
    response_model=BusinessResponse,
    summary="Update business profile",
)
def update_business(
    business_id: uuid.UUID,
    business_in: BusinessUpdate,
    session: SessionDep,
    _member: Annotated[
        BusinessMember,
        Depends(require_business_roles([BusinessRole.OWNER, BusinessRole.MANAGER])),
    ],
) -> BusinessResponse:
    """Update business details (requires OWNER or MANAGER role)."""
    updated_business = business_service.update_business(
        session=session,
        business_id=business_id,
        business_in=business_in,
    )
    return BusinessResponse.model_validate(updated_business)


# ==========================================
# Staff / Membership Endpoints
# ==========================================


@router.get(
    "/{business_id}/members",
    response_model=list[BusinessMemberResponse],
    summary="List staff members in business",
)
def list_members(
    business_id: uuid.UUID,
    session: SessionDep,
    _member: Annotated[
        BusinessMember,
        Depends(require_business_roles([BusinessRole.OWNER, BusinessRole.MANAGER, BusinessRole.STAFF])),
    ],
) -> list[BusinessMemberResponse]:
    """List all staff, managers, and owners associated with this business."""
    return business_service.list_members(session, business_id)


@router.post(
    "/{business_id}/members",
    response_model=BusinessMemberResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Add staff member by phone number",
)
def add_member(
    business_id: uuid.UUID,
    member_in: BusinessMemberCreate,
    current_user: CurrentUserDep,
    session: SessionDep,
    _member: Annotated[
        BusinessMember,
        Depends(require_business_roles([BusinessRole.OWNER, BusinessRole.MANAGER])),
    ],
) -> BusinessMemberResponse:
    """Add a registered user as staff to this business using their phone number."""
    return business_service.add_member(
        session=session,
        business_id=business_id,
        actor=current_user,
        member_in=member_in,
    )


@router.patch(
    "/{business_id}/members/{member_id}",
    response_model=BusinessMemberResponse,
    summary="Update staff member role",
)
def update_member(
    business_id: uuid.UUID,
    member_id: uuid.UUID,
    member_in: BusinessMemberUpdate,
    session: SessionDep,
    _member: Annotated[
        BusinessMember,
        Depends(require_business_roles([BusinessRole.OWNER])),
    ],
) -> BusinessMemberResponse:
    """Change a staff member's role or status (requires OWNER role)."""
    return business_service.update_member(
        session=session,
        business_id=business_id,
        member_id=member_id,
        member_in=member_in,
    )


@router.delete(
    "/{business_id}/members/{member_id}",
    status_code=status.HTTP_200_OK,
    summary="Remove staff member from business",
)
def remove_member(
    business_id: uuid.UUID,
    member_id: uuid.UUID,
    session: SessionDep,
    _member: Annotated[
        BusinessMember,
        Depends(require_business_roles([BusinessRole.OWNER])),
    ],
) -> dict[str, str]:
    """Remove a member from the business (requires OWNER role)."""
    business_service.remove_member(
        session=session,
        business_id=business_id,
        member_id=member_id,
    )
    return {"message": "Staff member removed successfully."}
