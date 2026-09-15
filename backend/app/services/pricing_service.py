from datetime import datetime, time
from decimal import Decimal
from typing import Optional
import uuid
from fastapi import HTTPException, status
from sqlmodel import Session
from app.crud import court as court_crud
from app.crud import pricing_rule as pricing_crud
from app.models.schedule import PricingRule
from app.models.user import User, UserRole
from app.schemas.pricing import PricingRuleCreate, PricingRuleUpdate


def _ensure_role(actor: User, allowed_roles: list[UserRole]) -> None:
    """Verify that actor has an authorized role or is superuser."""
    if actor.is_superuser or actor.role == UserRole.ADMIN:
        return
    if actor.role not in allowed_roles:
        roles_str = [r.value for r in allowed_roles]
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=f"Operation requires one of the following roles: {roles_str}.",
        )


def create_pricing_rule(
    session: Session,
    actor: User,
    court_id: uuid.UUID,
    rule_in: PricingRuleCreate,
) -> PricingRule:
    """Create a new dynamic pricing rule for a court. Requires ADMIN or STAFF."""
    _ensure_role(actor, [UserRole.ADMIN, UserRole.STAFF])

    court = court_crud.get_court_by_id(session, court_id)
    if not court:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Court not found.",
        )

    if rule_in.start_time >= rule_in.end_time:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Rule start_time must be earlier than end_time.",
        )

    return pricing_crud.create_pricing_rule(session, court_id, rule_in)


def get_pricing_rule_by_id(session: Session, rule_id: uuid.UUID) -> PricingRule:
    """Retrieve pricing rule or raise 404."""
    rule = pricing_crud.get_pricing_rule_by_id(session, rule_id)
    if not rule:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Pricing rule not found.",
        )
    return rule


def list_court_pricing_rules(
    session: Session,
    court_id: uuid.UUID,
    actor: Optional[User] = None,
) -> list[PricingRule]:
    """List pricing rules for a court. Shows inactive rules if caller is Admin/Staff."""
    court = court_crud.get_court_by_id(session, court_id)
    if not court:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Court not found.",
        )

    is_active: Optional[bool] = True
    if actor and (actor.is_superuser or actor.role in [UserRole.ADMIN, UserRole.STAFF]):
        is_active = None

    return pricing_crud.list_court_pricing_rules(session, court_id, is_active=is_active)


def update_pricing_rule(
    session: Session,
    actor: User,
    rule_id: uuid.UUID,
    rule_in: PricingRuleUpdate,
) -> PricingRule:
    """Update an existing pricing rule. Requires ADMIN or STAFF."""
    rule = get_pricing_rule_by_id(session, rule_id)
    _ensure_role(actor, [UserRole.ADMIN, UserRole.STAFF])

    # Validate times if updated
    start = rule_in.start_time or rule.start_time
    end = rule_in.end_time or rule.end_time
    if start >= end:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Rule start_time must be earlier than end_time.",
        )

    return pricing_crud.update_pricing_rule(session, rule, rule_in)


def delete_pricing_rule(
    session: Session,
    actor: User,
    rule_id: uuid.UUID,
) -> None:
    """Delete a pricing rule. Requires ADMIN or STAFF."""
    rule = get_pricing_rule_by_id(session, rule_id)
    _ensure_role(actor, [UserRole.ADMIN, UserRole.STAFF])
    pricing_crud.delete_pricing_rule(session, rule)


def calculate_slot_price(
    session: Session,
    court_id: uuid.UUID,
    slot_time: datetime,
) -> Decimal:
    """
    Calculate dynamic hourly rate for a court at a given slot datetime.
    Priority:
    1. Day-specific pricing rule matching slot time (e.g. Friday peak)
    2. General all-day pricing rule matching slot time (e.g. Night lights)
    3. Court's default base_price_per_hour
    """
    court = court_crud.get_court_by_id(session, court_id)
    if not court:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Court not found.",
        )

    rules = pricing_crud.list_court_pricing_rules(session, court_id, is_active=True)
    day_of_week = slot_time.weekday()  # 0=Monday, 4=Friday, 6=Sunday
    t = slot_time.time()

    # 1. Day-specific rule match
    for rule in rules:
        if rule.day_of_week == day_of_week and rule.start_time <= t < rule.end_time:
            return rule.price_per_hour

    # 2. General all-days rule match
    for rule in rules:
        if rule.day_of_week is None and rule.start_time <= t < rule.end_time:
            return rule.price_per_hour

    # 3. Fallback to court default
    return court.base_price_per_hour
