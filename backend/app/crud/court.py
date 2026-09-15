from typing import Optional
import uuid
from sqlmodel import Session, col, select
from app.models.court import Court, SportType
from app.schemas.court import CourtCreate, CourtUpdate


def get_court_by_id(session: Session, court_id: uuid.UUID) -> Optional[Court]:
    """Retrieve a single court by UUID."""
    return session.get(Court, court_id)


def get_court_by_name(
    session: Session,
    venue_id: uuid.UUID,
    name: str,
) -> Optional[Court]:
    """Retrieve a court by venue ID and name (case-insensitive)."""
    statement = select(Court).where(
        Court.venue_id == venue_id,
        col(Court.name).ilike(name.strip()),
    )
    return session.exec(statement).first()


def list_courts(
    session: Session,
    venue_id: Optional[uuid.UUID] = None,
    sport_type: Optional[SportType] = None,
    is_active: Optional[bool] = True,
    skip: int = 0,
    limit: int = 50,
) -> list[Court]:
    """List courts with optional filtering by venue, sport type, or active status."""
    statement = select(Court)

    if venue_id is not None:
        statement = statement.where(Court.venue_id == venue_id)

    if sport_type is not None:
        statement = statement.where(Court.sport_type == sport_type)

    if is_active is not None:
        statement = statement.where(Court.is_active == is_active)

    statement = statement.order_by(Court.name).offset(skip).limit(limit)
    return list(session.exec(statement).all())


def create_court(
    session: Session,
    venue_id: uuid.UUID,
    court_in: CourtCreate,
) -> Court:
    """Create a new court under a venue."""
    court_data = court_in.model_dump(exclude={"venue_id"})
    db_court = Court(
        venue_id=venue_id,
        **court_data,
    )
    session.add(db_court)
    session.commit()
    session.refresh(db_court)
    return db_court


def update_court(
    session: Session,
    db_court: Court,
    court_in: CourtUpdate,
) -> Court:
    """Update court attributes."""
    update_data = court_in.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(db_court, field, value)

    session.add(db_court)
    session.commit()
    session.refresh(db_court)
    return db_court


def delete_court(
    session: Session,
    db_court: Court,
    soft: bool = True,
) -> Court:
    """Soft deactivate or permanently delete a court."""
    if soft:
        db_court.is_active = False
        session.add(db_court)
        session.commit()
        session.refresh(db_court)
        return db_court

    session.delete(db_court)
    session.commit()
    return db_court
