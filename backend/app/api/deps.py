from typing import Annotated, Callable
import uuid
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlmodel import Session
from app.core.security import decode_token
from app.crud import business_member as member_crud
from app.crud.user import get_user_by_id
from app.db.session import get_session
from app.models.business import BusinessMember, BusinessRole
from app.models.user import User

http_bearer = HTTPBearer(auto_error=True)

SessionDep = Annotated[Session, Depends(get_session)]


def get_current_user(
    session: SessionDep,
    credentials: Annotated[HTTPAuthorizationCredentials, Depends(http_bearer)],
) -> User:
    """Validate bearer access token and retrieve current user."""
    token = credentials.credentials
    payload = decode_token(token)
    if not payload:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate credentials.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    token_type = payload.get("type")
    if token_type != "access":
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token type.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    user_id_str: str | None = payload.get("sub")
    if not user_id_str:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token payload missing subject identifier.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    try:
        user_uuid = uuid.UUID(user_id_str)
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid subject UUID in token.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    user = get_user_by_id(session, user_uuid)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found.",
        )

    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Inactive user account.",
        )

    return user


CurrentUserDep = Annotated[User, Depends(get_current_user)]


def get_current_active_user(current_user: CurrentUserDep) -> User:
    """Ensure current user is active."""
    if not current_user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Inactive user.",
        )
    return current_user


def get_current_superuser(current_user: CurrentUserDep) -> User:
    """Ensure current user has superuser privileges."""
    if not current_user.is_superuser:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="The user doesn't have enough privileges.",
        )
    return current_user


def get_business_member_or_403(
    business_id: uuid.UUID,
    current_user: CurrentUserDep,
    session: SessionDep,
) -> BusinessMember:
    """Validate that the current user belongs to the specified business."""
    member = member_crud.get_member(session, business_id, current_user.id)
    if not member or not member.is_active:
        if current_user.is_superuser:
            return BusinessMember(
                business_id=business_id,
                user_id=current_user.id,
                role=BusinessRole.OWNER,
                is_active=True,
            )
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You do not have access to this business.",
        )
    return member


def require_business_roles(allowed_roles: list[BusinessRole]) -> Callable:
    """Dependency factory checking if caller has an authorized role in the business."""
    def role_checker(
        member: Annotated[BusinessMember, Depends(get_business_member_or_403)],
        current_user: CurrentUserDep,
    ) -> BusinessMember:
        if current_user.is_superuser:
            return member
        if member.role not in allowed_roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Operation requires one of the following roles: {[r.value for r in allowed_roles]}.",
            )
        return member

    return role_checker
