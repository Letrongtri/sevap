from fastapi import Depends, HTTPException, Request, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from jose import JWTError

from app.utils.auth import verify_token

bearer_scheme = HTTPBearer()

async def get_current_user(
    request: Request,
    credentials: HTTPAuthorizationCredentials = Depends(bearer_scheme),
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
        
        request.state.user = {
            "id": user_id,
            "roles": roles,
        }
        request.state.tenant_id = tenant_id

        return {
            "user_id": user_id,
            "roles": roles,
            "tenant_id": tenant_id,
        }

    except JWTError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token",
        )
