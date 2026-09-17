#!/usr/bin/env python3
"""
Seed script to populate multiple venues and multiple courts in TurfMate.
Creates:
1. Venue 1: TurfMate Arena Cumilla (Brahmanpara, Cumilla)
   - Court 1: The Champions Ground (7-A-Side Football)
   - Court 2: The Thunder Cage (5-A-Side Football)
2. Venue 2: TurfMate Arena Chattogram (GEC Circle, Chattogram)
   - Court 1: The Skyline Arena (7-A-Side Football)
   - Court 2: The Striker Cage (5-A-Side Football)
   - Court 3: The Smash Court (Badminton)
Sets up pricing rules for each court.
"""

from datetime import time
from decimal import Decimal
import os
import sys

# Ensure backend root is on PYTHONPATH
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from sqlmodel import Session, select
from app.db.session import engine
from app.models.venue import Venue, FacilityStatus
from app.models.court import Court, SportType
from app.models.pricing_rules import PricingRule


def seed_venues_and_courts():
    with Session(engine) as session:
        print("--- 1. Deactivating old unused venues ---")
        all_venues = session.exec(select(Venue)).all()
        for v in all_venues:
            if v.slug not in ["turfmate-arena-cumilla", "turfmate-arena-chattogram"]:
                v.is_active = False
                session.add(v)
        session.commit()

        # -----------------------------
        # VENUE 1: CUMILLA
        # -----------------------------
        print("\n--- 2. Seeding Venue 1: Cumilla ---")
        venue_cumilla = session.exec(select(Venue).where(Venue.slug == "turfmate-arena-cumilla")).first()
        if not venue_cumilla:
            venue_cumilla = Venue(
                name="TurfMate Arena Cumilla",
                slug="turfmate-arena-cumilla",
                description="Premier floodlit synthetic turf arena in Brahmanpara, Cumilla.",
                district="Cumilla",
                area="Brahmanpara",
                address="Brahmanpara, Cumilla",
                google_maps_url="https://maps.google.com/?q=Brahmanpara+Cumilla",
                contact_phone="01700000002",
                contact_email="cumilla@turfmate.com",
                status=FacilityStatus.ACTIVE,
                status_note="Open daily 7:00 AM – Midnight",
                opening_time=time(7, 0),
                closing_time=time(0, 0),
                is_active=True,
            )
            session.add(venue_cumilla)
            session.commit()
            session.refresh(venue_cumilla)
            print(f"Created Venue: {venue_cumilla.name}")
        else:
            venue_cumilla.name = "TurfMate Arena Cumilla"
            venue_cumilla.district = "Cumilla"
            venue_cumilla.area = "Brahmanpara"
            venue_cumilla.address = "Brahmanpara, Cumilla"
            venue_cumilla.contact_email = "cumilla@turfmate.com"
            venue_cumilla.is_active = True
            venue_cumilla.status = FacilityStatus.ACTIVE
            session.add(venue_cumilla)
            session.commit()
            session.refresh(venue_cumilla)
            print(f"Updated Venue: {venue_cumilla.name}")

        # Cumilla Courts
        cumilla_courts_data = [
            {
                "name": "The Champions Ground (7-A-Side)",
                "sport_type": SportType.FOOTBALL,
                "court_size": "7-a-side (45m × 30m)",
                "surface_type": "FIFA-Quality Pro Artificial Turf (50mm)",
                "base_price": Decimal("1200.00"),
                "night_price": Decimal("1500.00"),
            },
            {
                "name": "The Thunder Cage (5-A-Side)",
                "sport_type": SportType.FOOTBALL,
                "court_size": "5-a-side (30m × 20m)",
                "surface_type": "50mm Monofilament Shockpad Turf",
                "base_price": Decimal("1000.00"),
                "night_price": Decimal("1200.00"),
            },
        ]

        for c_data in cumilla_courts_data:
            court = session.exec(
                select(Court).where(Court.venue_id == venue_cumilla.id, Court.name == c_data["name"])
            ).first()
            if not court:
                court = Court(
                    venue_id=venue_cumilla.id,
                    name=c_data["name"],
                    sport_type=c_data["sport_type"],
                    court_size=c_data["court_size"],
                    surface_type=c_data["surface_type"],
                    base_price_per_hour=c_data["base_price"],
                    status=FacilityStatus.ACTIVE,
                    is_active=True,
                )
                session.add(court)
                session.commit()
                session.refresh(court)
                print(f"  Created Court: {court.name}")
            else:
                court.court_size = c_data["court_size"]
                court.surface_type = c_data["surface_type"]
                court.base_price_per_hour = c_data["base_price"]
                court.is_active = True
                court.status = FacilityStatus.ACTIVE
                session.add(court)
                session.commit()
                session.refresh(court)
                print(f"  Updated Court: {court.name}")

            # Pricing rules
            session.exec(select(PricingRule).where(PricingRule.court_id == court.id))
            # clear existing
            for r in session.exec(select(PricingRule).where(PricingRule.court_id == court.id)).all():
                session.delete(r)
            session.commit()

            day_r = PricingRule(
                court_id=court.id,
                name="Day Standard Rate",
                start_time=time(7, 0),
                end_time=time(17, 0),
                price_per_hour=c_data["base_price"],
                is_active=True,
            )
            night_r = PricingRule(
                court_id=court.id,
                name="Night Floodlights Rate",
                start_time=time(17, 0),
                end_time=time(0, 0),
                price_per_hour=c_data["night_price"],
                is_active=True,
            )
            session.add(day_r)
            session.add(night_r)
            session.commit()

        # -----------------------------
        # VENUE 2: CHATTOGRAM
        # -----------------------------
        print("\n--- 3. Seeding Venue 2: Chattogram ---")
        venue_ctg = session.exec(select(Venue).where(Venue.slug == "turfmate-arena-chattogram")).first()
        if not venue_ctg:
            venue_ctg = Venue(
                name="TurfMate Arena Chattogram",
                slug="turfmate-arena-chattogram",
                description="Iconic rooftop & floodlit ground venue at Nasirabad, GEC Circle.",
                district="Chattogram",
                area="GEC Circle",
                address="Plot 14, Nasirabad Sports Zone, GEC Circle",
                google_maps_url="https://maps.google.com/?q=GEC+Circle+Chattogram",
                contact_phone="01700000003",
                contact_email="chattogram@turfmate.com",
                status=FacilityStatus.ACTIVE,
                status_note="Open daily 7:00 AM – 1:00 AM",
                opening_time=time(7, 0),
                closing_time=time(1, 0),
                is_active=True,
            )
            session.add(venue_ctg)
            session.commit()
            session.refresh(venue_ctg)
            print(f"Created Venue: {venue_ctg.name}")
        else:
            venue_ctg.name = "TurfMate Arena Chattogram"
            venue_ctg.district = "Chattogram"
            venue_ctg.area = "GEC Circle"
            venue_ctg.address = "Plot 14, Nasirabad Sports Zone, GEC Circle"
            venue_ctg.contact_email = "chattogram@turfmate.com"
            venue_ctg.is_active = True
            venue_ctg.status = FacilityStatus.ACTIVE
            session.add(venue_ctg)
            session.commit()
            session.refresh(venue_ctg)
            print(f"Updated Venue: {venue_ctg.name}")

        # Chattogram Courts
        ctg_courts_data = [
            {
                "name": "The Skyline Arena (7-A-Side)",
                "sport_type": SportType.FOOTBALL,
                "court_size": "7-a-side (45m × 30m)",
                "surface_type": "FIFA Pro Monofilament Shockpad",
                "base_price": Decimal("1500.00"),
                "night_price": Decimal("1800.00"),
            },
            {
                "name": "The Striker Cage (5-A-Side)",
                "sport_type": SportType.FOOTBALL,
                "court_size": "5-a-side (30m × 20m)",
                "surface_type": "50mm Synthetic Turf with Rebound Nets",
                "base_price": Decimal("1200.00"),
                "night_price": Decimal("1400.00"),
            },
            {
                "name": "The Smash Court (Badminton)",
                "sport_type": SportType.BADMINTON,
                "court_size": "Standard Doubles (13.4m × 6.1m)",
                "surface_type": "BWF Approved Synthetic Rubber Mat",
                "base_price": Decimal("700.00"),
                "night_price": Decimal("900.00"),
            },
        ]

        for c_data in ctg_courts_data:
            court = session.exec(
                select(Court).where(Court.venue_id == venue_ctg.id, Court.name == c_data["name"])
            ).first()
            if not court:
                court = Court(
                    venue_id=venue_ctg.id,
                    name=c_data["name"],
                    sport_type=c_data["sport_type"],
                    court_size=c_data["court_size"],
                    surface_type=c_data["surface_type"],
                    base_price_per_hour=c_data["base_price"],
                    status=FacilityStatus.ACTIVE,
                    is_active=True,
                )
                session.add(court)
                session.commit()
                session.refresh(court)
                print(f"  Created Court: {court.name}")
            else:
                court.court_size = c_data["court_size"]
                court.surface_type = c_data["surface_type"]
                court.base_price_per_hour = c_data["base_price"]
                court.is_active = True
                court.status = FacilityStatus.ACTIVE
                session.add(court)
                session.commit()
                session.refresh(court)
                print(f"  Updated Court: {court.name}")

            # Pricing rules
            for r in session.exec(select(PricingRule).where(PricingRule.court_id == court.id)).all():
                session.delete(r)
            session.commit()

            day_r = PricingRule(
                court_id=court.id,
                name="Day Standard Rate",
                start_time=time(7, 0),
                end_time=time(17, 0),
                price_per_hour=c_data["base_price"],
                is_active=True,
            )
            night_r = PricingRule(
                court_id=court.id,
                name="Night Floodlights Rate",
                start_time=time(17, 0),
                end_time=time(1, 0),
                price_per_hour=c_data["night_price"],
                is_active=True,
            )
            session.add(day_r)
            session.add(night_r)
            session.commit()

        print("\nMulti-venue and pitch seeding completed successfully!")


if __name__ == "__main__":
    seed_venues_and_courts()
