from decimal import Decimal
import random
import string
from typing import Any, Optional
import httpx
from fastapi import HTTPException, status
from sqlmodel import Session
from app.core.config import settings
from app.crud import booking as booking_crud
from app.crud import payment as payment_crud
from app.crud import user as user_crud
from app.models.base import utc_now
from app.models.booking import Booking, BookingStatus
from app.models.payment import Payment, PaymentMethod, PaymentStatus
from app.schemas.payment import SSLCommerzInitResponse


def generate_transaction_id(booking_ref: str) -> str:
    """Generate a unique transaction identifier for SSLCommerz."""
    rand_chars = "".join(random.choices(string.ascii_uppercase + string.digits, k=4))
    return f"TXN-{booking_ref}-{rand_chars}"


def initiate_sslcommerz_session(
    session: Session,
    booking_id: str,
    amount: Optional[Decimal] = None,
    backend_url: Optional[str] = None,
) -> SSLCommerzInitResponse:
    """Initiate an online payment session with SSLCOMMERZ Sandbox/Live Gateway."""
    import uuid
    booking_uuid = uuid.UUID(str(booking_id))
    booking = booking_crud.get_booking_by_id(session, booking_uuid)
    if not booking:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Booking not found",
        )

    if booking.status in [BookingStatus.CANCELLED, BookingStatus.COMPLETED]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Cannot initiate payment for a {booking.status.value} booking",
        )

    remaining_due = max(Decimal("0.00"), booking.total_amount - booking.deposit_paid)
    pay_amount = amount if amount is not None else remaining_due

    if pay_amount <= Decimal("0.00"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Payment amount must be greater than zero",
        )

    customer = user_crud.get_user_by_id(session, booking.customer_id)
    cus_name = customer.full_name if customer else "Turf Player"
    cus_phone = customer.phone_number if customer else "01700000000"
    cus_email = (customer.email if customer and customer.email else "player@turfmate.local")

    tran_id = generate_transaction_id(booking.booking_reference)
    base_url = (backend_url or settings.BACKEND_API_URL).rstrip("/")

    post_data = {
        "store_id": settings.SSLCOMMERZ_STORE_ID,
        "store_passwd": settings.SSLCOMMERZ_STORE_PASS,
        "total_amount": str(pay_amount),
        "currency": "BDT",
        "tran_id": tran_id,
        "success_url": f"{base_url}/api/v1/payments/sslcommerz/success",
        "fail_url": f"{base_url}/api/v1/payments/sslcommerz/fail",
        "cancel_url": f"{base_url}/api/v1/payments/sslcommerz/cancel",
        "ipn_url": f"{base_url}/api/v1/payments/sslcommerz/ipn",
        # Customer Info
        "cus_name": cus_name,
        "cus_email": cus_email,
        "cus_add1": "Chittagong",
        "cus_city": "Chittagong",
        "cus_country": "Bangladesh",
        "cus_phone": cus_phone,
        # Shipping / Product Info
        "shipping_method": "NO",
        "product_name": f"Turf Booking {booking.booking_reference}",
        "product_category": "Sports",
        "product_profile": "general",
    }

    # Call SSLCOMMERZ gateway session endpoint
    init_endpoint = f"{settings.SSLCOMMERZ_BASE_URL}/gwprocess/v4/api.php"
    try:
        with httpx.Client(timeout=15.0) as client:
            resp = client.post(init_endpoint, data=post_data)
            resp_data = resp.json()
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=f"SSLCommerz gateway connection error: {str(e)}",
        )

    if resp_data.get("status") != "SUCCESS" or not resp_data.get("GatewayPageURL"):
        error_reason = resp_data.get("failedreason", "Unknown SSLCommerz error")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"SSLCommerz session creation failed: {error_reason}",
        )

    gateway_url = resp_data["GatewayPageURL"]
    session_key = resp_data.get("sessionkey")

    # Persist pending payment
    payment = Payment(
        booking_id=booking.id,
        amount=pay_amount,
        currency="BDT",
        payment_method=PaymentMethod.ONLINE_GATEWAY,
        status=PaymentStatus.PENDING,
        transaction_id=tran_id,
        notes=f"SSLCommerz Session: {session_key}",
    )
    payment_crud.create_payment(session, payment)

    return SSLCommerzInitResponse(
        status="SUCCESS",
        gateway_url=gateway_url,
        session_key=session_key,
        transaction_id=tran_id,
        amount=pay_amount,
        currency="BDT",
    )


def validate_sslcommerz_payment(
    session: Session,
    val_id: str,
    tran_id: str,
) -> Optional[Payment]:
    """Validate payment with SSLCOMMERZ Validation API and finalize booking balance."""
    val_endpoint = f"{settings.SSLCOMMERZ_BASE_URL}/validator/api/validationserverAPI.php"
    params = {
        "val_id": val_id,
        "store_id": settings.SSLCOMMERZ_STORE_ID,
        "store_passwd": settings.SSLCOMMERZ_STORE_PASS,
        "v": "1",
        "format": "json",
    }

    try:
        with httpx.Client(timeout=15.0) as client:
            resp = client.get(val_endpoint, params=params)
            val_data = resp.json()
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=f"SSLCommerz validation server unreachable: {str(e)}",
        )

    validation_status = val_data.get("status")
    payment = payment_crud.get_payment_by_tran_id(session, tran_id)
    if not payment:
        return None

    if validation_status in ["VALID", "VALIDATED"]:
        paid_amount = Decimal(str(val_data.get("amount", payment.amount)))
        card_type = val_data.get("card_type", "ONLINE")

        # Map payment method if specific mobile wallet/card is recognized
        method = PaymentMethod.ONLINE_GATEWAY
        card_type_upper = card_type.upper()
        if "BKASH" in card_type_upper:
            method = PaymentMethod.BKASH
        elif "NAGAD" in card_type_upper:
            method = PaymentMethod.NAGAD
        elif any(c in card_type_upper for c in ["VISA", "MASTER", "AMEX", "CARD"]):
            method = PaymentMethod.CARD

        # Update payment
        payment = payment_crud.update_payment(
            session=session,
            payment=payment,
            update_data={
                "status": PaymentStatus.COMPLETED,
                "amount": paid_amount,
                "payment_method": method,
                "paid_at": utc_now(),
                "notes": f"SSLCommerz val_id: {val_id}, card_type: {card_type}",
            },
        )

        # Update booking deposit and confirmation
        booking = booking_crud.get_booking_by_id(session, payment.booking_id)
        if booking:
            total_paid = payment_crud.get_total_paid_for_booking(session, booking.id)
            update_dict = {"deposit_paid": total_paid}
            if booking.status == BookingStatus.PENDING:
                update_dict["status"] = BookingStatus.CONFIRMED
            booking_crud.update_booking(session, booking, update_dict)

        return payment

    else:
        # Mark payment as failed
        payment = payment_crud.update_payment(
            session=session,
            payment=payment,
            update_data={
                "status": PaymentStatus.FAILED,
                "notes": f"SSLCommerz validation rejected: status={validation_status}",
            },
        )
        return payment


def handle_failed_payment(session: Session, tran_id: str, reason: str = "Payment Failed") -> Optional[Payment]:
    """Handle fail or cancel notifications from gateway."""
    payment = payment_crud.get_payment_by_tran_id(session, tran_id)
    if payment and payment.status == PaymentStatus.PENDING:
        payment = payment_crud.update_payment(
            session=session,
            payment=payment,
            update_data={
                "status": PaymentStatus.FAILED,
                "notes": reason,
            },
        )
    return payment
