from typing import Optional
import uuid
from fastapi import APIRouter, Query, status
from app.api.deps import CurrentUserDep, SessionDep
from app.schemas.venue import VenueResponse, VenueUpdate
from app.services import venue_service

router = APIRouter(prefix="/venues", tags=["venues"])


@router.get(
    "",
    response_model=list[VenueResponse],
    summary="List all active venues",
)
def list_venues(
    session: SessionDep,
    business_id: Optional[uuid.UUID] = Query(default=None, description="Filter by business ID"),
    city: Optional[str] = Query(default=None, description="Filter by city name"),
    search: Optional[str] = Query(default=None, description="Search in name, address, or city"),
    skip: int = Query(default=0, ge=0),
    limit: int = Query(default=50, ge=1, le=100),
) -> list[VenueResponse]:
    """Public endpoint to list active sports venues with optional filtering."""
    venues = venue_service.list_venues(
        session=session,
        business_id=business_id,
        city=city,
        search=search,
        skip=skip,
        limit=limit,
    )
    return [VenueResponse.model_validate(v) for v in venues]


@router.get(
    "/{venue_id}",
    response_model=VenueResponse,
    summary="Get venue details",
)
def get_venue(
    venue_id: uuid.UUID,
    session: SessionDep,
) -> VenueResponse:
    """Public endpoint to retrieve details of a specific venue by its ID."""
    venue = venue_service.get_venue_by_id(session, venue_id)
    return VenueResponse.model_validate(venue)


@router.patch(
    "/{venue_id}",
    response_model=VenueResponse,
    summary="Update venue details (Owner or Manager)",
)
def update_venue(
    venue_id: uuid.UUID,
    venue_in: VenueUpdate,
    current_user: CurrentUserDep,
    session: SessionDep,
) -> VenueResponse:
    """Update venue profile. Allowed for business OWNER, MANAGER or platform superusers."""
    venue = venue_service.update_venue(
        session=session,
        venue_id=venue_id,
        actor=current_user,
        venue_in=venue_in,
    )
    return VenueResponse.model_validate(venue)


@router.delete(
    "/{venue_id}",
    response_model=VenueResponse,
    summary="Deactivate or delete venue (Owner only)",
)
def delete_venue(
    venue_id: uuid.UUID,
    current_user: CurrentUserDep,
    session: SessionDep,
    soft: bool = Query(default=True, description="Perform soft deactivation if true"),
) -> VenueResponse:
    """Deactivate or remove a venue. Allowed only for business OWNER or platform superusers."""
    venue = venue_service.delete_venue(
        session=session,
        venue_id=venue_id,
        actor=current_user,
        soft=soft,
    )
    return VenueResponse.model_validate(venue)
