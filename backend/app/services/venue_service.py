from typing import Optional
import uuid
from fastapi import HTTPException, status
from sqlmodel import Session
from app.crud import venue as venue_crud
from app.models.user import User, UserRole
from app.models.venue import Venue
from app.schemas.venue import VenueCreate, VenueUpdate
from app.utils.slug import slugify


def _ensure_role(
    actor: User,
    allowed_roles: list[UserRole],
) -> None:
    """Verify that actor has an allowed role, or is superuser."""
    if actor.is_superuser or actor.role == UserRole.ADMIN:
        return
    if actor.role not in allowed_roles:
        roles_str = [r.value for r in allowed_roles]
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=f"Operation requires one of the following roles: {roles_str}.",
        )


def resolve_venue_slug(
    session: Session,
    name: str,
    custom_slug: Optional[str] = None,
    current_venue_id: Optional[uuid.UUID] = None,
) -> str:
    """Generate or validate unique venue slug."""
    if custom_slug:
        clean_slug = slugify(custom_slug)
        existing = venue_crud.get_venue_by_slug(session, clean_slug)
        if existing and (current_venue_id is None or existing.id != current_venue_id):
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="A venue with this slug already exists.",
            )
        return clean_slug

    base_slug = slugify(name) or "venue"
    candidate = base_slug
    counter = 1
    while True:
        existing = venue_crud.get_venue_by_slug(session, candidate)
        if not existing or (current_venue_id is not None and existing.id == current_venue_id):
            return candidate
        candidate = f"{base_slug}-{counter}"
        counter += 1


def create_venue(
    session: Session,
    actor: User,
    venue_in: VenueCreate,
) -> Venue:
    """Create a new venue. Requires ADMIN or superuser."""
    _ensure_role(actor, [UserRole.ADMIN])

    slug = resolve_venue_slug(
        session=session,
        name=venue_in.name,
        custom_slug=venue_in.slug,
    )
    return venue_crud.create_venue(session, venue_in, slug)


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
    district: Optional[str] = None,
    area: Optional[str] = None,
    search: Optional[str] = None,
    skip: int = 0,
    limit: int = 50,
) -> list[Venue]:
    """Retrieve public active venues with optional filters."""
    return venue_crud.list_venues(
        session=session,
        district=district,
        area=area,
        is_active=True,
        search=search,
        skip=skip,
        limit=limit,
    )


def update_venue(
    session: Session,
    venue_id: uuid.UUID,
    actor: User,
    venue_in: VenueUpdate,
) -> Venue:
    """Update a venue. Requires ADMIN, STAFF, or superuser."""
    venue = get_venue_by_id(session, venue_id)
    _ensure_role(actor, [UserRole.ADMIN, UserRole.STAFF])

    new_slug = None
    if venue_in.slug is not None:
        new_slug = resolve_venue_slug(
            session=session,
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
    """Deactivate or remove a venue. Requires ADMIN or superuser."""
    venue = get_venue_by_id(session, venue_id)
    _ensure_role(actor, [UserRole.ADMIN])
    return venue_crud.delete_venue(session, venue, soft=soft)
