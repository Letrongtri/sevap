from fastapi import Depends, HTTPException, Request, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from jose import JWTError
from sqlalchemy.ext.asyncio import AsyncSession

from app.dependencies.db import get_db
from app.repositories import TenantRepository
from app.utils.auth import verify_token

bearer_scheme = HTTPBearer()

async def get_current_user(
    request: Request,
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

    except JWTError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token",
        )

async def require_global_admin(
    current_user: dict = Depends(get_current_user)
):
    print(current_user)
    if not current_user.get("is_global_admin"):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Yêu cầu quyền Quản trị viên hệ thống (Global Admin)"
        )
    return current_user
