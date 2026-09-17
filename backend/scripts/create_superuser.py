#!/usr/bin/env python3
"""
CLI script to create or promote a superuser (System Admin) in TurfMate.
Usage:
    python scripts/create_superuser.py [--phone PHONE] [--name NAME] [--password PASSWORD] [--email EMAIL]
"""

import argparse
import getpass
import os
import sys

# Ensure backend root is on PYTHONPATH
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from sqlmodel import Session, select
from app.db.session import engine
from app.models.user import User, UserRole
from app.core.security import get_password_hash


def create_or_promote_superuser(phone: str, full_name: str, password: str, email: str | None = None) -> User:
    phone = phone.strip()
    email = email.strip().lower() if email else None

    with Session(engine) as session:
        # Check if phone number already exists
        statement = select(User).where(User.phone_number == phone)
        existing_user = session.exec(statement).first()

        if existing_user:
            print(f"User with phone '{phone}' already exists: {existing_user.full_name}")
            existing_user.is_superuser = True
            existing_user.role = UserRole.ADMIN
            existing_user.is_active = True
            if password:
                existing_user.hashed_password = get_password_hash(password)
            if email:
                existing_user.email = email
            if full_name:
                existing_user.full_name = full_name

            session.add(existing_user)
            session.commit()
            session.refresh(existing_user)
            print(f"Successfully promoted user '{existing_user.phone_number}' ({existing_user.full_name}) to SUPERUSER & ADMIN.")
            return existing_user
        else:
            hashed_pwd = get_password_hash(password)
            new_user = User(
                phone_number=phone,
                full_name=full_name,
                email=email,
                hashed_password=hashed_pwd,
                role=UserRole.ADMIN,
                is_active=True,
                is_superuser=True,
            )
            session.add(new_user)
            session.commit()
            session.refresh(new_user)
            print(f"Successfully created new SUPERUSER '{new_user.phone_number}' ({new_user.full_name}).")
            return new_user


def main():
    parser = argparse.ArgumentParser(description="Create or promote a TurfMate superuser.")
    parser.add_argument("--phone", "-p", help="Phone number (e.g. 01700000001)")
    parser.add_argument("--name", "-n", help="Full name of superuser")
    parser.add_argument("--password", "-pwd", help="Plain text password")
    parser.add_argument("--email", "-e", help="Optional email address")

    args = parser.parse_args()

    phone = args.phone
    if not phone:
        phone = input("Enter Superuser phone number (e.g. 01700000001): ").strip()
        if not phone:
            print("Error: Phone number is required.")
            sys.exit(1)

    name = args.name
    if not name:
        name = input("Enter Full Name: ").strip()
        if not name:
            name = "System Superuser"

    password = args.password
    if not password:
        password = getpass.getpass("Enter Password (min 6 characters): ")
        if len(password) < 6:
            print("Error: Password must be at least 6 characters.")
            sys.exit(1)

    email = args.email

    create_or_promote_superuser(phone=phone, full_name=name, password=password, email=email)


if __name__ == "__main__":
    main()
