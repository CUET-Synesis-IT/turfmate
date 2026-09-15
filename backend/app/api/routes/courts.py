from typing import Annotated, Optional
import uuid
from fastapi import APIRouter, Depends, Query, status
from app.api.deps import CurrentUserDep, SessionDep, require_roles
from app.models.court import SportType
from app.models.user import User, UserRole
from app.schemas.court import CourtResponse, CourtUpdate
from app.services import court_service

router = APIRouter(prefix="/courts", tags=["courts"])


@router.get(
    "",
    response_model=list[CourtResponse],
    summary="List all active courts",
)
def list_courts(
    session: SessionDep,
    venue_id: Optional[uuid.UUID] = Query(default=None, description="Filter by venue ID"),
    sport_type: Optional[SportType] = Query(default=None, description="Filter by sport type"),
    skip: int = Query(default=0, ge=0),
    limit: int = Query(default=50, ge=1, le=100),
) -> list[CourtResponse]:
    """Public endpoint to list active courts/fields with optional filters."""
    courts = court_service.list_courts(
        session=session,
        venue_id=venue_id,
        sport_type=sport_type,
        skip=skip,
        limit=limit,
    )
    return [CourtResponse.model_validate(c) for c in courts]


@router.get(
    "/{court_id}",
    response_model=CourtResponse,
    summary="Get court details",
)
def get_court(
    court_id: uuid.UUID,
    session: SessionDep,
) -> CourtResponse:
    """Public endpoint to retrieve details of a specific court by its ID."""
    court = court_service.get_court_by_id(session, court_id)
    return CourtResponse.model_validate(court)


@router.patch(
    "/{court_id}",
    response_model=CourtResponse,
    summary="Update court details (Admin or Staff)",
)
def update_court(
    court_id: uuid.UUID,
    court_in: CourtUpdate,
    current_user: Annotated[User, Depends(require_roles([UserRole.ADMIN, UserRole.STAFF]))],
    session: SessionDep,
) -> CourtResponse:
    """Update court attributes, surface details, or base price. Allowed for turf Admin or Staff."""
    court = court_service.update_court(
        session=session,
        court_id=court_id,
        actor=current_user,
        court_in=court_in,
    )
    return CourtResponse.model_validate(court)


@router.delete(
    "/{court_id}",
    response_model=CourtResponse,
    summary="Deactivate or delete court (Admin only)",
)
def delete_court(
    court_id: uuid.UUID,
    current_admin: Annotated[User, Depends(require_roles([UserRole.ADMIN]))],
    session: SessionDep,
    soft: bool = Query(default=True, description="Perform soft deactivation if true"),
) -> CourtResponse:
    """Deactivate or remove a court. Allowed only for turf Admin."""
    court = court_service.delete_court(
        session=session,
        court_id=court_id,
        actor=current_admin,
        soft=soft,
    )
    return CourtResponse.model_validate(court)
