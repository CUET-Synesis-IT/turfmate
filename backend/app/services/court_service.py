from typing import Optional
import uuid
from fastapi import HTTPException, status
from sqlmodel import Session
from app.crud import court as court_crud
from app.crud import venue as venue_crud
from app.models.court import Court, SportType
from app.models.user import User, UserRole
from app.schemas.court import CourtCreate, CourtUpdate


def _ensure_role(
    actor: User,
    allowed_roles: list[UserRole],
) -> None:
    """Verify that actor has an allowed role or is platform superuser."""
    if actor.is_superuser or actor.role == UserRole.ADMIN:
        return
    if actor.role not in allowed_roles:
        roles_str = [r.value for r in allowed_roles]
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=f"Operation requires one of the following roles: {roles_str}.",
        )


def create_court(
    session: Session,
    actor: User,
    venue_id: uuid.UUID,
    court_in: CourtCreate,
) -> Court:
    """Create a new court under a venue. Requires ADMIN or superuser."""
    _ensure_role(actor, [UserRole.ADMIN])

    venue = venue_crud.get_venue_by_id(session, venue_id)
    if not venue or not venue.is_active:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Venue not found or inactive.",
        )

    # Check unique name per venue
    existing = court_crud.get_court_by_name(session, venue_id, court_in.name)
    if existing:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"A court with the name '{court_in.name}' already exists in this venue.",
        )

    return court_crud.create_court(session, venue_id, court_in)


def get_court_by_id(session: Session, court_id: uuid.UUID) -> Court:
    """Retrieve court by ID or raise 404."""
    court = court_crud.get_court_by_id(session, court_id)
    if not court:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Court not found.",
        )
    return court


def list_courts(
    session: Session,
    venue_id: Optional[uuid.UUID] = None,
    sport_type: Optional[SportType] = None,
    skip: int = 0,
    limit: int = 50,
) -> list[Court]:
    """Retrieve public active courts with optional filters."""
    return court_crud.list_courts(
        session=session,
        venue_id=venue_id,
        sport_type=sport_type,
        is_active=True,
        skip=skip,
        limit=limit,
    )


def list_venue_courts(
    session: Session,
    venue_id: uuid.UUID,
    actor: Optional[User] = None,
) -> list[Court]:
    """List all courts for a venue. Shows inactive courts if actor is Admin or Staff."""
    venue = venue_crud.get_venue_by_id(session, venue_id)
    if not venue:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Venue not found.",
        )

    is_active: Optional[bool] = True
    if actor and (actor.is_superuser or actor.role in [UserRole.ADMIN, UserRole.STAFF]):
        is_active = None

    return court_crud.list_courts(
        session=session,
        venue_id=venue_id,
        is_active=is_active,
    )


def update_court(
    session: Session,
    court_id: uuid.UUID,
    actor: User,
    court_in: CourtUpdate,
) -> Court:
    """Update a court. Requires ADMIN, STAFF, or superuser."""
    court = get_court_by_id(session, court_id)
    _ensure_role(actor, [UserRole.ADMIN, UserRole.STAFF])

    # If updating court name, verify uniqueness in venue
    if court_in.name and court_in.name.strip().lower() != court.name.lower():
        existing = court_crud.get_court_by_name(session, court.venue_id, court_in.name)
        if existing and existing.id != court.id:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail=f"A court with the name '{court_in.name}' already exists in this venue.",
            )

    return court_crud.update_court(session, court, court_in)


def delete_court(
    session: Session,
    court_id: uuid.UUID,
    actor: User,
    soft: bool = True,
) -> Court:
    """Deactivate or remove a court. Requires ADMIN or superuser."""
    court = get_court_by_id(session, court_id)
    _ensure_role(actor, [UserRole.ADMIN])
    return court_crud.delete_court(session, court, soft=soft)
