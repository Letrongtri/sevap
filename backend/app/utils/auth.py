"""This file contains the authentication utilities for the application."""

import re
import uuid
from datetime import UTC, datetime, timedelta
from typing import List, Optional
from jose import JWTError, jwt

from app.core.config import settings
from app.core.logging import logger
from app.schemas import Token

from pwdlib import PasswordHash

password_hash = PasswordHash.recommended()

def verify_password(password: str, hashed_password: str) -> bool:
    """Verify if the provided password matches the hash."""
    return password_hash.verify(password, hashed_password)

def hash_password(password: str) -> str:
    return password_hash.hash(password)

def generate_jti() -> str:
    return str(uuid.uuid7())

def create_access_token(
    user_id: str, jti: str, user_roles: List[str],
    tenant_id: Optional[str] = None,
    is_global_admin: bool = False,
    permissions: Optional[List[str]] = None, 
    expires_delta: Optional[timedelta] = None
) -> Token:
    """Create a new access token for a thread.

    Args:
        user_id: The unique thread ID for the conversation.
        expires_delta: Optional expiration time delta.

    Returns:
        Token: The generated access token.
    """
    if expires_delta:
        expire = datetime.now(UTC) + expires_delta
    else:
        expire = datetime.now(UTC) + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)

    to_encode = {
        "sub": user_id, # User ID
        "tenant_id": tenant_id,
        "is_global_admin": is_global_admin,
        "roles": user_roles,
        "permissions": permissions or [],
        "exp": expire,
        "iat": datetime.now(UTC),
        "jti": jti
    }

    encoded_jwt = jwt.encode(to_encode, settings.JWT_SECRET_KEY, algorithm=settings.JWT_ALGORITHM)

    logger.info("access_token_created", user_id=user_id, expires_at=expire.isoformat())

    return Token(jti=jti, token=encoded_jwt, expires_at=expire)

def create_refresh_token(
    user_id: str,
    jti: str,
    tenant_id: Optional[str] = None,
    is_global_admin: bool = False,
    expires_delta: Optional[timedelta] = None
) -> Token:
    """Create a new refresh token for a thread.

    Args:
        user_id: The unique thread ID for the conversation.
        tenant_id: The tenant ID of the user.
        is_global_admin: Whether the user is a global admin.
        expires_delta: Optional expiration time delta.

    Returns:
        Token: The generated refresh token.
    """
    if expires_delta:
        expire = datetime.now(UTC) + expires_delta
    else:
        expire = datetime.now(UTC) + timedelta(days=settings.REFRESH_TOKEN_EXPIRE_DAYS)

    to_encode = {
        "sub": user_id, # User ID
        "tenant_id": tenant_id,
        "is_global_admin": is_global_admin,
        "exp": expire,
        "iat": datetime.now(UTC),
        "jti": jti
    }

    encoded_jwt = jwt.encode(to_encode, settings.JWT_SECRET_KEY, algorithm=settings.JWT_ALGORITHM)

    logger.info("refresh_token_created", user_id=user_id, tenant_id=tenant_id, expires_at=expire.isoformat())

    return Token(jti=jti, token=encoded_jwt, expires_at=expire)

def verify_token(token: str) -> Optional[str]:
    """Verify a JWT token and return the thread ID.

    Args:
        token: The JWT token to verify.

    Returns:
        Optional[str]: The thread ID if token is valid, None otherwise.

    Raises:
        ValueError: If the token format is invalid
    """
    if not token or not isinstance(token, str):
        logger.warning("token_invalid_format")
        raise ValueError("Token must be a non-empty string")

    # Basic format validation before attempting decode
    # JWT tokens consist of 3 base64url-encoded segments separated by dots
    if not re.match(r"^[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+$", token):
        logger.warning("token_suspicious_format")
        raise ValueError("Token format is invalid - expected JWT format")

    try:
        payload = jwt.decode(token, settings.JWT_SECRET_KEY, algorithms=[settings.JWT_ALGORITHM])
        return payload
    except JWTError as e:
        logger.error("token_verification_failed", error=str(e))
        return None