from fastapi import Depends, HTTPException, Request, status, BackgroundTasks
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from jose import JWTError
from sqlalchemy.ext.asyncio import AsyncSession

from app.dependencies.db import get_db
from app.repositories import TenantRepository
from app.utils.auth import verify_token
from app.services.activity_log_service import ActivityLogService

bearer_scheme = HTTPBearer()

async def get_current_user(
    request: Request,
    background_tasks: BackgroundTasks,
    credentials: HTTPAuthorizationCredentials = Depends(bearer_scheme),
    db: AsyncSession = Depends(get_db)
):
    try:
        token = credentials.credentials
        payload = verify_token(token)
        if not payload:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid token",
            )

        user_id = payload.get("sub")
        roles = payload.get("roles", [])
        tenant_id = payload.get("tenant_id")

        if user_id is None or tenant_id is None:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid token",
            )

        tenant_repo = TenantRepository(db)
        tenant = await tenant_repo.get_tenant_by_id(tenant_id)

        if tenant is None:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid token",
            )

        is_global_admin = (
            tenant.tenant_domain == "system.hrnexus.com" and "admin" in roles
        )

        request.state.user = {
            "id": user_id,
            "roles": roles,
            "is_global_admin": is_global_admin,
        }
        request.state.tenant_id = tenant_id

        return {
            "user_id": user_id,
            "roles": roles,
            "tenant_id": tenant_id,
            "is_global_admin": is_global_admin,
        }

    except JWTError as e:
        ActivityLogService.log(
            background_tasks=None,
            user_id=None,
            tenant_id=None,
            action="security.jwt_signature_error",
            resource="auth",
            meta_data={
                "error": str(e),
                "ip": request.client.host if request.client else None
            },
            ip_address=request.client.host if request.client else None,
            log_level="ERROR"
        )
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token",
        )

async def require_global_admin(
    request: Request,
    background_tasks: BackgroundTasks,
    current_user: dict = Depends(get_current_user)
):
    if not current_user.get("is_global_admin"):
        ActivityLogService.log(
            background_tasks=None,
            user_id=current_user.get("user_id"),
            tenant_id=None,
            action="security.unauthorized_global_admin_attempt",
            resource="global_admin",
            meta_data={
                "user_roles": current_user.get("roles"),
                "ip": request.client.host if request.client else None
            },
            ip_address=request.client.host if request.client else None,
            log_level="ERROR"
        )
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Yêu cầu quyền Quản trị viên hệ thống (Global Admin)"
        )
    return current_user

async def require_tenant_admin(
    request: Request,
    background_tasks: BackgroundTasks,
    current_user: dict = Depends(get_current_user)
):
    """Ensure the user is a tenant admin or a global admin."""
    roles = current_user.get("roles", [])
    is_global_admin = current_user.get("is_global_admin")
    
    if "admin" not in roles and not is_global_admin:
        ActivityLogService.log(
            background_tasks=None,
            user_id=current_user.get("user_id"),
            tenant_id=None,
            action="security.unauthorized_tenant_admin_attempt",
            resource="tenant_admin",
            meta_data={
                "user_roles": current_user.get("roles"),
                "ip": request.client.host if request.client else None
            },
            ip_address=request.client.host if request.client else None,
            log_level="ERROR"
        )
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Yêu cầu quyền Quản trị viên tenants (Tenant Admin)"
        )
    return current_user
