from typing import Annotated, Optional
import uuid
from fastapi import APIRouter, Depends, HTTPException, Query, status
from app.api.deps import CurrentUserDep, SessionDep, get_current_superuser, require_roles
from app.core.security import get_password_hash
from app.crud import user as user_crud
from app.models.user import User, UserRole
from app.schemas.user import (
    AdminCreate,
    StaffCreate,
    UserRegister,
    UserResponse,
    UserRoleUpdate,
    UserUpdateMe,
)

router = APIRouter(prefix="/users", tags=["users"])


@router.get(
    "/me",
    response_model=UserResponse,
    summary="Get current user profile",
)
def get_current_user_profile(current_user: CurrentUserDep) -> UserResponse:
    """Return the profile information of the currently authenticated user."""
    return UserResponse.model_validate(current_user)


@router.patch(
    "/me",
    response_model=UserResponse,
    summary="Update current user profile",
)
def update_current_user_profile(
    user_update: UserUpdateMe,
    current_user: CurrentUserDep,
    session: SessionDep,
) -> UserResponse:
    """Update personal profile details. Safe schema prevents tampering with user role or permissions."""
    hashed_password = None
    if user_update.password:
        hashed_password = get_password_hash(user_update.password)

    # Check email conflict if updating email
    if user_update.email and user_update.email != current_user.email:
        existing = user_crud.get_user_by_email(session, user_update.email)
        if existing and existing.id != current_user.id:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="A user with this email address already exists.",
            )

    updated_user = user_crud.update_user(
        session=session,
        db_user=current_user,
        user_in=user_update,
        hashed_password=hashed_password,
    )
    return UserResponse.model_validate(updated_user)


@router.post(
    "/admin",
    response_model=UserResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Register a new business admin (Superuser only)",
)
def create_admin_user(
    admin_in: AdminCreate,
    current_superuser: Annotated[User, Depends(get_current_superuser)],
    session: SessionDep,
) -> UserResponse:
    """Create a new business admin account with ADMIN role. Allowed only for platform Superusers."""
    existing_phone = user_crud.get_user_by_phone(session, admin_in.phone_number)
    if existing_phone:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="A user with this phone number already exists.",
        )

    if admin_in.email:
        existing_email = user_crud.get_user_by_email(session, admin_in.email)
        if existing_email:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="A user with this email address already exists.",
            )

    hashed_password = get_password_hash(admin_in.password)
    user_reg = UserRegister(
        phone_number=admin_in.phone_number,
        full_name=admin_in.full_name,
        email=admin_in.email,
        password=admin_in.password,
        avatar_url=admin_in.avatar_url,
    )
    admin_user = user_crud.create_user(
        session=session,
        user_in=user_reg,
        hashed_password=hashed_password,
        role=UserRole.ADMIN,
    )
    return UserResponse.model_validate(admin_user)


@router.post(
    "/staff",
    response_model=UserResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Register a new staff member (Admin only)",
)
def create_staff_user(
    staff_in: StaffCreate,
    current_admin: Annotated[User, Depends(require_roles([UserRole.ADMIN]))],
    session: SessionDep,
) -> UserResponse:
    """Create a new staff account with STAFF role. Allowed only for turf Admins."""
    existing_phone = user_crud.get_user_by_phone(session, staff_in.phone_number)
    if existing_phone:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="A user with this phone number already exists.",
        )

    if staff_in.email:
        existing_email = user_crud.get_user_by_email(session, staff_in.email)
        if existing_email:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="A user with this email address already exists.",
            )

    hashed_password = get_password_hash(staff_in.password)
    user_reg = UserRegister(
        phone_number=staff_in.phone_number,
        full_name=staff_in.full_name,
        email=staff_in.email,
        password=staff_in.password,
        avatar_url=staff_in.avatar_url,
    )
    staff_user = user_crud.create_user(
        session=session,
        user_in=user_reg,
        hashed_password=hashed_password,
        role=UserRole.STAFF,
    )
    return UserResponse.model_validate(staff_user)


@router.patch(
    "/{user_id}/role",
    response_model=UserResponse,
    summary="Update a user's role (Admin only)",
)
def update_user_role(
    user_id: uuid.UUID,
    role_update: UserRoleUpdate,
    current_admin: Annotated[User, Depends(require_roles([UserRole.ADMIN]))],
    session: SessionDep,
) -> UserResponse:
    """Promote or demote a user's role (Admin only)."""
    target_user = user_crud.get_user_by_id(session, user_id)
    if not target_user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found.",
        )

    # Protect self-demotion from locking out the system
    if target_user.id == current_admin.id and role_update.role != UserRole.ADMIN and not current_admin.is_superuser:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="You cannot remove your own admin privileges.",
        )

    updated_user = user_crud.update_user_role(
        session=session,
        db_user=target_user,
        new_role=role_update.role,
    )
    return UserResponse.model_validate(updated_user)


@router.get(
    "",
    response_model=list[UserResponse],
    summary="List all users (Admin or Staff only)",
)
def list_users(
    session: SessionDep,
    current_staff: Annotated[User, Depends(require_roles([UserRole.ADMIN, UserRole.STAFF]))],
    role: Optional[UserRole] = Query(default=None, description="Filter by role"),
    is_active: Optional[bool] = Query(default=None, description="Filter by active status"),
    skip: int = Query(default=0, ge=0),
    limit: int = Query(default=50, ge=1, le=100),
) -> list[UserResponse]:
    """List registered users with optional role and status filtering."""
    users = user_crud.list_users(
        session=session,
        role=role,
        is_active=is_active,
        skip=skip,
        limit=limit,
    )
    return [UserResponse.model_validate(u) for u in users]


@router.get(
    "/{user_id}",
    response_model=UserResponse,
    summary="Get user by ID",
)
def get_user_by_id(
    user_id: uuid.UUID,
    current_user: CurrentUserDep,
    session: SessionDep,
) -> UserResponse:
    """Retrieve user details by UUID (accessible by Admins, Staff, or the user themselves)."""
    is_staff_or_admin = current_user.is_superuser or current_user.role in [UserRole.ADMIN, UserRole.STAFF]
    if not is_staff_or_admin and current_user.id != user_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to access this user profile.",
        )

    user = user_crud.get_user_by_id(session, user_id)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found.",
        )
    return UserResponse.model_validate(user)
