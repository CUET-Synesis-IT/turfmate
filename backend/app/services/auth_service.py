from datetime import datetime, timedelta, timezone
from typing import Optional
from fastapi import HTTPException, status
from sqlmodel import Session
from app.core.config import settings
from app.core.security import (
    create_access_token,
    generate_secure_token,
    get_password_hash,
    hash_token,
    verify_password,
)
from app.crud import auth_session as session_crud
from app.crud import user as user_crud
from app.models.user import User, UserRole
from app.schemas.auth import LoginRequest, TokenResponse
from app.schemas.user import UserCreate, UserRegister


def _issue_tokens(
    session: Session,
    user: User,
    device_info: Optional[str] = None,
    ip_address: Optional[str] = None,
) -> TokenResponse:
    """Generate an access token and a tracked single-use refresh token session."""
    access_token = create_access_token(subject=user.id)
    raw_refresh_token = generate_secure_token()
    token_hash = hash_token(raw_refresh_token)

    now = datetime.now(timezone.utc)
    expires_at = now + timedelta(days=settings.REFRESH_TOKEN_EXPIRE_DAYS)

    session_crud.create_session(
        session=session,
        user_id=user.id,
        token_hash=token_hash,
        expires_at=expires_at,
        device_info=device_info,
        ip_address=ip_address,
    )

    return TokenResponse(
        access_token=access_token,
        refresh_token=raw_refresh_token,
        token_type="bearer",
        expires_in=settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60,
    )


def register_user(
    session: Session,
    user_in: UserRegister,
    device_info: Optional[str] = None,
    ip_address: Optional[str] = None,
) -> tuple[User, TokenResponse]:
    """Register a new user with required phone number, optional email, and strictly CUSTOMER role."""
    # Check phone uniqueness
    existing_phone = user_crud.get_user_by_phone(session, user_in.phone_number)
    if existing_phone:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="A user with this phone number already exists.",
        )

    # Check optional email uniqueness if provided
    if user_in.email:
        existing_email = user_crud.get_user_by_email(session, user_in.email)
        if existing_email:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="A user with this email address already exists.",
            )

    hashed_password = get_password_hash(user_in.password)
    user = user_crud.create_user(session, user_in, hashed_password, role=UserRole.CUSTOMER)
    tokens = _issue_tokens(session, user, device_info, ip_address)
    return user, tokens


def authenticate_user(
    session: Session,
    login_data: LoginRequest,
    ip_address: Optional[str] = None,
) -> TokenResponse:
    """Authenticate user with phone number (or email) and password."""
    user = user_crud.get_user_by_identifier(session, login_data.phone_number)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid phone number or password.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    if not verify_password(login_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid phone number or password.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="User account is inactive.",
        )

    return _issue_tokens(
        session=session,
        user=user,
        device_info=login_data.device_info,
        ip_address=ip_address,
    )


def refresh_access_token(
    session: Session,
    raw_refresh_token: str,
    device_info: Optional[str] = None,
    ip_address: Optional[str] = None,
) -> TokenResponse:
    """
    Exchange a valid refresh token for a new token pair (Single-use rotation).
    
    Adheres strictly to RFC 6819 Refresh Token Reuse Detection:
    - If an already-revoked refresh token is presented, this indicates a potential
      compromise/theft. All active sessions for this user are immediately invalidated.
    """
    token_hash = hash_token(raw_refresh_token)
    db_session = session_crud.get_any_session_by_token_hash(
        session=session,
        token_hash=token_hash,
        for_update=True,
    )

    if not db_session:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid refresh token.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    # RFC 6819 Automatic Reuse Detection
    if db_session.is_revoked:
        session_crud.revoke_all_user_sessions(session, db_session.user_id)
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Security violation: This refresh token has already been used. All active sessions have been revoked for your safety. Please log in again.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    now = datetime.now(timezone.utc)
    if db_session.expires_at <= now:
        session_crud.revoke_session(session, db_session)
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Refresh token has expired. Please log in again.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    user = user_crud.get_user_by_id(session, db_session.user_id)
    if not user or not user.is_active:
        session_crud.revoke_session(session, db_session)
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User account is inactive or not found.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    # Single-use enforcement: Immediately invalidate this refresh token
    session_crud.revoke_session(session, db_session)

    # Issue new access token and a brand new single-use refresh token
    return _issue_tokens(
        session=session,
        user=user,
        device_info=device_info or db_session.device_info,
        ip_address=ip_address or db_session.ip_address,
    )


def logout_user(session: Session, raw_refresh_token: str) -> None:
    """Revoke a single refresh token session."""
    token_hash = hash_token(raw_refresh_token)
    db_session = session_crud.get_session_by_token_hash(session, token_hash)
    if db_session:
        session_crud.revoke_session(session, db_session)


def logout_all_sessions(session: Session, user_id) -> int:
    """Revoke all active sessions for a user across all devices."""
    return session_crud.revoke_all_user_sessions(session, user_id)


def change_password(
    session: Session,
    user: User,
    old_password: str,
    new_password: str,
) -> None:
    """Validate current password, update to new hash, and revoke all active sessions."""
    if not verify_password(old_password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Incorrect current password.",
        )

    new_hash = get_password_hash(new_password)
    user.hashed_password = new_hash
    session.add(user)
    session.commit()

    # Invalidate all existing sessions on password change for security
    session_crud.revoke_all_user_sessions(session, user.id)
