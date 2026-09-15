from decimal import Decimal
from typing import Optional
import uuid
from fastapi import HTTPException, status
from sqlmodel import Session
from app.crud import booking as booking_crud
from app.crud import payment as payment_crud
from app.models.base import utc_now
from app.models.booking import BookingStatus
from app.models.payment import Payment, PaymentStatus
from app.models.user import User, UserRole
from app.schemas.payment import PaymentCreateManual, PaymentResponse


def record_manual_payment(
    session: Session,
    booking_id: uuid.UUID,
    current_user: User,
    payment_in: PaymentCreateManual,
) -> PaymentResponse:
    """Record an offline/desk payment (Cash, offline bKash, Nagad, etc.) by Staff/Admin."""
    booking = booking_crud.get_booking_by_id(session, booking_id)
    if not booking:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Booking not found",
        )

    if booking.status == BookingStatus.CANCELLED:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot record payment for a cancelled booking",
        )

    # Persist completed payment
    payment = Payment(
        booking_id=booking.id,
        amount=payment_in.amount,
        currency="BDT",
        payment_method=payment_in.payment_method,
        status=PaymentStatus.COMPLETED,
        transaction_id=payment_in.transaction_id,
        paid_at=utc_now(),
        recorded_by_user_id=current_user.id,
        notes=payment_in.notes,
    )
    payment = payment_crud.create_payment(session, payment)

    # Recalculate total payments and update booking
    total_paid = payment_crud.get_total_paid_for_booking(session, booking.id)
    update_dict = {"deposit_paid": total_paid}
    if booking.status == BookingStatus.PENDING:
        update_dict["status"] = BookingStatus.CONFIRMED

    booking_crud.update_booking(session, booking, update_dict)

    return PaymentResponse.model_validate(payment)


def get_booking_payments(
    session: Session,
    booking_id: uuid.UUID,
    current_user: User,
) -> list[PaymentResponse]:
    """List all payment records for a specific booking."""
    booking = booking_crud.get_booking_by_id(session, booking_id)
    if not booking:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Booking not found",
        )

    is_staff_or_admin = current_user.role in [UserRole.STAFF, UserRole.ADMIN]
    if not is_staff_or_admin and booking.customer_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to view payments for this booking",
        )

    payments = payment_crud.get_payments_by_booking_id(session, booking_id)
    return [PaymentResponse.model_validate(p) for p in payments]
