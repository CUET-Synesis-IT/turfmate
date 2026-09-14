import uuid
from fastapi import HTTPException, status
from sqlmodel import Session
from app.crud import business as business_crud
from app.crud import business_member as member_crud
from app.crud import user as user_crud
from app.models.business import Business, BusinessMember, BusinessRole
from app.models.user import User
from app.schemas.business import (
    BusinessCreate,
    BusinessMemberCreate,
    BusinessMemberResponse,
    BusinessMemberUpdate,
    BusinessUpdate,
    BusinessWithRoleResponse,
)
from app.schemas.user import UserResponse
from app.utils.slug import slugify


def _resolve_unique_slug(session: Session, name: str, custom_slug: str | None = None) -> str:
    """Generate or validate unique slug."""
    if custom_slug:
        clean_slug = slugify(custom_slug)
        existing = business_crud.get_business_by_slug(session, clean_slug)
        if existing:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="A business with this slug already exists. Please choose a different slug.",
            )
        return clean_slug

    base_slug = slugify(name) or "turf"
    candidate = base_slug
    counter = 1
    while business_crud.get_business_by_slug(session, candidate):
        candidate = f"{base_slug}-{counter}"
        counter += 1
    return candidate


def create_business(
    session: Session,
    user: User,
    business_in: BusinessCreate,
) -> tuple[Business, BusinessMember]:
    """Create a new business and register the creator as OWNER."""
    slug = _resolve_unique_slug(session, business_in.name, business_in.slug)
    db_business = business_crud.create_business(session, business_in, slug)

    # Automatically grant creator the OWNER role
    db_member = member_crud.add_member(
        session=session,
        business_id=db_business.id,
        user_id=user.id,
        role=BusinessRole.OWNER,
    )
    return db_business, db_member


def get_business(session: Session, business_id: uuid.UUID) -> Business:
    """Retrieve business by UUID or raise 404."""
    business = business_crud.get_business_by_id(session, business_id)
    if not business or not business.is_active:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Business not found or inactive.",
        )
    return business


def update_business(
    session: Session,
    business_id: uuid.UUID,
    business_in: BusinessUpdate,
) -> Business:
    """Update business details."""
    db_business = get_business(session, business_id)

    slug_to_update = None
    if business_in.slug and business_in.slug.lower() != db_business.slug:
        slug_to_update = _resolve_unique_slug(session, business_in.name or db_business.name, business_in.slug)

    return business_crud.update_business(
        session=session,
        db_business=db_business,
        business_in=business_in,
        slug=slug_to_update,
    )


def list_my_businesses(
    session: Session,
    user: User,
) -> list[BusinessWithRoleResponse]:
    """List all active businesses where current user is a member/owner."""
    records = business_crud.list_user_businesses(session, user.id)
    results = []
    for biz, role in records:
        biz_data = biz.model_dump()
        biz_data["user_role"] = role
        results.append(BusinessWithRoleResponse.model_validate(biz_data))
    return results


def list_members(
    session: Session,
    business_id: uuid.UUID,
) -> list[BusinessMemberResponse]:
    """List all members of a business."""
    # Ensure business exists
    get_business(session, business_id)
    records = member_crud.list_business_members(session, business_id)
    return [
        BusinessMemberResponse(
            id=member.id,
            business_id=member.business_id,
            user_id=member.user_id,
            role=member.role,
            is_active=member.is_active,
            created_at=member.created_at,
            updated_at=member.updated_at,
            user=UserResponse.model_validate(user),
        )
        for member, user in records
    ]


def add_member(
    session: Session,
    business_id: uuid.UUID,
    actor: User,
    member_in: BusinessMemberCreate,
) -> BusinessMemberResponse:
    """Add a registered user to the business by phone number."""
    get_business(session, business_id)

    target_user = user_crud.get_user_by_phone(session, member_in.phone_number)
    if not target_user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No registered user found with this phone number. Ask them to sign up first.",
        )

    # Check if already a member
    existing = member_crud.get_member(session, business_id, target_user.id)
    if existing:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="This user is already a member of this business.",
        )

    db_member = member_crud.add_member(
        session=session,
        business_id=business_id,
        user_id=target_user.id,
        role=member_in.role,
    )

    return BusinessMemberResponse(
        id=db_member.id,
        business_id=db_member.business_id,
        user_id=db_member.user_id,
        role=db_member.role,
        is_active=db_member.is_active,
        created_at=db_member.created_at,
        updated_at=db_member.updated_at,
        user=UserResponse.model_validate(target_user),
    )


def update_member(
    session: Session,
    business_id: uuid.UUID,
    member_id: uuid.UUID,
    member_in: BusinessMemberUpdate,
) -> BusinessMemberResponse:
    """Update role or status of a staff member."""
    get_business(session, business_id)
    db_member = member_crud.get_member_by_id(session, member_id)
    if not db_member or db_member.business_id != business_id:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Membership record not found in this business.",
        )

    # Guard: prevent removing or demoting the sole owner
    if db_member.role == BusinessRole.OWNER and (
        (member_in.role and member_in.role != BusinessRole.OWNER)
        or (member_in.is_active is False)
    ):
        owner_count = member_crud.count_business_owners(session, business_id)
        if owner_count <= 1:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Cannot demote or deactivate the sole owner of the business.",
            )

    updated_member = member_crud.update_member(session, db_member, member_in)
    user = user_crud.get_user_by_id(session, updated_member.user_id)
    return BusinessMemberResponse(
        id=updated_member.id,
        business_id=updated_member.business_id,
        user_id=updated_member.user_id,
        role=updated_member.role,
        is_active=updated_member.is_active,
        created_at=updated_member.created_at,
        updated_at=updated_member.updated_at,
        user=UserResponse.model_validate(user),
    )


def remove_member(
    session: Session,
    business_id: uuid.UUID,
    member_id: uuid.UUID,
) -> None:
    """Remove a member from the business."""
    get_business(session, business_id)
    db_member = member_crud.get_member_by_id(session, member_id)
    if not db_member or db_member.business_id != business_id:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Membership record not found in this business.",
        )

    # Guard: prevent deleting the sole owner
    if db_member.role == BusinessRole.OWNER:
        owner_count = member_crud.count_business_owners(session, business_id)
        if owner_count <= 1:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Cannot remove the sole owner of the business. Transfer ownership first.",
            )

    member_crud.remove_member(session, db_member)
