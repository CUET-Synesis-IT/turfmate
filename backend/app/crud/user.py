from typing import Optional, Union
import uuid
from sqlmodel import Session, or_, select
from app.models.user import User, UserRole
from app.schemas.user import UserAdminUpdate, UserCreate, UserRegister, UserUpdateMe


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


def list_users(
    session: Session,
    role: Optional[UserRole] = None,
    is_active: Optional[bool] = None,
    skip: int = 0,
    limit: int = 50,
) -> list[User]:
    """List users with optional role and status filters (Admin operation)."""
    statement = select(User)
    if role is not None:
        statement = statement.where(User.role == role)
    if is_active is not None:
        statement = statement.where(User.is_active == is_active)
    statement = statement.order_by(User.created_at.desc()).offset(skip).limit(limit)
    return list(session.exec(statement).all())


def create_user(
    session: Session,
    user_in: Union[UserRegister, UserCreate],
    hashed_password: str,
    role: UserRole = UserRole.CUSTOMER,
) -> User:
    """Create and persist a new user with enforced role."""
    resolved_role = getattr(user_in, "role", None) or role
    db_user = User(
        phone_number=user_in.phone_number.strip(),
        email=user_in.email.strip().lower() if user_in.email else None,
        full_name=user_in.full_name,
        hashed_password=hashed_password,
        role=resolved_role,
        avatar_url=user_in.avatar_url,
    )
    session.add(db_user)
    session.commit()
    session.refresh(db_user)
    return db_user


def update_user(
    session: Session,
    db_user: User,
    user_in: Union[UserUpdateMe, UserAdminUpdate],
    hashed_password: Optional[str] = None,
) -> User:
    """Update allowed user fields without permitting privilege escalation."""
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


def update_user_role(
    session: Session,
    db_user: User,
    new_role: UserRole,
) -> User:
    """Update user role (Admin operation)."""
    db_user.role = new_role
    session.add(db_user)
    session.commit()
    session.refresh(db_user)
    return db_user
