from typing import Optional
import uuid
from fastapi import HTTPException, status
from sqlmodel import Session
from app.crud import business as business_crud
from app.crud import business_member as member_crud
from app.crud import venue as venue_crud
from app.models.business import BusinessRole
from app.models.user import User
from app.models.venue import Venue
from app.schemas.venue import VenueCreate, VenueUpdate
from app.utils.slug import slugify


def _ensure_business_permission(
    session: Session,
    business_id: uuid.UUID,
    actor: User,
    allowed_roles: list[BusinessRole],
) -> None:
    """Verify that actor has required role in business, or is platform superuser."""
    if actor.is_superuser:
        return

    member = member_crud.get_member(session, business_id, actor.id)
    if not member or not member.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You do not have access to this business.",
        )
    if member.role not in allowed_roles:
        roles_str = [r.value for r in allowed_roles]
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=f"Operation requires one of the following business roles: {roles_str}.",
        )


def resolve_venue_slug(
    session: Session,
    business_id: uuid.UUID,
    name: str,
    custom_slug: Optional[str] = None,
    current_venue_id: Optional[uuid.UUID] = None,
) -> str:
    """Generate or validate unique venue slug within a specific business."""
    if custom_slug:
        clean_slug = slugify(custom_slug)
        existing = venue_crud.get_venue_by_slug(session, business_id, clean_slug)
        if existing and (current_venue_id is None or existing.id != current_venue_id):
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="A venue with this slug already exists for this business.",
            )
        return clean_slug

    base_slug = slugify(name) or "venue"
    candidate = base_slug
    counter = 1
    while True:
        existing = venue_crud.get_venue_by_slug(session, business_id, candidate)
        if not existing or (current_venue_id is not None and existing.id == current_venue_id):
            return candidate
        candidate = f"{base_slug}-{counter}"
        counter += 1


def create_venue(
    session: Session,
    business_id: uuid.UUID,
    actor: User,
    venue_in: VenueCreate,
) -> Venue:
    """Create a new venue under a business. Requires OWNER, MANAGER or superuser."""
    biz = business_crud.get_business_by_id(session, business_id)
    if not biz or not biz.is_active:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Business not found or inactive.",
        )

    _ensure_business_permission(
        session=session,
        business_id=business_id,
        actor=actor,
        allowed_roles=[BusinessRole.OWNER, BusinessRole.MANAGER],
    )

    slug = resolve_venue_slug(
        session=session,
        business_id=business_id,
        name=venue_in.name,
        custom_slug=venue_in.slug,
    )
    return venue_crud.create_venue(session, business_id, venue_in, slug)


def get_venue_by_id(session: Session, venue_id: uuid.UUID) -> Venue:
    """Retrieve venue by ID or raise 404."""
    venue = venue_crud.get_venue_by_id(session, venue_id)
    if not venue:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Venue not found.",
        )
    return venue


def list_venues(
    session: Session,
    business_id: Optional[uuid.UUID] = None,
    city: Optional[str] = None,
    search: Optional[str] = None,
    skip: int = 0,
    limit: int = 50,
) -> list[Venue]:
    """Retrieve public active venues with optional filters."""
    return venue_crud.list_venues(
        session=session,
        business_id=business_id,
        city=city,
        is_active=True,
        search=search,
        skip=skip,
        limit=limit,
    )


def list_business_venues(
    session: Session,
    business_id: uuid.UUID,
    actor: Optional[User] = None,
) -> list[Venue]:
    """List venues for a business. Includes inactive venues if caller has manager/owner role."""
    biz = business_crud.get_business_by_id(session, business_id)
    if not biz:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Business not found.",
        )

    is_active: Optional[bool] = True
    if actor:
        if actor.is_superuser:
            is_active = None
        else:
            member = member_crud.get_member(session, business_id, actor.id)
            if member and member.is_active and member.role in [BusinessRole.OWNER, BusinessRole.MANAGER]:
                is_active = None

    return venue_crud.list_venues(
        session=session,
        business_id=business_id,
        is_active=is_active,
    )


def update_venue(
    session: Session,
    venue_id: uuid.UUID,
    actor: User,
    venue_in: VenueUpdate,
) -> Venue:
    """Update a venue. Requires OWNER, MANAGER or superuser."""
    venue = get_venue_by_id(session, venue_id)

    _ensure_business_permission(
        session=session,
        business_id=venue.business_id,
        actor=actor,
        allowed_roles=[BusinessRole.OWNER, BusinessRole.MANAGER],
    )

    new_slug = None
    if venue_in.slug is not None:
        new_slug = resolve_venue_slug(
            session=session,
            business_id=venue.business_id,
            name=venue_in.name or venue.name,
            custom_slug=venue_in.slug,
            current_venue_id=venue.id,
        )

    return venue_crud.update_venue(
        session=session,
        db_venue=venue,
        venue_in=venue_in,
        new_slug=new_slug,
    )


def delete_venue(
    session: Session,
    venue_id: uuid.UUID,
    actor: User,
    soft: bool = True,
) -> Venue:
    """Deactivate or remove a venue. Requires OWNER or superuser."""
    venue = get_venue_by_id(session, venue_id)

    _ensure_business_permission(
        session=session,
        business_id=venue.business_id,
        actor=actor,
        allowed_roles=[BusinessRole.OWNER],
    )

    return venue_crud.delete_venue(session, venue, soft=soft)
