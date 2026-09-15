from typing import Annotated, Optional
import uuid
from fastapi import APIRouter, Depends, Query, status
from app.api.deps import CurrentUserDep, SessionDep, require_roles
from app.models.user import User, UserRole
from app.schemas.venue import VenueCreate, VenueResponse, VenueUpdate
from app.services import venue_service

router = APIRouter(prefix="/venues", tags=["venues"])


@router.post(
    "",
    response_model=VenueResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create a new venue (Admin only)",
)
def create_venue(
    venue_in: VenueCreate,
    current_admin: Annotated[User, Depends(require_roles([UserRole.ADMIN]))],
    session: SessionDep,
) -> VenueResponse:
    """Create a new sports facility/branch for this turf."""
    venue = venue_service.create_venue(
        session=session,
        actor=current_admin,
        venue_in=venue_in,
    )
    return VenueResponse.model_validate(venue)


@router.get(
    "",
    response_model=list[VenueResponse],
    summary="List all active venues",
)
def list_venues(
    session: SessionDep,
    district: Optional[str] = Query(default=None, description="Filter by district (e.g. Chattogram, Dhaka)"),
    area: Optional[str] = Query(default=None, description="Filter by area/thana (e.g. Agrabad, Dhanmondi)"),
    search: Optional[str] = Query(default=None, description="Search in name, address, area, or district"),
    skip: int = Query(default=0, ge=0),
    limit: int = Query(default=50, ge=1, le=100),
) -> list[VenueResponse]:
    """Public endpoint to list active sports venues with optional filtering."""
    venues = venue_service.list_venues(
        session=session,
        district=district,
        area=area,
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
    summary="Update venue details (Admin or Staff)",
)
def update_venue(
    venue_id: uuid.UUID,
    venue_in: VenueUpdate,
    current_user: Annotated[User, Depends(require_roles([UserRole.ADMIN, UserRole.STAFF]))],
    session: SessionDep,
) -> VenueResponse:
    """Update venue profile. Allowed for turf Admin, Staff or platform superusers."""
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
    summary="Deactivate or delete venue (Admin only)",
)
def delete_venue(
    venue_id: uuid.UUID,
    current_admin: Annotated[User, Depends(require_roles([UserRole.ADMIN]))],
    session: SessionDep,
    soft: bool = Query(default=True, description="Perform soft deactivation if true"),
) -> VenueResponse:
    """Deactivate or remove a venue. Allowed only for turf Admin or platform superusers."""
    venue = venue_service.delete_venue(
        session=session,
        venue_id=venue_id,
        actor=current_admin,
        soft=soft,
    )
    return VenueResponse.model_validate(venue)
