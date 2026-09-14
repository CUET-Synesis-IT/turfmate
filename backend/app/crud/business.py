from typing import Optional
import uuid
from sqlmodel import Session, select
from app.models.business import Business, BusinessMember, BusinessRole
from app.schemas.business import BusinessCreate, BusinessUpdate


def get_business_by_id(session: Session, business_id: uuid.UUID) -> Optional[Business]:
    """Retrieve a business by UUID."""
    return session.get(Business, business_id)


def get_business_by_slug(session: Session, slug: str) -> Optional[Business]:
    """Retrieve a business by unique slug."""
    statement = select(Business).where(Business.slug == slug.lower())
    return session.exec(statement).first()


def list_active_businesses(session: Session) -> list[Business]:
    """List all active businesses."""
    statement = (
        select(Business)
        .where(Business.is_active.is_(True))
        .order_by(Business.name.asc())
    )
    return session.exec(statement).all()


def create_business(
    session: Session,
    business_in: BusinessCreate,
    slug: str,
) -> Business:
    """Create and persist a new business entity."""
    db_business = Business(
        name=business_in.name.strip(),
        slug=slug.lower(),
        email=str(business_in.email).strip().lower() if business_in.email else None,
        phone_number=business_in.phone_number.strip() if business_in.phone_number else None,
        description=business_in.description,
        logo_url=business_in.logo_url,
        is_active=True,
    )
    session.add(db_business)
    session.commit()
    session.refresh(db_business)
    return db_business


def update_business(
    session: Session,
    db_business: Business,
    business_in: BusinessUpdate,
    slug: Optional[str] = None,
) -> Business:
    """Update business details."""
    update_data = business_in.model_dump(exclude_unset=True, exclude={"slug"})
    for key, value in update_data.items():
        if key == "email" and value is not None:
            value = str(value).strip().lower()
        elif key == "name" and value is not None:
            value = str(value).strip()
        setattr(db_business, key, value)

    if slug is not None:
        db_business.slug = slug.lower()

    session.add(db_business)
    session.commit()
    session.refresh(db_business)
    return db_business


def list_user_businesses(
    session: Session,
    user_id: uuid.UUID,
) -> list[tuple[Business, BusinessRole]]:
    """List all active businesses that a user is a member of, along with their role."""
    statement = (
        select(Business, BusinessMember.role)
        .join(BusinessMember, Business.id == BusinessMember.business_id)
        .where(
            BusinessMember.user_id == user_id,
            BusinessMember.is_active.is_(True),
            Business.is_active.is_(True),
        )
        .order_by(Business.created_at.desc())
    )
    return session.exec(statement).all()
