from datetime import date, datetime, time, timedelta, timezone
from decimal import Decimal
import random
import string
from typing import Optional
import uuid
from fastapi import HTTPException, status
from sqlmodel import Session
from app.crud import booking as booking_crud
from app.crud import court as court_crud
from app.crud import user as user_crud
from app.crud import venue as venue_crud
from app.models.base import utc_now
from app.models.booking import Booking, BookingStatus
from app.models.court import Court
from app.models.user import User, UserRole
from app.models.venue import FacilityStatus, Venue
from app.schemas.booking import (
    BookingBlockCreate,
    BookingCancel,
    BookingCreate,
    BookingResponse,
    BookingStaffCreate,
    BookingStatusUpdate,
    CourtAvailabilityResponse,
    CourtSummary,
    CustomerSummary,
    SlotInfo,
)
from app.services import pricing_service


def _ensure_tz_aware(dt: datetime) -> datetime:
    """Ensure a datetime object is timezone-aware (UTC if naive)."""
    if dt.tzinfo is None:
        return dt.replace(tzinfo=timezone.utc)
    return dt


def generate_booking_reference(session: Session, target_date: date) -> str:
    """Generate a unique, human-friendly reference like TM-260915-K8P2."""
    date_part = target_date.strftime("%y%m%d")
    chars = string.ascii_uppercase + string.digits
    for _ in range(10):
        random_suffix = "".join(random.choices(chars, k=4))
        candidate_ref = f"TM-{date_part}-{random_suffix}"
        if not booking_crud.get_booking_by_reference(session, candidate_ref):
            return candidate_ref
    raise HTTPException(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        detail="Could not generate unique booking reference",
    )


def calculate_booking_price(
    session: Session,
    court_id: uuid.UUID,
    start_dt: datetime,
    end_dt: datetime,
) -> Decimal:
    """Calculate the total price for a time window across dynamic pricing rules."""
    total = Decimal("0.00")
    current = start_dt
    step = timedelta(minutes=30)  # Calculate in 30-min increments

    while current < end_dt:
        chunk_end = min(current + step, end_dt)
        chunk_hours = Decimal(str((chunk_end - current).total_seconds() / 3600.0))
        hourly_rate = pricing_service.calculate_slot_price(session, court_id, current)
        total += hourly_rate * chunk_hours
        current = chunk_end

    return total.quantize(Decimal("0.01"))


def get_court_availability(
    session: Session,
    court_id: uuid.UUID,
    target_date: date,
    duration_minutes: int = 60,
) -> CourtAvailabilityResponse:
    """Generate the full time-slot availability grid for a court on a date."""
    court = court_crud.get_court_by_id(session, court_id)
    if not court or not court.is_active:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Court not found or inactive",
        )

    venue = venue_crud.get_venue_by_id(session, court.venue_id)
    if not venue or not venue.is_active:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Venue not found or inactive",
        )

    # Determine venue operating window
    open_time = venue.opening_time
    close_time = venue.closing_time

    day_open_dt = datetime.combine(target_date, open_time).replace(tzinfo=timezone.utc)
    if close_time == time(0, 0) or close_time <= open_time:
        day_close_dt = datetime.combine(target_date + timedelta(days=1), close_time).replace(tzinfo=timezone.utc)
    else:
        day_close_dt = datetime.combine(target_date, close_time).replace(tzinfo=timezone.utc)

    # Facility maintenance checks
    venue_in_maintenance = venue.status != FacilityStatus.ACTIVE
    court_in_maintenance = court.status != FacilityStatus.ACTIVE

    maintenance_reason: Optional[str] = None
    if venue_in_maintenance:
        maintenance_reason = f"Venue under {venue.status.value}: {venue.status_note or 'Closed'}"
    elif court_in_maintenance:
        maintenance_reason = f"Court under {court.status.value}: {court.status_note or 'Maintenance'}"

    # Auto-expire any stale pending reservations before evaluating availability
    booking_crud.expire_stale_pending_bookings(session, hold_minutes=10)

    # Fetch existing non-cancelled bookings
    existing_bookings = booking_crud.get_court_bookings_for_date(session, court_id, target_date)

    slots: list[SlotInfo] = []
    current_slot_start = day_open_dt
    step = timedelta(minutes=duration_minutes)

    while current_slot_start + step <= day_close_dt:
        current_slot_end = current_slot_start + step

        # Calculate slot price
        slot_price = pricing_service.calculate_slot_price(session, court_id, current_slot_start)
        if duration_minutes != 60:
            slot_price = (slot_price * Decimal(str(duration_minutes / 60.0))).quantize(Decimal("0.01"))

        if maintenance_reason:
            slots.append(
                SlotInfo(
                    start_time=current_slot_start,
                    end_time=current_slot_end,
                    price=slot_price,
                    is_available=False,
                    status="maintenance",
                    reason=maintenance_reason,
                )
            )
        else:
            # Check overlap with existing bookings
            overlapping = [
                b for b in existing_bookings
                if _ensure_tz_aware(b.start_datetime) < current_slot_end
                and _ensure_tz_aware(b.end_datetime) > current_slot_start
            ]

            if overlapping:
                is_blocked = any(b.status == BookingStatus.BLOCKED for b in overlapping)
                is_pending = any(b.status == BookingStatus.PENDING for b in overlapping)
                if is_blocked:
                    slot_status = "blocked"
                    slot_reason = "Court is blocked for maintenance"
                elif is_pending:
                    slot_status = "pending"
                    slot_reason = "Slot is temporarily held for payment checkout"
                else:
                    slot_status = "booked"
                    slot_reason = "Slot is already booked"

                slots.append(
                    SlotInfo(
                        start_time=current_slot_start,
                        end_time=current_slot_end,
                        price=slot_price,
                        is_available=False,
                        status=slot_status,
                        reason=slot_reason,
                    )
                )
            else:
                slots.append(
                    SlotInfo(
                        start_time=current_slot_start,
                        end_time=current_slot_end,
                        price=slot_price,
                        is_available=True,
                        status="available",
                        reason=None,
                    )
                )

        current_slot_start += step

    return CourtAvailabilityResponse(
        court_id=court.id,
        court_name=court.name,
        date=target_date,
        venue_id=venue.id,
        venue_name=venue.name,
        venue_status=venue.status,
        court_status=court.status,
        slots=slots,
    )


def _validate_booking_window(
    session: Session,
    court: Court,
    venue: Venue,
    start_dt: datetime,
    end_dt: datetime,
) -> None:
    """Validate that booking window is valid, in future, within hours, and court/venue active."""
    start_dt = _ensure_tz_aware(start_dt)
    end_dt = _ensure_tz_aware(end_dt)

    if start_dt >= end_dt:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="start_datetime must be before end_datetime",
        )

    # Allow a small 5-minute buffer for clock drift
    if start_dt < utc_now() - timedelta(minutes=5):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot book a slot in the past",
        )

    # Check venue and court active status
    if venue.status != FacilityStatus.ACTIVE:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Venue is currently {venue.status.value}: {venue.status_note or 'Closed'}",
        )
    if court.status != FacilityStatus.ACTIVE:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Court is currently {court.status.value}: {court.status_note or 'Under maintenance'}",
        )

    # Check venue operating hours
    open_time = venue.opening_time
    close_time = venue.closing_time
    slot_date = start_dt.date()

    day_open_dt = datetime.combine(slot_date, open_time).replace(tzinfo=timezone.utc)
    if close_time == time(0, 0) or close_time <= open_time:
        day_close_dt = datetime.combine(slot_date + timedelta(days=1), close_time).replace(tzinfo=timezone.utc)
    else:
        day_close_dt = datetime.combine(slot_date, close_time).replace(tzinfo=timezone.utc)

    if start_dt < day_open_dt or end_dt > day_close_dt:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=(
                f"Booking time ({start_dt.strftime('%H:%M')} - {end_dt.strftime('%H:%M')}) "
                f"is outside venue operating hours ({open_time.strftime('%H:%M')} - {close_time.strftime('%H:%M')})"
            ),
        )


def build_booking_response(session: Session, booking: Booking) -> BookingResponse:
    """Helper to assemble a rich BookingResponse with court and customer info."""
    court = court_crud.get_court_by_id(session, booking.court_id)
    venue = venue_crud.get_venue_by_id(session, court.venue_id) if court else None
    customer = user_crud.get_user_by_id(session, booking.customer_id)

    court_summary = None
    if court:
        court_summary = CourtSummary(
            id=court.id,
            name=court.name,
            sport_type=court.sport_type,
            venue_id=court.venue_id,
            venue_name=venue.name if venue else None,
        )

    customer_summary = None
    if customer:
        customer_summary = CustomerSummary(
            id=customer.id,
            full_name=customer.full_name,
            phone_number=customer.phone_number,
            email=customer.email,
        )

    remaining = max(Decimal("0.00"), booking.total_amount - booking.deposit_paid)
    expires_at = (
        booking.created_at + timedelta(minutes=10)
        if booking.status == BookingStatus.PENDING
        else None
    )

    return BookingResponse(
        id=booking.id,
        booking_reference=booking.booking_reference,
        court_id=booking.court_id,
        court=court_summary,
        customer_id=booking.customer_id,
        customer=customer_summary,
        start_datetime=booking.start_datetime,
        end_datetime=booking.end_datetime,
        status=booking.status,
        total_amount=booking.total_amount,
        deposit_paid=booking.deposit_paid,
        remaining_balance=remaining,
        customer_notes=booking.customer_notes,
        internal_notes=booking.internal_notes,
        cancellation_reason=booking.cancellation_reason,
        cancelled_at=booking.cancelled_at,
        created_by_user_id=booking.created_by_user_id,
        expires_at=expires_at,
        created_at=booking.created_at,
        updated_at=booking.updated_at,
    )


def create_customer_booking(
    session: Session,
    current_user: User,
    booking_in: BookingCreate,
) -> BookingResponse:
    """Create a new booking requested by an authenticated customer."""
    court = court_crud.get_court_by_id(session, booking_in.court_id)
    if not court or not court.is_active:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Court not found or inactive",
        )

    venue = venue_crud.get_venue_by_id(session, court.venue_id)
    if not venue or not venue.is_active:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Venue not found or inactive",
        )

    start_dt = _ensure_tz_aware(booking_in.start_datetime)
    end_dt = _ensure_tz_aware(booking_in.end_datetime)

    _validate_booking_window(session, court, venue, start_dt, end_dt)

    # Release any expired pending holds before evaluating slot conflicts
    booking_crud.expire_stale_pending_bookings(session, hold_minutes=10)

    # Concurrency-safe check with row locking
    conflicts = booking_crud.get_overlapping_bookings(
        session=session,
        court_id=court.id,
        start_datetime=start_dt,
        end_datetime=end_dt,
        with_for_update=True,
    )
    if conflicts:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="The requested time slot is already booked or held for payment checkout.",
        )

    total_amount = calculate_booking_price(session, court.id, start_dt, end_dt)
    reference = generate_booking_reference(session, start_dt.date())

    booking = Booking(
        booking_reference=reference,
        court_id=court.id,
        customer_id=current_user.id,
        start_datetime=start_dt,
        end_datetime=end_dt,
        status=BookingStatus.PENDING,
        total_amount=total_amount,
        deposit_paid=Decimal("0.00"),
        customer_notes=booking_in.customer_notes,
        created_by_user_id=current_user.id,
    )
    booking = booking_crud.create_booking(session, booking)
    return build_booking_response(session, booking)


def create_staff_booking(
    session: Session,
    current_user: User,
    booking_in: BookingStaffCreate,
) -> BookingResponse:
    """Staff/Admin creates a booking for a customer or walk-in."""
    court = court_crud.get_court_by_id(session, booking_in.court_id)
    if not court or not court.is_active:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Court not found or inactive",
        )

    venue = venue_crud.get_venue_by_id(session, court.venue_id)
    if not venue or not venue.is_active:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Venue not found or inactive",
        )

    start_dt = _ensure_tz_aware(booking_in.start_datetime)
    end_dt = _ensure_tz_aware(booking_in.end_datetime)

    _validate_booking_window(session, court, venue, start_dt, end_dt)

    # Determine customer
    customer_id: uuid.UUID
    if booking_in.customer_id:
        cust = user_crud.get_user_by_id(session, booking_in.customer_id)
        if not cust:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Customer not found")
        customer_id = cust.id
    elif booking_in.customer_phone:
        clean_phone = booking_in.customer_phone.strip()
        cust = user_crud.get_user_by_phone(session, clean_phone)
        if not cust:
            # Auto-create walk-in customer account
            from app.core.security import get_password_hash
            cust = User(
                phone_number=clean_phone,
                full_name=booking_in.customer_name or f"Walk-in ({clean_phone[-4:]})",
                hashed_password=get_password_hash(clean_phone),  # default password is phone
                role=UserRole.CUSTOMER,
                is_active=True,
            )
            session.add(cust)
            session.commit()
            session.refresh(cust)
        customer_id = cust.id
    else:
        # Default to staff member if no customer specified
        customer_id = current_user.id

    booking_crud.expire_stale_pending_bookings(session, hold_minutes=10)

    conflicts = booking_crud.get_overlapping_bookings(
        session=session,
        court_id=court.id,
        start_datetime=start_dt,
        end_datetime=end_dt,
        with_for_update=True,
    )
    if conflicts:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="The requested time slot is already booked or blocked.",
        )

    total_amount = calculate_booking_price(session, court.id, start_dt, end_dt)
    reference = generate_booking_reference(session, start_dt.date())

    booking = Booking(
        booking_reference=reference,
        court_id=court.id,
        customer_id=customer_id,
        start_datetime=start_dt,
        end_datetime=end_dt,
        status=booking_in.status,
        total_amount=total_amount,
        deposit_paid=booking_in.deposit_paid,
        customer_notes=booking_in.customer_notes,
        internal_notes=booking_in.internal_notes,
        created_by_user_id=current_user.id,
    )
    booking = booking_crud.create_booking(session, booking)
    return build_booking_response(session, booking)


def create_court_block(
    session: Session,
    current_user: User,
    block_in: BookingBlockCreate,
) -> BookingResponse:
    """Staff/Admin manually blocks a court for maintenance, tournament, or hold."""
    court = court_crud.get_court_by_id(session, block_in.court_id)
    if not court:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Court not found")

    start_dt = _ensure_tz_aware(block_in.start_datetime)
    end_dt = _ensure_tz_aware(block_in.end_datetime)

    if start_dt >= end_dt:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="start_datetime must be before end_datetime")

    booking_crud.expire_stale_pending_bookings(session, hold_minutes=10)

    conflicts = booking_crud.get_overlapping_bookings(
        session=session,
        court_id=court.id,
        start_datetime=start_dt,
        end_datetime=end_dt,
        with_for_update=True,
    )
    if conflicts:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="The requested time window conflicts with an existing booking or block.",
        )

    reference = generate_booking_reference(session, start_dt.date())
    booking = Booking(
        booking_reference=reference,
        court_id=court.id,
        customer_id=current_user.id,
        start_datetime=start_dt,
        end_datetime=end_dt,
        status=BookingStatus.BLOCKED,
        total_amount=Decimal("0.00"),
        deposit_paid=Decimal("0.00"),
        customer_notes=block_in.reason,
        internal_notes=block_in.internal_notes,
        created_by_user_id=current_user.id,
    )
    booking = booking_crud.create_booking(session, booking)
    return build_booking_response(session, booking)


def cancel_booking(
    session: Session,
    booking_id: uuid.UUID,
    current_user: User,
    cancel_in: BookingCancel,
) -> BookingResponse:
    """Cancel a booking. Customers can cancel own upcoming bookings; staff can cancel any."""
    booking = booking_crud.get_booking_by_id(session, booking_id)
    if not booking:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Booking not found")

    if booking.status == BookingStatus.CANCELLED:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Booking is already cancelled")

    is_staff_or_admin = current_user.role in [UserRole.STAFF, UserRole.ADMIN]

    if not is_staff_or_admin:
        # Customer permissions
        if booking.customer_id != current_user.id:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not authorized to cancel this booking")
        if booking.status not in [BookingStatus.PENDING, BookingStatus.CONFIRMED]:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=f"Cannot cancel a {booking.status.value} booking")
        if _ensure_tz_aware(booking.start_datetime) <= utc_now():
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Cannot cancel a booking that has already started")

    booking = booking_crud.update_booking(
        session=session,
        booking=booking,
        update_data={
            "status": BookingStatus.CANCELLED,
            "cancellation_reason": cancel_in.cancellation_reason,
            "cancelled_at": utc_now(),
        },
    )
    return build_booking_response(session, booking)


def update_booking_status(
    session: Session,
    booking_id: uuid.UUID,
    current_user: User,
    status_in: BookingStatusUpdate,
) -> BookingResponse:
    """Staff/Admin transition booking status."""
    booking = booking_crud.get_booking_by_id(session, booking_id)
    if not booking:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Booking not found")

    update_dict = {"status": status_in.status}
    if status_in.internal_notes is not None:
        update_dict["internal_notes"] = status_in.internal_notes
    if status_in.status == BookingStatus.CANCELLED and not booking.cancelled_at:
        update_dict["cancelled_at"] = utc_now()

    booking = booking_crud.update_booking(session, booking, update_dict)
    return build_booking_response(session, booking)
