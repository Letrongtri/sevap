"""This file contains the authentication utilities for the application."""

import hashlib
import re
from datetime import UTC, datetime, timedelta
from typing import List, Optional
from jose import JWTError, jwt

from app.core.config import settings
from app.core.logging import logger
from app.schemas.auth_schema import Token
from app.utils.sanitization import sanitize_string

from pwdlib import PasswordHash

password_hash = PasswordHash.recommended()

def verify_password(password: str, hashed_password: str) -> bool:
    """Verify if the provided password matches the hash."""
    return password_hash.verify(password, hashed_password)

def hash_password(password: str) -> str:
    return password_hash.hash(password)

def create_access_token(user_id: str, user_roles: List[int], expires_delta: Optional[timedelta] = None) -> Token:
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

    jti = sanitize_string(f"{user_id}-{datetime.now(UTC).timestamp()}")  # Add unique token identifier

    to_encode = {
        "sub": user_id, # User ID
        "roles": user_roles,
        "exp": expire,
        "iat": datetime.now(UTC),
        "jti": jti
    }

    encoded_jwt = jwt.encode(to_encode, settings.JWT_SECRET_KEY, algorithm=settings.JWT_ALGORITHM)

    logger.info("access_token_created", user_id=user_id, expires_at=expire.isoformat())

    return Token(jti=jti, token=encoded_jwt, expires_at=expire)

def create_refresh_token(user_id: str, expires_delta: Optional[timedelta] = None) -> Token:
    """Create a new refresh token for a thread.

    Args:
        user_id: The unique thread ID for the conversation.
        expires_delta: Optional expiration time delta.

    Returns:
        Token: The generated refresh token.
    """
    if expires_delta:
        expire = datetime.now(UTC) + expires_delta
    else:
        expire = datetime.now(UTC) + timedelta(days=settings.REFRESH_TOKEN_EXPIRE_DAYS)

    jti = sanitize_string(f"{user_id}-{datetime.now(UTC).timestamp()}")  # Add unique token identifier

    to_encode = {
        "sub": user_id, # User ID
        "exp": expire,
        "iat": datetime.now(UTC),
        "jti": jti
    }

    encoded_jwt = jwt.encode(to_encode, settings.JWT_SECRET_KEY, algorithm=settings.JWT_ALGORITHM)

    logger.info("refresh_token_created", user_id=user_id, expires_at=expire.isoformat())

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