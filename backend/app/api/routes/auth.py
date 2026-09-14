from fastapi import APIRouter, Request, status
from app.api.deps import CurrentUserDep, SessionDep
from app.schemas.auth import (
    ChangePasswordRequest,
    LoginRequest,
    LogoutRequest,
    RefreshTokenRequest,
    TokenResponse,
)
from app.schemas.user import UserCreate, UserResponse
from app.services import auth_service

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post(
    "/register",
    status_code=status.HTTP_201_CREATED,
    summary="Register a new user",
)
def register(
    user_in: UserCreate,
    session: SessionDep,
    request: Request,
) -> dict:
    """Register a new user with email, password, and profile information."""
    ip_address = request.client.host if request.client else None
    user_agent = request.headers.get("user-agent")
    user, tokens = auth_service.register_user(
        session=session,
        user_in=user_in,
        device_info=user_agent,
        ip_address=ip_address,
    )
    return {
        "user": UserResponse.model_validate(user),
        "tokens": tokens,
    }


@router.post(
    "/login",
    response_model=TokenResponse,
    summary="User login with JSON credentials",
)
def login(
    login_data: LoginRequest,
    session: SessionDep,
    request: Request,
) -> TokenResponse:
    """Authenticate with email and password to receive access and refresh tokens."""
    ip_address = request.client.host if request.client else None
    return auth_service.authenticate_user(
        session=session,
        login_data=login_data,
        ip_address=ip_address,
    )


@router.post(
    "/refresh",
    response_model=TokenResponse,
    summary="Refresh access token (Single-use with automatic reuse detection)",
)
def refresh_token(
    refresh_in: RefreshTokenRequest,
    session: SessionDep,
    request: Request,
) -> TokenResponse:
    """
    Exchange a valid single-use refresh token for a brand new token pair.
    
    If a previously used or revoked refresh token is presented, all active sessions
    for that account are immediately invalidated for security (RFC 6819).
    """
    ip_address = request.client.host if request.client else None
    user_agent = request.headers.get("user-agent")
    return auth_service.refresh_access_token(
        session=session,
        raw_refresh_token=refresh_in.refresh_token,
        device_info=user_agent,
        ip_address=ip_address,
    )


@router.post(
    "/logout",
    status_code=status.HTTP_200_OK,
    summary="Revoke single refresh token session",
)
def logout(
    logout_in: LogoutRequest,
    session: SessionDep,
) -> dict[str, str]:
    """Revoke the given refresh token session."""
    auth_service.logout_user(session, logout_in.refresh_token)
    return {"message": "Logged out successfully."}


@router.post(
    "/logout-all",
    status_code=status.HTTP_200_OK,
    summary="Revoke all active sessions for current user",
)
def logout_all(
    current_user: CurrentUserDep,
    session: SessionDep,
) -> dict[str, str]:
    """Revoke all active refresh sessions across all devices for the current user."""
    revoked_count = auth_service.logout_all_sessions(session, current_user.id)
    return {"message": f"Successfully revoked {revoked_count} active session(s)."}


@router.post(
    "/change-password",
    status_code=status.HTTP_200_OK,
    summary="Change password for current user",
)
def change_password(
    password_data: ChangePasswordRequest,
    current_user: CurrentUserDep,
    session: SessionDep,
) -> dict[str, str]:
    """Update current user password and invalidate all previous active sessions."""
    auth_service.change_password(
        session=session,
        user=current_user,
        old_password=password_data.old_password,
        new_password=password_data.new_password,
    )
    return {"message": "Password updated successfully. All other sessions have been logged out."}
