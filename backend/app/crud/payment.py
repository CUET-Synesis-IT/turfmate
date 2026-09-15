from datetime import date, datetime, time, timedelta, timezone
from decimal import Decimal
from typing import Optional
import uuid
from sqlmodel import Session, col, func, select
from app.models.payment import Payment, PaymentMethod, PaymentStatus


def get_payment_by_id(session: Session, payment_id: uuid.UUID) -> Optional[Payment]:
    """Retrieve a payment by UUID."""
    return session.get(Payment, payment_id)


def get_payment_by_tran_id(session: Session, transaction_id: str) -> Optional[Payment]:
    """Retrieve a payment by unique gateway transaction ID."""
    statement = select(Payment).where(Payment.transaction_id == transaction_id.strip())
    return session.exec(statement).first()


def get_payments_by_booking_id(session: Session, booking_id: uuid.UUID) -> list[Payment]:
    """Get all payments associated with a booking."""
    statement = (
        select(Payment)
        .where(Payment.booking_id == booking_id)
        .order_by(Payment.created_at.desc())
    )
    return list(session.exec(statement).all())


def get_total_paid_for_booking(session: Session, booking_id: uuid.UUID) -> Decimal:
    """Calculate the total sum of completed payments for a booking."""
    statement = select(func.coalesce(func.sum(Payment.amount), Decimal("0.00"))).where(
        Payment.booking_id == booking_id,
        Payment.status == PaymentStatus.COMPLETED,
    )
    result = session.exec(statement).one()
    return Decimal(str(result))


def create_payment(session: Session, payment: Payment) -> Payment:
    """Persist a new payment record."""
    session.add(payment)
    session.commit()
    session.refresh(payment)
    return payment


def update_payment(session: Session, payment: Payment, update_data: dict) -> Payment:
    """Update fields on an existing payment."""
    for key, value in update_data.items():
        setattr(payment, key, value)
    session.add(payment)
    session.commit()
    session.refresh(payment)
    return payment


def list_payments(
    session: Session,
    booking_id: Optional[uuid.UUID] = None,
    payment_method: Optional[PaymentMethod] = None,
    status: Optional[PaymentStatus] = None,
    start_date: Optional[date] = None,
    end_date: Optional[date] = None,
    skip: int = 0,
    limit: int = 50,
) -> tuple[list[Payment], int]:
    """List payment transactions with filters and pagination."""
    query = select(Payment)

    if booking_id is not None:
        query = query.where(Payment.booking_id == booking_id)

    if payment_method is not None:
        query = query.where(Payment.payment_method == payment_method)

    if status is not None:
        query = query.where(Payment.status == status)

    if start_date is not None:
        start_dt = datetime.combine(start_date, time.min).replace(tzinfo=timezone.utc)
        query = query.where(Payment.created_at >= start_dt)

    if end_date is not None:
        end_dt = datetime.combine(end_date + timedelta(days=1), time.min).replace(tzinfo=timezone.utc)
        query = query.where(Payment.created_at < end_dt)

    count_statement = select(func.count()).select_from(query.subquery())
    total = session.exec(count_statement).one()

    paginated_query = query.order_by(Payment.created_at.desc()).offset(skip).limit(limit)
    payments = list(session.exec(paginated_query).all())

    return payments, total
