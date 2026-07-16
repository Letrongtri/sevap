from functools import wraps
from typing import Callable, Any
from pydantic import BaseModel
from fastapi import BackgroundTasks, Request

from app.services import ActivityLogService
from app.core.enum import LogLevel
from app.core.logging import logger
from app.utils.request import get_client_ip, get_user_agent

# Các trường nhạy cảm sẽ bị loại bỏ tự động khỏi meta_data
SENSITIVE_FIELDS = frozenset({
    "password", "new_password", "old_password", "confirm_password",
    "token", "access_token", "refresh_token", "secret", "secret_key",
    "api_key", "private_key", "card_number", "cvv", "ssn",
})


def _extract_request_meta(args: tuple, kwargs: dict) -> dict:
    """Tự động rút trích các Pydantic model từ kwargs/args vào dict meta_data.
    
    Duyệt qua tất cả arguments, tìm các Pydantic BaseModel và serialize chúng
    thành dict, đồng thời lọc bỏ các trường nhạy cảm.
    """
    meta: dict = {}
    for value in list(kwargs.values()) + list(args):
        if isinstance(value, BaseModel):
            raw = value.model_dump(exclude_none=True)
            filtered = {k: v for k, v in raw.items() if k not in SENSITIVE_FIELDS}
            meta.update(filtered)
    return meta


def _build_context(request: Request, res: Any, is_global: bool, resource: str) -> dict:
    """Rút trích user_id, tenant_id, ip, user_agent từ request context."""
    user_id = None
    if hasattr(request.state, "user") and isinstance(request.state.user, dict):
        user_id = request.state.user.get("id")

    tenant_id = None if is_global else getattr(request.state, "tenant_id", None)
    if not is_global and not tenant_id and res:
        if hasattr(res, "tenant_id"):
            tenant_id = getattr(res, "tenant_id")
        elif resource == "tenant" and hasattr(res, "id"):
            tenant_id = getattr(res, "id")

    return {
        "user_id": user_id,
        "tenant_id": tenant_id,
        "client_ip": get_client_ip(request),
        "user_agent": get_user_agent(request),
    }


def log_activity(
    action: str,
    resource: str,
    log_level: LogLevel = LogLevel.INFO,
    log_level_on_error: LogLevel = LogLevel.ERROR,
    meta_extractor: Callable[[Any, Any, Any], dict] | None = None,
    include_request_body: bool = True,
    is_global: bool = False,
):
    """Decorator tự động ghi activity log cho cả trường hợp thành công và thất bại.

    Tính năng:
    - Ghi log sau khi endpoint thực thi thành công (log_level, mặc định INFO).
    - Ghi log khi endpoint ném exception (log_level_on_error, mặc định ERROR),
      sau đó re-raise exception để FastAPI xử lý bình thường.
    - Tự động rút trích Pydantic request body từ kwargs vào meta_data,
      lọc bỏ các trường nhạy cảm (SENSITIVE_FIELDS).
    - Hỗ trợ meta_extractor tuỳ chỉnh để bổ sung/ghi đè meta_data từ response.

    Args:
        action: Tên hành động, ví dụ "user.create".
        resource: Loại tài nguyên, ví dụ "user".
        log_level: Log level khi thành công (INFO/WARNING/...).
        log_level_on_error: Log level khi thất bại (ERROR/WARNING/...).
        meta_extractor: Hàm (res, *args, **kwargs) -> dict để bổ sung meta_data
                        từ response. Chỉ được gọi khi thành công.
        include_request_body: Nếu True, tự động serialize Pydantic body vào meta_data.
        is_global: Nếu True, không gắn tenant_id vào log.
    """
    def decorator(func):
        @wraps(func)
        async def wrapper(*args, **kwargs):
            # --- Tìm Request và BackgroundTasks từ args/kwargs ---
            request: Request | None = kwargs.get("request")
            if not request:
                for arg in args:
                    if isinstance(arg, Request):
                        request = arg
                        break

            background_tasks: BackgroundTasks | None = kwargs.get("background_tasks")
            if not background_tasks:
                for arg in args:
                    if isinstance(arg, BackgroundTasks):
                        background_tasks = arg
                        break

            # --- Rút trích request body meta trước khi gọi hàm ---
            # (body vẫn còn trong kwargs lúc này, sau khi func chạy nó không đổi)
            request_meta: dict = {}
            if include_request_body and request and background_tasks:
                request_meta = _extract_request_meta(args, kwargs)

            # --- Thực thi endpoint ---
            exc_to_raise = None
            res = None
            try:
                res = await func(*args, **kwargs)
            except Exception as exc:
                exc_to_raise = exc

            # --- Ghi log (cả thành công lẫn thất bại) ---
            if request and background_tasks:
                try:
                    ctx = _build_context(request, res, is_global, resource)

                    if exc_to_raise is not None:
                        # Trường hợp thất bại
                        meta_data: dict = {**request_meta}
                        meta_data["error"] = type(exc_to_raise).__name__
                        meta_data["error_detail"] = str(exc_to_raise)

                        ActivityLogService.log(
                            background_tasks=background_tasks,
                            user_id=ctx["user_id"],
                            tenant_id=ctx["tenant_id"],
                            action=f"{action}.failed",
                            resource=resource,
                            meta_data=meta_data or None,
                            ip_address=ctx["client_ip"],
                            user_agent=ctx["user_agent"],
                            log_level=log_level_on_error,
                        )
                    else:
                        # Trường hợp thành công
                        meta_data: dict = {**request_meta}
                        if meta_extractor:
                            try:
                                extra = meta_extractor(res, *args, **kwargs)
                                if isinstance(extra, dict):
                                    meta_data.update(extra)
                            except Exception as me:
                                logger.warning(
                                    "log_activity_meta_extractor_failed",
                                    action=action,
                                    error=str(me),
                                )

                        ActivityLogService.log(
                            background_tasks=background_tasks,
                            user_id=ctx["user_id"],
                            tenant_id=ctx["tenant_id"],
                            action=action,
                            resource=resource,
                            meta_data=meta_data or None,
                            ip_address=ctx["client_ip"],
                            user_agent=ctx["user_agent"],
                            log_level=log_level,
                        )
                except Exception as log_exc:
                    logger.error(
                        "log_activity_decorator_failed",
                        action=action,
                        error=str(log_exc),
                        exc_info=True,
                    )

            # Re-raise exception để FastAPI xử lý bình thường
            if exc_to_raise is not None:
                raise exc_to_raise

            return res
        return wrapper
    return decorator
