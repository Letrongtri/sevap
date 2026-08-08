"""Rate limiter instance and helper functions using slowapi.

This module initializes the Limiter instance used across the FastAPI application
to enforce request rate limits per IP address or user context.
"""

from fastapi import Request
from slowapi import Limiter
from app.core.config import settings
from app.utils.request import get_client_ip


def get_rate_limit_key(request: Request) -> str:
    """Determine client identifier for rate limiting.

    Extracts the client IP address using the get_client_ip utility function,
    which properly handles proxy headers like X-Forwarded-For.

    Args:
        request: The FastAPI/Starlette Request instance.

    Returns:
        str: Client IP identifier or fallback address.
    """
    ip = get_client_ip(request)
    return ip if ip else "127.0.0.1"


# Initialize the application limiter
limiter = Limiter(
    key_func=get_rate_limit_key,
    default_limits=settings.RATE_LIMIT_DEFAULT,
)
