from datetime import date, datetime, time, timedelta, timezone
from typing import Optional
import uuid
from sqlmodel import Session, col, func, select
from app.models.base import utc_now
from app.models.booking import Booking, BookingStatus
from app.models.court import Court
from app.models.user import User


def expire_stale_pending_bookings(session: Session, hold_minutes: int = 10) -> int:
    """Find and cancel pending bookings whose payment countdown window has expired."""
    cutoff = utc_now() - timedelta(minutes=hold_minutes)
    statement = select(Booking).where(
        Booking.status == BookingStatus.PENDING,
        Booking.created_at < cutoff,
    )
    stale_bookings = list(session.exec(statement).all())
    now = utc_now()
    for b in stale_bookings:
        b.status = BookingStatus.CANCELLED
        b.cancellation_reason = f"Payment session timed out ({hold_minutes}-minute limit exceeded)"
        b.cancelled_at = now
        session.add(b)

    if stale_bookings:
        session.commit()
    return len(stale_bookings)


def get_booking_by_id(session: Session, booking_id: uuid.UUID) -> Optional[Booking]:
    """Retrieve a single booking by ID."""
    return session.get(Booking, booking_id)


def get_booking_by_reference(session: Session, reference: str) -> Optional[Booking]:
    """Retrieve a single booking by reference string."""
    statement = select(Booking).where(Booking.booking_reference == reference.strip().upper())
    return session.exec(statement).first()


def get_overlapping_bookings(
    session: Session,
    court_id: uuid.UUID,
    start_datetime: datetime,
    end_datetime: datetime,
    exclude_booking_id: Optional[uuid.UUID] = None,
    with_for_update: bool = False,
) -> list[Booking]:
    """Query active non-cancelled bookings on the court overlapping [start, end]."""
    statement = select(Booking).where(
        Booking.court_id == court_id,
        Booking.status != BookingStatus.CANCELLED,
        Booking.start_datetime < end_datetime,
        Booking.end_datetime > start_datetime,
    )
    if exclude_booking_id is not None:
        statement = statement.where(Booking.id != exclude_booking_id)

    if with_for_update:
        statement = statement.with_for_update()

    return list(session.exec(statement).all())


def get_court_bookings_for_date(
    session: Session,
    court_id: uuid.UUID,
    target_date: date,
) -> list[Booking]:
    """Get all non-cancelled bookings for a court on a given date."""
    # Window spans the target date from 00:00:00 to next day 00:00:00 UTC
    day_start = datetime.combine(target_date, time.min).replace(tzinfo=timezone.utc)
    day_end = datetime.combine(target_date + timedelta(days=1), time.min).replace(tzinfo=timezone.utc)

    statement = select(Booking).where(
        Booking.court_id == court_id,
        Booking.status != BookingStatus.CANCELLED,
        Booking.start_datetime < day_end,
        Booking.end_datetime > day_start,
    ).order_by(Booking.start_datetime.asc())

    return list(session.exec(statement).all())


def create_booking(session: Session, booking: Booking) -> Booking:
    """Persist a new booking record."""
    session.add(booking)
    session.commit()
    session.refresh(booking)
    return booking


def list_bookings(
    session: Session,
    customer_id: Optional[uuid.UUID] = None,
    court_id: Optional[uuid.UUID] = None,
    venue_id: Optional[uuid.UUID] = None,
    status: Optional[BookingStatus] = None,
    start_date: Optional[date] = None,
    end_date: Optional[date] = None,
    search: Optional[str] = None,
    skip: int = 0,
    limit: int = 50,
) -> tuple[list[Booking], int]:
    """List bookings with filters, search, and pagination."""
    query = select(Booking)

    if venue_id is not None:
        query = query.join(Court, Booking.court_id == Court.id).where(Court.venue_id == venue_id)

    if customer_id is not None:
        query = query.where(Booking.customer_id == customer_id)

    if court_id is not None:
        query = query.where(Booking.court_id == court_id)

    if status is not None:
        query = query.where(Booking.status == status)

    if start_date is not None:
        start_dt = datetime.combine(start_date, time.min).replace(tzinfo=timezone.utc)
        query = query.where(Booking.end_datetime >= start_dt)

    if end_date is not None:
        end_dt = datetime.combine(end_date + timedelta(days=1), time.min).replace(tzinfo=timezone.utc)
        query = query.where(Booking.start_datetime < end_dt)

    if search:
        search_pattern = f"%{search.strip()}%"
        # Join user to search customer full name or phone number
        query = query.outerjoin(User, Booking.customer_id == User.id).where(
            (col(Booking.booking_reference).ilike(search_pattern))
            | (col(User.phone_number).ilike(search_pattern))
            | (col(User.full_name).ilike(search_pattern))
        )

    # Count total
    count_statement = select(func.count()).select_from(query.subquery())
    total = session.exec(count_statement).one()

    # Pagination and order
    paginated_query = query.order_by(Booking.start_datetime.desc()).offset(skip).limit(limit)
    bookings = list(session.exec(paginated_query).all())

    return bookings, total


def update_booking(
    session: Session,
    booking: Booking,
    update_data: dict,
) -> Booking:
    """Update fields on an existing booking."""
    for key, value in update_data.items():
        setattr(booking, key, value)
    session.add(booking)
    session.commit()
    session.refresh(booking)
    return booking
