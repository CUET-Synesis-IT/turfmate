#!/usr/bin/env python3
"""
Seed script to populate initial database records for TurfMate Arena Cumilla.
Sets up:
1. Superuser, Business Admin, Staff, and Customer users.
2. Venue: TurfMate Arena Cumilla (Brahmanpara, Cumilla).
3. Court: Single 7-A-Side pitch (The Champions Ground).
4. Pricing Rules: Day Rate (৳1,200/hr) vs Night Floodlight Rate (৳1,500/hr).
"""

from datetime import time
from decimal import Decimal
import os
import sys

# Ensure backend root is on PYTHONPATH
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from sqlmodel import Session, select, delete
from app.db.session import engine
from app.models.user import User, UserRole
from app.models.venue import Venue, FacilityStatus
from app.models.court import Court, SportType
from app.models.pricing_rules import PricingRule
from app.core.security import get_password_hash


def seed_data():
    with Session(engine) as session:
        print("--- 1. Seeding Users ---")
        user_specs = [
            {
                "phone_number": "01700000001",
                "full_name": "System Superuser",
                "email": "superuser@turfmate.local",
                "role": UserRole.ADMIN,
                "is_superuser": True,
                "password": "SuperUser2026!",
            },
            {
                "phone_number": "01700000002",
                "full_name": "Turf Business Admin",
                "email": "admin@turfmate.local",
                "role": UserRole.ADMIN,
                "is_superuser": False,
                "password": "AdminPassword2026!",
            },
            {
                "phone_number": "01700000003",
                "full_name": "Turf Desk Staff",
                "email": "staff@turfmate.local",
                "role": UserRole.STAFF,
                "is_superuser": False,
                "password": "StaffPassword2026!",
            },
            {
                "phone_number": "01575085455",
                "full_name": "Jon Mia",
                "email": "player.jon@example.com",
                "role": UserRole.CUSTOMER,
                "is_superuser": False,
                "password": "PlayerPassword2026!",
            },
        ]

        for spec in user_specs:
            user = session.exec(select(User).where(User.phone_number == spec["phone_number"])).first()
            if not user:
                user = User(
                    phone_number=spec["phone_number"],
                    full_name=spec["full_name"],
                    email=spec["email"],
                    role=spec["role"],
                    is_superuser=spec["is_superuser"],
                    is_active=True,
                    hashed_password=get_password_hash(spec["password"]),
                )
                session.add(user)
                print(f"Created user: {user.phone_number} ({user.role.value})")
            else:
                user.full_name = spec["full_name"]
                user.email = spec["email"]
                user.role = spec["role"]
                user.is_superuser = spec["is_superuser"]
                user.is_active = True
                user.hashed_password = get_password_hash(spec["password"])
                session.add(user)
                print(f"Updated user: {user.phone_number} ({user.role.value})")

        session.commit()

        print("\n--- 2. Cleaning old dummy venues and courts ---")
        # Soft-deactivate or clean duplicate Chittagong test venues
        old_venues = session.exec(select(Venue).where(Venue.slug != "turfmate-arena-cumilla")).all()
        for ov in old_venues:
            ov.is_active = False
            session.add(ov)
        session.commit()

        print("\n--- 3. Seeding Cumilla Venue ---")
        cumilla_venue = session.exec(select(Venue).where(Venue.slug == "turfmate-arena-cumilla")).first()
        if not cumilla_venue:
            cumilla_venue = Venue(
                name="TurfMate Arena Cumilla",
                slug="turfmate-arena-cumilla",
                description="Cumilla's premier floodlit artificial grass arena. Features professional 7-A-side football pitch, 350+ Lux LED floodlights, AC locker rooms, and automated goal camera replays.",
                district="Cumilla",
                area="Brahmanpara",
                address="Brahmanpara, Cumilla",
                google_maps_url="https://maps.google.com/?q=Brahmanpara+Cumilla",
                contact_phone="01700000002",
                contact_email="cumilla@turfmate.com",
                status=FacilityStatus.ACTIVE,
                status_note="Open daily 7:00 AM to Midnight with full broadcast floodlights",
                opening_time=time(7, 0),
                closing_time=time(0, 0),
                is_active=True,
            )
            session.add(cumilla_venue)
            session.commit()
            session.refresh(cumilla_venue)
            print(f"Created Venue: {cumilla_venue.name} ({cumilla_venue.id})")
        else:
            cumilla_venue.name = "TurfMate Arena Cumilla"
            cumilla_venue.district = "Cumilla"
            cumilla_venue.area = "Brahmanpara"
            cumilla_venue.address = "Brahmanpara, Cumilla"
            cumilla_venue.opening_time = time(7, 0)
            cumilla_venue.closing_time = time(0, 0)
            cumilla_venue.status = FacilityStatus.ACTIVE
            cumilla_venue.status_note = "Open daily 7:00 AM to Midnight with full broadcast floodlights"
            cumilla_venue.is_active = True
            session.add(cumilla_venue)
            session.commit()
            session.refresh(cumilla_venue)
            print(f"Updated Venue: {cumilla_venue.name} ({cumilla_venue.id})")

        print("\n--- 4. Seeding 7-A-Side Court ---")
        # Deactivate any courts not matching our pitch
        other_courts = session.exec(select(Court).where(Court.venue_id == cumilla_venue.id, Court.name != "The Champions Ground (7-A-Side)")).all()
        for oc in other_courts:
            oc.is_active = False
            session.add(oc)
        session.commit()

        court = session.exec(
            select(Court).where(Court.venue_id == cumilla_venue.id, Court.name == "The Champions Ground (7-A-Side)")
        ).first()

        if not court:
            court = Court(
                venue_id=cumilla_venue.id,
                name="The Champions Ground (7-A-Side)",
                sport_type=SportType.FOOTBALL,
                court_size="7-a-side (45m × 30m)",
                surface_type="FIFA-Quality Pro Artificial Turf (50mm shockpad)",
                base_price_per_hour=Decimal("1200.00"),
                is_indoor=False,
                status=FacilityStatus.ACTIVE,
                status_note="Surface groomed daily at 6:00 AM. Match ball & bibs included.",
                is_active=True,
            )
            session.add(court)
            session.commit()
            session.refresh(court)
            print(f"Created Court: {court.name} ({court.id})")
        else:
            court.court_size = "7-a-side (45m × 30m)"
            court.surface_type = "FIFA-Quality Pro Artificial Turf (50mm shockpad)"
            court.base_price_per_hour = Decimal("1200.00")
            court.status = FacilityStatus.ACTIVE
            court.status_note = "Surface groomed daily at 6:00 AM. Match ball & bibs included."
            court.is_active = True
            session.add(court)
            session.commit()
            session.refresh(court)
            print(f"Updated Court: {court.name} ({court.id})")

        print("\n--- 5. Seeding Pricing Rules ---")
        # Clear existing pricing rules for this court
        old_rules = session.exec(select(PricingRule).where(PricingRule.court_id == court.id)).all()
        for r in old_rules:
            session.delete(r)
        session.commit()

        day_rule = PricingRule(
            court_id=court.id,
            name="Day Standard Rate",
            day_of_week=None,
            start_time=time(7, 0),
            end_time=time(17, 0),
            price_per_hour=Decimal("1200.00"),
            is_active=True,
        )
        night_rule = PricingRule(
            court_id=court.id,
            name="Prime Night Floodlight Rate",
            day_of_week=None,
            start_time=time(17, 0),
            end_time=time(0, 0),
            price_per_hour=Decimal("1500.00"),
            is_active=True,
        )
        session.add(day_rule)
        session.add(night_rule)
        session.commit()
        print("Created Day Rule (07:00 - 17:00): BDT 1,200/hr")
        print("Created Night Rule (17:00 - 00:00): BDT 1,500/hr")

        print("\n Seeding completed successfully!")


if __name__ == "__main__":
    seed_data()
