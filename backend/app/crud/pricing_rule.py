from typing import Optional
import uuid
from sqlmodel import Session, select
from app.models.schedule import PricingRule
from app.schemas.pricing import PricingRuleCreate, PricingRuleUpdate


def get_pricing_rule_by_id(session: Session, rule_id: uuid.UUID) -> Optional[PricingRule]:
    """Retrieve pricing rule by its UUID."""
    return session.get(PricingRule, rule_id)


def list_court_pricing_rules(
    session: Session,
    court_id: uuid.UUID,
    is_active: Optional[bool] = True,
) -> list[PricingRule]:
    """List pricing rules for a specific court."""
    statement = select(PricingRule).where(PricingRule.court_id == court_id)
    if is_active is not None:
        statement = statement.where(PricingRule.is_active == is_active)
    statement = statement.order_by(PricingRule.day_of_week.asc().nulls_last(), PricingRule.start_time.asc())
    return list(session.exec(statement).all())


def create_pricing_rule(
    session: Session,
    court_id: uuid.UUID,
    rule_in: PricingRuleCreate,
) -> PricingRule:
    """Create and persist a new pricing rule for a court."""
    db_rule = PricingRule(
        court_id=court_id,
        **rule_in.model_dump(),
    )
    session.add(db_rule)
    session.commit()
    session.refresh(db_rule)
    return db_rule


def update_pricing_rule(
    session: Session,
    db_rule: PricingRule,
    rule_in: PricingRuleUpdate,
) -> PricingRule:
    """Update pricing rule fields."""
    update_data = rule_in.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(db_rule, field, value)

    session.add(db_rule)
    session.commit()
    session.refresh(db_rule)
    return db_rule


def delete_pricing_rule(
    session: Session,
    db_rule: PricingRule,
) -> None:
    """Permanently delete a pricing rule."""
    session.delete(db_rule)
    session.commit()
