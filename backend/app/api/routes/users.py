import uuid
from fastapi import APIRouter, HTTPException, status
from app.api.deps import CurrentUserDep, SessionDep
from app.crud import user as user_crud
from app.schemas.user import UserResponse, UserUpdate

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
    user_update: UserUpdate,
    current_user: CurrentUserDep,
    session: SessionDep,
) -> UserResponse:
    """Update profile details for the currently authenticated user."""
    updated_user = user_crud.update_user(
        session=session,
        db_user=current_user,
        user_in=user_update,
    )
    return UserResponse.model_validate(updated_user)


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
    """Retrieve user details by UUID (accessible by superusers or the user themselves)."""
    if not current_user.is_superuser and current_user.id != user_id:
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
