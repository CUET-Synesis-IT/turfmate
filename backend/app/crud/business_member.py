from typing import Optional
import uuid
from sqlmodel import Session, func, select
from app.models.business import BusinessMember, BusinessRole
from app.models.user import User
from app.schemas.business import BusinessMemberUpdate


def get_member(
    session: Session,
    business_id: uuid.UUID,
    user_id: uuid.UUID,
) -> Optional[BusinessMember]:
    """Retrieve membership record for a specific user and business."""
    statement = select(BusinessMember).where(
        BusinessMember.business_id == business_id,
        BusinessMember.user_id == user_id,
    )
    return session.exec(statement).first()


def get_member_by_id(
    session: Session,
    member_id: uuid.UUID,
) -> Optional[BusinessMember]:
    """Retrieve a membership record by its ID."""
    return session.get(BusinessMember, member_id)


def list_business_members(
    session: Session,
    business_id: uuid.UUID,
) -> list[tuple[BusinessMember, User]]:
    """List all members of a business paired with their User profile."""
    statement = (
        select(BusinessMember, User)
        .join(User, BusinessMember.user_id == User.id)
        .where(BusinessMember.business_id == business_id)
        .order_by(BusinessMember.created_at.asc())
    )
    return session.exec(statement).all()


def add_member(
    session: Session,
    business_id: uuid.UUID,
    user_id: uuid.UUID,
    role: BusinessRole = BusinessRole.STAFF,
) -> BusinessMember:
    """Add a user to a business with specified role."""
    member = BusinessMember(
        business_id=business_id,
        user_id=user_id,
        role=role,
        is_active=True,
    )
    session.add(member)
    session.commit()
    session.refresh(member)
    return member


def update_member(
    session: Session,
    db_member: BusinessMember,
    member_in: BusinessMemberUpdate,
) -> BusinessMember:
    """Update member role or active status."""
    update_data = member_in.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(db_member, key, value)

    session.add(db_member)
    session.commit()
    session.refresh(db_member)
    return db_member


def remove_member(session: Session, db_member: BusinessMember) -> None:
    """Delete a membership record."""
    session.delete(db_member)
    session.commit()


def count_business_owners(session: Session, business_id: uuid.UUID) -> int:
    """Count number of active owners in a business."""
    statement = (
        select(func.count(BusinessMember.id))
        .where(
            BusinessMember.business_id == business_id,
            BusinessMember.role == BusinessRole.OWNER,
            BusinessMember.is_active.is_(True),
        )
    )
    return session.exec(statement).one()
