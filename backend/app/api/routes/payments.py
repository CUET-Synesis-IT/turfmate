from datetime import date
from typing import Optional
import urllib.parse
import uuid
from fastapi import APIRouter, Depends, Query, Request, status
from fastapi.responses import JSONResponse, RedirectResponse
from sqlmodel import Session
from app.api.deps import get_current_user, get_session, require_staff_or_admin
from app.core.config import settings
from app.crud import booking as booking_crud
from app.crud import payment as payment_crud
from app.models.payment import PaymentMethod, PaymentStatus
from app.models.user import User
from app.schemas.payment import (
    PaymentCreateManual,
    PaymentResponse,
    SSLCommerzInitRequest,
    SSLCommerzInitResponse,
)
from app.services import payment_service, sslcommerz_service

router = APIRouter(tags=["Payments"])


@router.post(
    "/payments/sslcommerz/initiate",
    response_model=SSLCommerzInitResponse,
    summary="Initiate SSLCOMMERZ online payment checkout session",
)
def initiate_sslcommerz(
    init_in: SSLCommerzInitRequest,
    request: Request,
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user),
) -> SSLCommerzInitResponse:
    """Initiates an SSLCommerz gateway session and returns GatewayPageURL."""
    # Build base backend URL from current request
    base_url = str(request.base_url).rstrip("/")
    return sslcommerz_service.initiate_sslcommerz_session(
        session=session,
        booking_id=str(init_in.booking_id),
        amount=init_in.amount,
        backend_url=base_url,
    )


@router.post(
    "/payments/sslcommerz/success",
    summary="SSLCOMMERZ success callback redirect",
)
async def sslcommerz_success(
    request: Request,
    session: Session = Depends(get_session),
):
    """Callback triggered by SSLCommerz after successful player checkout."""
    form_data = await request.form()
    val_id = str(form_data.get("val_id", "")).strip()
    tran_id = str(form_data.get("tran_id", "")).strip()

    if not val_id or not tran_id:
        return RedirectResponse(
            url=f"{settings.FRONTEND_URL}/booking/failed?error=Missing+transaction+data",
            status_code=status.HTTP_303_SEE_OTHER,
        )

    payment = sslcommerz_service.validate_sslcommerz_payment(
        session=session,
        val_id=val_id,
        tran_id=tran_id,
    )

    if payment and payment.status == PaymentStatus.COMPLETED:
        booking = booking_crud.get_booking_by_id(session, payment.booking_id)
        booking_ref = booking.booking_reference if booking else ""

        accept_header = request.headers.get("accept", "")
        if "application/json" in accept_header and "text/html" not in accept_header:
            return {
                "status": "SUCCESS",
                "message": "Payment verified and booking confirmed successfully.",
                "transaction_id": tran_id,
                "booking_reference": booking_ref,
                "amount": float(payment.amount),
            }

        redirect_url = f"{settings.FRONTEND_URL}/booking/success?ref={booking_ref}&tran_id={tran_id}&amount={float(payment.amount)}"
        return RedirectResponse(url=redirect_url, status_code=status.HTTP_303_SEE_OTHER)

    return RedirectResponse(
        url=f"{settings.FRONTEND_URL}/booking/failed?tran_id={tran_id}&error=Payment+validation+failed",
        status_code=status.HTTP_303_SEE_OTHER,
    )


@router.post(
    "/payments/sslcommerz/fail",
    summary="SSLCOMMERZ failure callback redirect",
)
async def sslcommerz_fail(
    request: Request,
    session: Session = Depends(get_session),
):
    """Callback triggered by SSLCommerz if checkout transaction fails."""
    form_data = await request.form()
    tran_id = str(form_data.get("tran_id", "")).strip()
    error_msg = str(form_data.get("error", "Payment failed on gateway")).strip()

    if tran_id:
        sslcommerz_service.handle_failed_payment(session, tran_id, reason=error_msg)

    accept_header = request.headers.get("accept", "")
    if "application/json" in accept_header and "text/html" not in accept_header:
        return {
            "status": "FAILED",
            "message": error_msg,
            "transaction_id": tran_id,
        }

    encoded_error = urllib.parse.quote_plus(error_msg)
    redirect_url = f"{settings.FRONTEND_URL}/booking/failed?tran_id={tran_id}&error={encoded_error}"
    return RedirectResponse(url=redirect_url, status_code=status.HTTP_303_SEE_OTHER)


@router.post(
    "/payments/sslcommerz/cancel",
    summary="SSLCOMMERZ cancellation callback redirect",
)
async def sslcommerz_cancel(
    request: Request,
    session: Session = Depends(get_session),
):
    """Callback triggered by SSLCommerz if customer cancels payment session."""
    form_data = await request.form()
    tran_id = str(form_data.get("tran_id", "")).strip()

    if tran_id:
        sslcommerz_service.handle_failed_payment(session, tran_id, reason="Customer cancelled checkout")

    accept_header = request.headers.get("accept", "")
    if "application/json" in accept_header and "text/html" not in accept_header:
        return {
            "status": "CANCELLED",
            "message": "Payment was cancelled by user.",
            "transaction_id": tran_id,
        }

    redirect_url = f"{settings.FRONTEND_URL}/booking/cancel?tran_id={tran_id}"
    return RedirectResponse(url=redirect_url, status_code=status.HTTP_303_SEE_OTHER)


@router.post(
    "/payments/sslcommerz/ipn",
    summary="SSLCOMMERZ Instant Payment Notification (IPN webhook)",
)
async def sslcommerz_ipn(
    request: Request,
    session: Session = Depends(get_session),
):
    """Server-to-server webhook invoked asynchronously by SSLCommerz."""
    form_data = await request.form()
    val_id = str(form_data.get("val_id", "")).strip()
    tran_id = str(form_data.get("tran_id", "")).strip()

    if val_id and tran_id:
        sslcommerz_service.validate_sslcommerz_payment(
            session=session,
            val_id=val_id,
            tran_id=tran_id,
        )

    return {"status": "IPN_RECEIVED"}


@router.post(
    "/bookings/{booking_id}/payments",
    response_model=PaymentResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Record offline/desk payment (Staff/Admin)",
)
def record_desk_payment(
    booking_id: uuid.UUID,
    payment_in: PaymentCreateManual,
    session: Session = Depends(get_session),
    current_user: User = Depends(require_staff_or_admin),
) -> PaymentResponse:
    """Staff/Admin records an in-person payment (Cash, offline bKash/Nagad at the turf desk)."""
    return payment_service.record_manual_payment(
        session=session,
        booking_id=booking_id,
        current_user=current_user,
        payment_in=payment_in,
    )


@router.get(
    "/bookings/{booking_id}/payments",
    response_model=list[PaymentResponse],
    summary="Get payment history for a booking",
)
def get_booking_payments(
    booking_id: uuid.UUID,
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user),
) -> list[PaymentResponse]:
    """Retrieve all payments made towards a specific booking."""
    return payment_service.get_booking_payments(
        session=session,
        booking_id=booking_id,
        current_user=current_user,
    )


@router.get(
    "/payments",
    response_model=list[PaymentResponse],
    summary="List payments with filtering (Staff/Admin only)",
)
def list_payments(
    session: Session = Depends(get_session),
    current_user: User = Depends(require_staff_or_admin),
    booking_id: Optional[uuid.UUID] = Query(None),
    payment_method: Optional[PaymentMethod] = Query(None),
    status: Optional[PaymentStatus] = Query(None),
    start_date: Optional[date] = Query(None),
    end_date: Optional[date] = Query(None),
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
) -> list[PaymentResponse]:
    """List financial transaction records for administrative reporting."""
    payments, _ = payment_crud.list_payments(
        session=session,
        booking_id=booking_id,
        payment_method=payment_method,
        status=status,
        start_date=start_date,
        end_date=end_date,
        skip=skip,
        limit=limit,
    )
    return [PaymentResponse.model_validate(p) for p in payments]
