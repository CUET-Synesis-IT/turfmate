import unittest
from datetime import date, datetime, timedelta, timezone
from decimal import Decimal
import uuid

from sqlmodel import Session, select
from app.db.session import engine
from app.models.base import utc_now
from app.models.booking import Booking, BookingStatus
from app.models.court import Court, SportType
from app.models.user import User, UserRole
from app.models.venue import FacilityStatus, Venue
from app.crud import booking as booking_crud
from app.crud import court as court_crud
from app.crud import user as user_crud
from app.crud import venue as venue_crud
from app.services import booking_service, sslcommerz_service


class TestBookingHoldTimerWorkflow(unittest.TestCase):
    def setUp(self):
        self.session = Session(engine)
        # Find or create a test venue and court
        venues = venue_crud.list_venues(self.session)
        if not venues:
            venue = Venue(
                name="Timer Test Venue",
                address="Test Road, Cumilla",
                area="Brahmanpara",
                district="Cumilla",
                status=FacilityStatus.ACTIVE,
            )
            venue = venue_crud.create_venue(self.session, venue)
            self.venue = venue
        else:
            self.venue = venues[0]

        courts = court_crud.list_courts(self.session, venue_id=self.venue.id)
        if not courts:
            court = Court(
                venue_id=self.venue.id,
                name="Timer Test Pitch",
                sport_type=SportType.FOOTBALL,
                base_price_per_hour=Decimal("1200.00"),
                is_active=True,
                status=FacilityStatus.ACTIVE,
            )
            court = court_crud.create_court(self.session, court)
            self.court = court
        else:
            self.court = courts[0]

        # Customer
        users = self.session.exec(select(User).where(User.role == UserRole.CUSTOMER)).all()
        if not users:
            cust = User(
                phone_number="01511112233",
                full_name="Timer Test Player",
                hashed_password="hash",
                role=UserRole.CUSTOMER,
                is_active=True,
            )
            self.session.add(cust)
            self.session.commit()
            self.customer = cust
        else:
            self.customer = users[0]

    def tearDown(self):
        self.session.close()

    def test_pending_booking_locks_slot_and_expires(self):
        test_date = date.today() + timedelta(days=3)
        start_dt = datetime.combine(test_date, datetime.min.time()).replace(hour=14, minute=0, tzinfo=timezone.utc)
        end_dt = start_dt + timedelta(hours=1)

        # 1. Ensure clean slate
        existing = booking_crud.get_overlapping_bookings(self.session, self.court.id, start_dt, end_dt)
        for b in existing:
            b.status = BookingStatus.CANCELLED
            self.session.add(b)
        self.session.commit()

        # 2. Check initial availability: slot should be "available"
        avail = booking_service.get_court_availability(self.session, self.court.id, test_date)
        slot = next((s for s in avail.slots if s.start_time == start_dt), None)
        self.assertIsNotNone(slot)
        self.assertTrue(slot.is_available)
        self.assertEqual(slot.status, "available")

        # 3. Create a pending booking
        ref = booking_service.generate_booking_reference(self.session, test_date)
        booking = Booking(
            booking_reference=ref,
            court_id=self.court.id,
            customer_id=self.customer.id,
            start_datetime=start_dt,
            end_datetime=end_dt,
            status=BookingStatus.PENDING,
            total_amount=Decimal("1200.00"),
            deposit_paid=Decimal("0.00"),
        )
        booking = booking_crud.create_booking(self.session, booking)

        # 4. Check availability: slot should now be "pending" (held) and unbookable
        avail_held = booking_service.get_court_availability(self.session, self.court.id, test_date)
        slot_held = next((s for s in avail_held.slots if s.start_time == start_dt), None)
        self.assertIsNotNone(slot_held)
        self.assertFalse(slot_held.is_available)
        self.assertEqual(slot_held.status, "pending")
        self.assertIn("held", slot_held.reason.lower())

        # 5. Check build_booking_response includes expires_at (approx 10 minutes in future)
        resp = booking_service.build_booking_response(self.session, booking)
        self.assertIsNotNone(resp.expires_at)
        diff = (resp.expires_at - resp.created_at).total_seconds()
        self.assertAlmostEqual(diff, 600, delta=5)

        # 6. Simulate timer expiration (> 10 minutes elapsed)
        booking.created_at = utc_now() - timedelta(minutes=11)
        self.session.add(booking)
        self.session.commit()

        # 7. When availability is queried, auto-expiration triggers and slot becomes available again
        avail_expired = booking_service.get_court_availability(self.session, self.court.id, test_date)
        slot_freed = next((s for s in avail_expired.slots if s.start_time == start_dt), None)
        self.assertIsNotNone(slot_freed)
        self.assertTrue(slot_freed.is_available)
        self.assertEqual(slot_freed.status, "available")

        # Verify booking in DB is now CANCELLED
        self.session.refresh(booking)
        self.assertEqual(booking.status, BookingStatus.CANCELLED)
        self.assertIn("timed out", booking.cancellation_reason.lower())

    def test_payment_failure_cancels_booking_immediately(self):
        from app.models.payment import Payment, PaymentMethod, PaymentStatus
        from app.crud import payment as payment_crud

        test_date = date.today() + timedelta(days=4)
        start_dt = datetime.combine(test_date, datetime.min.time()).replace(hour=16, minute=0, tzinfo=timezone.utc)
        end_dt = start_dt + timedelta(hours=1)

        ref = booking_service.generate_booking_reference(self.session, test_date)
        booking = Booking(
            booking_reference=ref,
            court_id=self.court.id,
            customer_id=self.customer.id,
            start_datetime=start_dt,
            end_datetime=end_dt,
            status=BookingStatus.PENDING,
            total_amount=Decimal("1200.00"),
            deposit_paid=Decimal("0.00"),
        )
        booking = booking_crud.create_booking(self.session, booking)

        # Create pending payment
        tran_id = f"TM-TEST-{uuid.uuid4().hex[:8].upper()}"
        payment = Payment(
            booking_id=booking.id,
            amount=Decimal("1200.00"),
            currency="BDT",
            payment_method=PaymentMethod.ONLINE_GATEWAY,
            status=PaymentStatus.PENDING,
            transaction_id=tran_id,
        )
        payment = payment_crud.create_payment(self.session, payment)

        # Trigger failed payment notification
        sslcommerz_service.handle_failed_payment(self.session, tran_id, reason="Customer cancelled transaction")

        # Verify booking is CANCELLED immediately
        self.session.refresh(booking)
        self.assertEqual(booking.status, BookingStatus.CANCELLED)
        self.assertIn("cancelled", booking.cancellation_reason.lower())

        # Verify slot is immediately available
        avail = booking_service.get_court_availability(self.session, self.court.id, test_date)
        slot = next((s for s in avail.slots if s.start_time == start_dt), None)
        self.assertIsNotNone(slot)
        self.assertTrue(slot.is_available)
        self.assertEqual(slot.status, "available")


if __name__ == "__main__":
    unittest.main()

