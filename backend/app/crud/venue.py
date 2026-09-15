from typing import Optional
import uuid
from sqlmodel import Session, col, select
from app.models.venue import Venue
from app.schemas.venue import VenueCreate, VenueUpdate


def get_venue_by_id(session: Session, venue_id: uuid.UUID) -> Optional[Venue]:
    """Retrieve a single venue by its UUID."""
    return session.get(Venue, venue_id)


def get_venue_by_slug(session: Session, slug: str) -> Optional[Venue]:
    """Retrieve a venue by slug."""
    statement = select(Venue).where(Venue.slug == slug)
    return session.exec(statement).first()


def list_venues(
    session: Session,
    district: Optional[str] = None,
    area: Optional[str] = None,
    is_active: Optional[bool] = True,
    search: Optional[str] = None,
    skip: int = 0,
    limit: int = 50,
) -> list[Venue]:
    """List venues with optional filtering by district, area, active status, or search query."""
    statement = select(Venue)

    if district:
        statement = statement.where(col(Venue.district).ilike(f"%{district.strip()}%"))

    if area:
        statement = statement.where(col(Venue.area).ilike(f"%{area.strip()}%"))

    if is_active is not None:
        statement = statement.where(Venue.is_active == is_active)

    if search:
        search_pattern = f"%{search.strip()}%"
        statement = statement.where(
            col(Venue.name).ilike(search_pattern)
            | col(Venue.address).ilike(search_pattern)
            | col(Venue.area).ilike(search_pattern)
            | col(Venue.district).ilike(search_pattern)
        )

    statement = statement.order_by(col(Venue.created_at).desc()).offset(skip).limit(limit)
    return list(session.exec(statement).all())


def create_venue(
    session: Session,
    venue_in: VenueCreate,
    slug: str,
) -> Venue:
    """Create a new venue."""
    venue_data = venue_in.model_dump(exclude={"slug"})
    db_venue = Venue(
        slug=slug,
        **venue_data,
    )
    session.add(db_venue)
    session.commit()
    session.refresh(db_venue)
    return db_venue


def update_venue(
    session: Session,
    db_venue: Venue,
    venue_in: VenueUpdate,
    new_slug: Optional[str] = None,
) -> Venue:
    """Update venue fields and optionally update its slug."""
    update_data = venue_in.model_dump(exclude_unset=True, exclude={"slug"})
    for field, value in update_data.items():
        setattr(db_venue, field, value)

    if new_slug is not None:
        db_venue.slug = new_slug

    session.add(db_venue)
    session.commit()
    session.refresh(db_venue)
    return db_venue


def delete_venue(
    session: Session,
    db_venue: Venue,
    soft: bool = True,
) -> Venue:
    """Delete a venue either through soft deactivation or permanent removal."""
    if soft:
        db_venue.is_active = False
        session.add(db_venue)
        session.commit()
        session.refresh(db_venue)
        return db_venue

    session.delete(db_venue)
    session.commit()
    return db_venue
