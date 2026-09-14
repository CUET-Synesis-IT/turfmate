from datetime import datetime
from typing import Optional
import uuid
from sqlmodel import Session, select
from app.models.auth_session import UserSession


def create_session(
    session: Session,
    user_id: uuid.UUID,
    token_hash: str,
    expires_at: datetime,
    device_info: Optional[str] = None,
    ip_address: Optional[str] = None,
) -> UserSession:
    """Create and persist a new user refresh session."""
    user_session = UserSession(
        user_id=user_id,
        refresh_token_hash=token_hash,
        expires_at=expires_at,
        device_info=device_info,
        ip_address=ip_address,
        is_revoked=False,
    )
    session.add(user_session)
    session.commit()
    session.refresh(user_session)
    return user_session


def get_session_by_token_hash(
    session: Session,
    token_hash: str,
) -> Optional[UserSession]:
    """Look up an active, unrevoked session by its token hash."""
    statement = select(UserSession).where(
        UserSession.refresh_token_hash == token_hash,
        UserSession.is_revoked.is_(False),
    )
    return session.exec(statement).first()


def get_any_session_by_token_hash(
    session: Session,
    token_hash: str,
    for_update: bool = False,
) -> Optional[UserSession]:
    """Look up any session (active or revoked) by its token hash with optional row lock."""
    statement = select(UserSession).where(UserSession.refresh_token_hash == token_hash)
    if for_update:
        statement = statement.with_for_update()
    return session.exec(statement).first()


def revoke_session(session: Session, db_session: UserSession) -> None:
    """Revoke a single session."""
    db_session.is_revoked = True
    session.add(db_session)
    session.commit()


def revoke_all_user_sessions(session: Session, user_id: uuid.UUID) -> int:
    """Revoke all active sessions for a user (e.g. on compromise detection or logout-all)."""
    statement = select(UserSession).where(
        UserSession.user_id == user_id,
        UserSession.is_revoked.is_(False),
    )
    sessions = session.exec(statement).all()
    count = 0
    for s in sessions:
        s.is_revoked = True
        session.add(s)
        count += 1
    session.commit()
    return count
