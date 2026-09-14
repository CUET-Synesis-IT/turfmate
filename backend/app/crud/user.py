from typing import Optional
import uuid
from sqlmodel import Session, or_, select
from app.models.user import User
from app.schemas.user import UserCreate, UserUpdate


def get_user_by_id(session: Session, user_id: uuid.UUID) -> Optional[User]:
    """Retrieve a user by their UUID."""
    return session.get(User, user_id)


def get_user_by_phone(session: Session, phone_number: str) -> Optional[User]:
    """Retrieve a user by clean phone number."""
    statement = select(User).where(User.phone_number == phone_number.strip())
    return session.exec(statement).first()


def get_user_by_email(session: Session, email: str) -> Optional[User]:
    """Retrieve a user by lowercase email."""
    statement = select(User).where(User.email == email.strip().lower())
    return session.exec(statement).first()


def get_user_by_identifier(session: Session, identifier: str) -> Optional[User]:
    """Retrieve user by phone number or email."""
    clean_id = identifier.strip()
    statement = select(User).where(
        or_(
            User.phone_number == clean_id,
            User.email == clean_id.lower(),
        )
    )
    return session.exec(statement).first()


def create_user(
    session: Session,
    user_in: UserCreate,
    hashed_password: str,
) -> User:
    """Create and persist a new user."""
    db_user = User(
        phone_number=user_in.phone_number.strip(),
        email=user_in.email.strip().lower() if user_in.email else None,
        full_name=user_in.full_name,
        hashed_password=hashed_password,
        avatar_url=user_in.avatar_url,
    )
    session.add(db_user)
    session.commit()
    session.refresh(db_user)
    return db_user


def update_user(
    session: Session,
    db_user: User,
    user_in: UserUpdate,
    hashed_password: Optional[str] = None,
) -> User:
    """Update user fields."""
    update_data = user_in.model_dump(exclude_unset=True, exclude={"password"})
    for key, value in update_data.items():
        if key == "email" and value is not None:
            value = str(value).strip().lower()
        elif key == "phone_number" and value is not None:
            value = str(value).strip()
        setattr(db_user, key, value)

    if hashed_password is not None:
        db_user.hashed_password = hashed_password

    session.add(db_user)
    session.commit()
    session.refresh(db_user)
    return db_user
