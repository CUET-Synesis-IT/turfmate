from datetime import datetime
from decimal import Decimal
from typing import Annotated, Optional
import uuid
from fastapi import APIRouter, Depends, Query, status
from app.api.deps import CurrentUserDep, SessionDep, require_roles
from app.models.user import User, UserRole
from app.schemas.pricing import PricingRuleCreate, PricingRuleResponse, PricingRuleUpdate
from app.services import pricing_service

router = APIRouter(tags=["pricing-rules"])


@router.post(
    "/courts/{court_id}/pricing-rules",
    response_model=PricingRuleResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create pricing rule for a court (Admin or Staff)",
)
def create_court_pricing_rule(
    court_id: uuid.UUID,
    rule_in: PricingRuleCreate,
    current_user: Annotated[User, Depends(require_roles([UserRole.ADMIN, UserRole.STAFF]))],
    session: SessionDep,
) -> PricingRuleResponse:
    """Create a new dynamic pricing override rule for a court."""
    rule = pricing_service.create_pricing_rule(
        session=session,
        actor=current_user,
        court_id=court_id,
        rule_in=rule_in,
    )
    return PricingRuleResponse.model_validate(rule)


@router.get(
    "/courts/{court_id}/pricing-rules",
    response_model=list[PricingRuleResponse],
    summary="List pricing rules for a court",
)
def list_court_pricing_rules(
    court_id: uuid.UUID,
    session: SessionDep,
) -> list[PricingRuleResponse]:
    """Retrieve all active pricing rules configured for a court."""
    rules = pricing_service.list_court_pricing_rules(session, court_id)
    return [PricingRuleResponse.model_validate(r) for r in rules]


@router.get(
    "/courts/{court_id}/calculate-price",
    response_model=dict[str, Decimal],
    summary="Calculate price for a slot",
)
def calculate_slot_price(
    court_id: uuid.UUID,
    session: SessionDep,
    slot_time: datetime = Query(description="Slot start datetime in ISO format"),
) -> dict[str, Decimal]:
    """Calculate the exact price per hour for a court at a given slot datetime."""
    price = pricing_service.calculate_slot_price(
        session=session,
        court_id=court_id,
        slot_time=slot_time,
    )
    return {"price_per_hour": price}


@router.patch(
    "/pricing-rules/{rule_id}",
    response_model=PricingRuleResponse,
    summary="Update pricing rule (Admin or Staff)",
)
def update_pricing_rule(
    rule_id: uuid.UUID,
    rule_in: PricingRuleUpdate,
    current_user: Annotated[User, Depends(require_roles([UserRole.ADMIN, UserRole.STAFF]))],
    session: SessionDep,
) -> PricingRuleResponse:
    """Update dynamic pricing rule attributes."""
    rule = pricing_service.update_pricing_rule(
        session=session,
        actor=current_user,
        rule_id=rule_id,
        rule_in=rule_in,
    )
    return PricingRuleResponse.model_validate(rule)


@router.delete(
    "/pricing-rules/{rule_id}",
    status_code=status.HTTP_200_OK,
    summary="Delete pricing rule (Admin or Staff)",
)
def delete_pricing_rule(
    rule_id: uuid.UUID,
    current_user: Annotated[User, Depends(require_roles([UserRole.ADMIN, UserRole.STAFF]))],
    session: SessionDep,
) -> dict[str, str]:
    """Delete a dynamic pricing rule."""
    pricing_service.delete_pricing_rule(
        session=session,
        actor=current_user,
        rule_id=rule_id,
    )
    return {"message": "Pricing rule deleted successfully."}
