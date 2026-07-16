from fastapi import Depends, HTTPException, Request, status, BackgroundTasks
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from jose import JWTError

from app.utils.auth import verify_token
from app.core.enum import LogLevel, PermissionResource, PermissionAction
from app.services.activity_log_service import ActivityLogService
from app.utils.request import get_client_ip, get_user_agent

bearer_scheme = HTTPBearer(auto_error=False)

async def get_current_user(
    request: Request,
    background_tasks: BackgroundTasks,
    credentials: HTTPAuthorizationCredentials = Depends(bearer_scheme),
):
    client_ip = get_client_ip(request)
    user_agent = get_user_agent(request)
    try:
        token = None
        if credentials:
            token = credentials.credentials
        else:
            # Fallback to query parameter for EventSource/SSE connections
            token = request.query_params.get("token")

        if not token:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid or missing authentication token",
            )
        payload = verify_token(token)
        if not payload:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid token",
            )

        user_id = payload.get("sub")
        jti = payload.get("jti")
        roles = payload.get("roles", [])
        permissions = payload.get("permissions", [])
        tenant_id = payload.get("tenant_id")
        is_global_admin = payload.get("is_global_admin", False)

        if user_id is None or jti is None:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid token",
            )

        if is_global_admin and tenant_id:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid token",
            )

        if not is_global_admin and not tenant_id:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid token",
            )

        request.state.user = {
            "id": user_id,
            "roles": roles,
            "permissions": permissions,
            "is_global_admin": is_global_admin
        }
        request.state.tenant_id = tenant_id
        request.state.jti = jti
        return {
            "user_id": user_id,
            "jti": jti,
            "roles": roles,
            "permissions": permissions,
            "tenant_id": tenant_id,
            "is_global_admin": is_global_admin
        }
    except JWTError as e:
        ActivityLogService.log(
            background_tasks=None,
            user_id=None,
            tenant_id=None,
            action="security.jwt_signature_error",
            resource="auth",
            meta_data={
                "error": str(e)
            },
            ip_address=client_ip,
            user_agent=user_agent,
            log_level="ERROR"
        )
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token",
        )

def check_permission(
    resource: PermissionResource, 
    action: PermissionAction,
    require_global_admin: bool = False
):
    async def dependency(
        request: Request,
        background_tasks: BackgroundTasks,
        current_user: dict = Depends(get_current_user)
    ):
        client_ip = get_client_ip(request)
        user_agent = get_user_agent(request)

        res_val = resource.value if hasattr(resource, 'value') else str(resource)
        act_val = action.value if hasattr(action, 'value') else str(action)
        required_perm = f"{res_val}:{act_val}"

        if require_global_admin:
            if current_user.get("is_global_admin") and required_perm in current_user.get("permissions", []):
                return current_user
            
            background_tasks.add_task(
                ActivityLogService.log,
                user_id=current_user.get("user_id"),
                tenant_id=None,
                action="security.unauthorized_global_infrastructure_violation",
                resource=res_val,
                meta_data={
                    "action": act_val,
                    "user_roles": current_user.get("roles")
                },
                ip_address=client_ip,
                user_agent=user_agent,
                log_level=LogLevel.WARNING
            )
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Yêu cầu đặc quyền Quản trị viên toàn hệ thống (Global Admin)."
            )

        user_perms = current_user.get("permissions", [])

        if required_perm in user_perms:
            return current_user

        # Log unauthorized attempt
        ActivityLogService.log(
            background_tasks=None,
            user_id=current_user.get("user_id"),
            tenant_id=current_user.get("tenant_id"),
            action="security.unauthorized_access_attempt",
            resource=res_val,
            meta_data={
                "action": act_val,
                "user_roles": current_user.get("roles")
            },
            ip_address=client_ip,
            user_agent=user_agent,
            log_level=LogLevel.WARNING
        )
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=f"Không có quyền thực hiện hành động này ({required_perm})"
        )
    return dependency
