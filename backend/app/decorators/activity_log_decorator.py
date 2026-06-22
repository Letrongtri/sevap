import math
from functools import wraps
from typing import Callable, Any
from fastapi import BackgroundTasks, Request
from app.services import ActivityLogService
from app.core.logging import logger

def log_activity(action: str, resource: str, log_level: str = "INFO", meta_extractor: Callable[[Any, Any, Any], dict] | None = None, is_global: bool = False):
    """Decorator to automatically log activity after successful execution of an endpoint.
    
    It extracts the Request and BackgroundTasks arguments from the function signature,
    retrieves user_id, tenant_id, and ip_address from the request context, and writes
    the log asynchronously.
    """
    def decorator(func):
        @wraps(func)
        async def wrapper(*args, **kwargs):
            request = kwargs.get("request")
            if not request:
                for arg in args:
                    if isinstance(arg, Request):
                        request = arg
                        break
            
            background_tasks = kwargs.get("background_tasks")
            if not background_tasks:
                for arg in args:
                    if isinstance(arg, BackgroundTasks):
                        background_tasks = arg
                        break
            
            res = await func(*args, **kwargs)
            
            if request and background_tasks:
                try:
                    user_id = None
                    if hasattr(request.state, "user") and isinstance(request.state.user, dict):
                        user_id = request.state.user.get("id")
                    
                    tenant_id = None if is_global else getattr(request.state, "tenant_id", None)
                    if not is_global and not tenant_id and res:
                        if hasattr(res, "tenant_id"):
                            tenant_id = getattr(res, "tenant_id")
                        elif resource == "tenant" and hasattr(res, "id"):
                            tenant_id = getattr(res, "id")
                    ip_address = request.client.host if request.client else None
                    
                    meta_data = None
                    if meta_extractor:
                        meta_data = meta_extractor(res, *args, **kwargs)
                    
                    ActivityLogService.log(
                        background_tasks=background_tasks,
                        user_id=user_id,
                        tenant_id=tenant_id,
                        action=action,
                        resource=resource,
                        meta_data=meta_data,
                        ip_address=ip_address,
                        log_level=log_level
                    )
                except Exception as e:
                    logger.error("log_activity_decorator_failed", error=str(e), exc_info=True)
            return res
        return wrapper
    return decorator
