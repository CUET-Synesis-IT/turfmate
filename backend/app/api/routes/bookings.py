from datetime import date
from typing import Optional
import uuid
from fastapi import APIRouter, Depends, Query, status
from sqlmodel import Session
from app.api.deps import get_current_user, get_session, require_staff_or_admin
from app.crud import booking as booking_crud
from app.models.booking import BookingStatus
from app.models.user import User, UserRole
from app.schemas.booking import (
    BookingBlockCreate,
    BookingCancel,
    BookingCreate,
    BookingResponse,
    BookingStaffCreate,
    BookingStatusUpdate,
    CourtAvailabilityResponse,
)
from app.services import booking_service

router = APIRouter(tags=["Bookings"])


@router.get(
    "/courts/{court_id}/availability",
    response_model=CourtAvailabilityResponse,
    summary="Get slot availability for a court on a date",
)
def get_court_availability(
    court_id: uuid.UUID,
    date: date = Query(..., description="Target date in YYYY-MM-DD format"),
    duration_minutes: int = Query(60, ge=30, le=180, description="Slot duration in minutes"),
    session: Session = Depends(get_session),
) -> CourtAvailabilityResponse:
    """Public endpoint to view court slot availability with dynamic pricing."""
    return booking_service.get_court_availability(
        session=session,
        court_id=court_id,
        target_date=date,
        duration_minutes=duration_minutes,
    )


@router.post(
    "/bookings",
    response_model=BookingResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create a booking (Customer self-booking)",
)
def create_customer_booking(
    booking_in: BookingCreate,
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user),
) -> BookingResponse:
    """Authenticated customer books a slot."""
    return booking_service.create_customer_booking(
        session=session,
        current_user=current_user,
        booking_in=booking_in,
    )


@router.post(
    "/bookings/staff",
    response_model=BookingResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create booking for customer or walk-in (Staff/Admin)",
)
def create_staff_booking(
    booking_in: BookingStaffCreate,
    session: Session = Depends(get_session),
    current_user: User = Depends(require_staff_or_admin),
) -> BookingResponse:
    """Staff/Admin creates a booking for a specific customer or counter walk-in."""
    return booking_service.create_staff_booking(
        session=session,
        current_user=current_user,
        booking_in=booking_in,
    )


@router.post(
    "/bookings/block",
    response_model=BookingResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Manually block a court slot (Staff/Admin)",
)
def create_court_block(
    block_in: BookingBlockCreate,
    session: Session = Depends(get_session),
    current_user: User = Depends(require_staff_or_admin),
) -> BookingResponse:
    """Staff/Admin locks a court window for maintenance, private events, or VIP holds."""
    return booking_service.create_court_block(
        session=session,
        current_user=current_user,
        block_in=block_in,
    )


@router.get(
    "/bookings",
    response_model=list[BookingResponse],
    summary="List bookings with filtering",
)
def list_bookings(
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user),
    court_id: Optional[uuid.UUID] = Query(None, description="Filter by court ID"),
    venue_id: Optional[uuid.UUID] = Query(None, description="Filter by venue ID"),
    customer_id: Optional[uuid.UUID] = Query(None, description="Filter by customer ID (Staff/Admin only)"),
    status: Optional[BookingStatus] = Query(None, description="Filter by status"),
    start_date: Optional[date] = Query(None, description="Filter bookings on or after date"),
    end_date: Optional[date] = Query(None, description="Filter bookings on or before date"),
    search: Optional[str] = Query(None, description="Search reference, phone, or customer name"),
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
) -> list[BookingResponse]:
    """List bookings. Customers only see their own; Staff/Admin can view all and filter."""
    is_staff = current_user.role in [UserRole.STAFF, UserRole.ADMIN]
    query_customer_id = customer_id if is_staff else current_user.id

    bookings, _ = booking_crud.list_bookings(
        session=session,
        customer_id=query_customer_id,
        court_id=court_id,
        venue_id=venue_id,
        status=status,
        start_date=start_date,
        end_date=end_date,
        search=search if is_staff else None,
        skip=skip,
        limit=limit,
    )
    return [booking_service.build_booking_response(session, b) for b in bookings]


@router.get(
    "/bookings/{booking_id}",
    response_model=BookingResponse,
    summary="Get single booking details",
)
def get_booking(
    booking_id: uuid.UUID,
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user),
) -> BookingResponse:
    """Retrieve booking by UUID."""
    from fastapi import HTTPException
    booking = booking_crud.get_booking_by_id(session, booking_id)
    if not booking:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Booking not found")

    is_staff = current_user.role in [UserRole.STAFF, UserRole.ADMIN]
    if not is_staff and booking.customer_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access forbidden")

    return booking_service.build_booking_response(session, booking)


@router.get(
    "/bookings/reference/{reference}",
    response_model=BookingResponse,
    summary="Get booking by reference code",
)
def get_booking_by_reference(
    reference: str,
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user),
) -> BookingResponse:
    """Retrieve booking by human-readable reference code."""
    from fastapi import HTTPException
    booking = booking_crud.get_booking_by_reference(session, reference)
    if not booking:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Booking not found")

    is_staff = current_user.role in [UserRole.STAFF, UserRole.ADMIN]
    if not is_staff and booking.customer_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access forbidden")

    return booking_service.build_booking_response(session, booking)


@router.post(
    "/bookings/{booking_id}/cancel",
    response_model=BookingResponse,
    summary="Cancel a booking",
)
def cancel_booking(
    booking_id: uuid.UUID,
    cancel_in: BookingCancel,
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user),
) -> BookingResponse:
    """Cancel booking with a reason."""
    return booking_service.cancel_booking(
        session=session,
        booking_id=booking_id,
        current_user=current_user,
        cancel_in=cancel_in,
    )


@router.patch(
    "/bookings/{booking_id}/status",
    response_model=BookingResponse,
    summary="Update booking status (Staff/Admin)",
)
def update_booking_status(
    booking_id: uuid.UUID,
    status_in: BookingStatusUpdate,
    session: Session = Depends(get_session),
    current_user: User = Depends(require_staff_or_admin),
) -> BookingResponse:
    """Staff/Admin transition booking status (confirmed, completed, no_show, etc.)."""
    return booking_service.update_booking_status(
        session=session,
        booking_id=booking_id,
        current_user=current_user,
        status_in=status_in,
    )
