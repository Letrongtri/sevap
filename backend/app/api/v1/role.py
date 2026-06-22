from typing import Annotated
from fastapi import APIRouter, HTTPException, Depends, Request, BackgroundTasks
from typing import List

from app.services import (
    RoleService,
    RoleAlreadyExistsError,
    NotFoundError
)
from app.schemas import (
    RoleCreate, 
    RoleResponse, 
    RoleUpdate,
    RoleSimple,
    RoleQuery,
    RolePaginatedResponse,
    PaginationQuery
)
from app.dependencies import get_role_service
from app.decorators import log_activity
from app.core.logging import logger

router = APIRouter()

@router.get("", response_model=RolePaginatedResponse)
# @limiter.limit(settings.RATE_LIMIT_ENDPOINTS["create_user"][0])
async def get_all_roles(
    request: Request,
    query: Annotated[RoleQuery, Depends()],
    pagination: Annotated[PaginationQuery, Depends()],
    role_service: RoleService = Depends(get_role_service),
):
    """ Get all system roles.

    Args:
        request: The FastAPI request object for rate limiting.
        role_service: Role service

    Returns:
        List[RoleResponse]: List of role information
    """
    try:
        tenant_id = request.state.tenant_id
        return await role_service.get_all_roles(
            tenant_id,
            query,
            pagination
        )
    except Exception:
        logger.error(
            "get_all_roles_failed",
            exc_info=True
        )
        raise HTTPException(status_code=422, detail="Failed to get all roles")

@router.post("", response_model=RoleResponse)
@log_activity(
    action="role.create",
    resource="role",
    meta_extractor=lambda res, *args, **kwargs: {
        "role_id": res.id, 
        "role_name": res.name
    }
)
# @limiter.limit(settings.RATE_LIMIT_ENDPOINTS["create_user"][0])
async def create_role(
    request: Request, 
    data: RoleCreate,
    background_tasks: BackgroundTasks,
    role_service: RoleService = Depends(get_role_service),
):
    try:
        tenant_id = request.state.tenant_id
        return await role_service.create_role(tenant_id, data)
    except RoleAlreadyExistsError:
        logger.error("role_already_exists", role_name=data.name)
        raise HTTPException(status_code=409, detail="Role already exists")
    except Exception:
        logger.error(
            "create_role_failed", 
            role_name=data.name, 
            exc_info=True
        )
        raise HTTPException(status_code=422, detail="Failed to create role")

@router.get("/simple", response_model=List[RoleSimple])
# @limiter.limit(settings.RATE_LIMIT_ENDPOINTS["create_user"][0])
async def get_all_simple_roles(
    request: Request,
    role_service: RoleService = Depends(get_role_service),
):
    try:
        tenant_id = request.state.tenant_id
        return await role_service.get_all_simple_roles(tenant_id)
    except Exception:
        logger.error(
            "get_all_simple_roles_failed",
            exc_info=True
        )
        raise HTTPException(status_code=422, detail="Failed to get all roles")


@router.get("/{role_id}", response_model=RoleResponse)
# @limiter.limit(settings.RATE_LIMIT_ENDPOINTS["create_user"][0])
async def get_role(
    request: Request, 
    role_id: str,
    role_service: RoleService = Depends(get_role_service),
):
    """ Get a role detail.

    Args:
        request: The FastAPI request object for rate limiting.
        role_id: Role's id

    Returns:
        RoleResponse: Role detail
    """
    try:
        tenant_id = request.state.tenant_id
        return await role_service.get_role_by_id(tenant_id, role_id)
    except NotFoundError:
        logger.error("role_not_found", role_id=role_id)
        raise HTTPException(status_code=404, detail="Role not found")
    except Exception:
        logger.error(
            "get_role_failed",
            role_id=role_id,
            exc_info=True
        )
        raise HTTPException(status_code=422, detail="Failed to get role")

@router.patch("/{role_id}", response_model=RoleResponse)
@log_activity(
    action="role.update",
    resource="role",
    meta_extractor=lambda res, *args, **kwargs: {
        "role_id": kwargs.get("role_id"),
        "role_name": res.name
    }
)
# @limiter.limit(settings.RATE_LIMIT_ENDPOINTS["create_user"][0])
async def update_role(
    request: Request,
    role_id: str, 
    data: RoleUpdate,
    background_tasks: BackgroundTasks,
    role_service: RoleService = Depends(get_role_service),
):
    try:
        tenant_id = request.state.tenant_id
        return await role_service.update_role(tenant_id, role_id, data)
    except NotFoundError:
        logger.error("updated_role_not_found", role_id=role_id)
        raise HTTPException(status_code=404, detail="Role not found")
    except Exception:
        logger.error(
            "update_role_failed", 
            role_id=role_id, 
            exc_info=True
        )
        raise HTTPException(status_code=422, detail="Failed to update role")

@router.delete("/{role_id}", response_model=RoleResponse)
@log_activity(
    action="role.delete",
    resource="role",
    meta_extractor=lambda res, *args, **kwargs: {
        "role_id": kwargs.get("role_id"), 
        "role_name": res.name
    }
)
# @limiter.limit(settings.RATE_LIMIT_ENDPOINTS["create_user"][0])
async def delete_role(
    request: Request,
    role_id: str,
    background_tasks: BackgroundTasks,
    role_service: RoleService = Depends(get_role_service),
):
    """Delete custom role.

    Args:
        request: The FastAPI request object for rate limiting.
        role_id: Custom role's id

    Returns:
        RoleResponse: Deleted role information
    """
    try:
        tenant_id = request.state.tenant_id
        return await role_service.delete_role(tenant_id, role_id)
    except NotFoundError:
        logger.error("deleted_role_not_found", role_id=role_id)
        raise HTTPException(status_code=404, detail="Role not found")
    except Exception:
        logger.error(
            "delete_role_failed", 
            role_id=role_id, 
            exc_info=True
        )
        raise HTTPException(status_code=422, detail="Failed to delete role")
