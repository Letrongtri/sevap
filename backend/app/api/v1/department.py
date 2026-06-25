from typing import Annotated
from typing import List

from fastapi import APIRouter, Depends, HTTPException, Request, BackgroundTasks

from app.dependencies import get_department_service, check_permission
from app.schemas import (
    DepartmentCreate, DepartmentResponse, DepartmentUpdate, DepartmentSimple,
    DepartmentQuery, DepartmentPaginatedResponse, PaginationQuery
)
from app.services import DepartmentService, NotFoundError, DepartmentAlreadyExistsError
from app.decorators import log_activity
from app.core.logging import logger
from app.core.enum import PermissionAction, PermissionResource


router = APIRouter()

@router.get(
    "",
    response_model=DepartmentPaginatedResponse,
    dependencies=[Depends(check_permission(
        PermissionResource.DEPARTMENTS, PermissionAction.READ
    ))]
)
# @limiter.limit(settings.RATE_LIMIT_ENDPOINTS["create_user"][0])
async def get_all_departments(
    request: Request,
    pagination: Annotated[PaginationQuery, Depends()],
    query: Annotated[DepartmentQuery, Depends()],
    department_service: DepartmentService = Depends(get_department_service),
):
    try:
        tenant_id = request.state.tenant_id
        return await department_service.get_all_departments(
            tenant_id, pagination, query
        )
    except Exception:
        logger.error(
            "get_all_departments_failed",
            exc_info=True
        )
        raise HTTPException(status_code=422, detail="Failed to get all departments")

@router.post(
    "",
    response_model=DepartmentResponse,
    dependencies=[Depends(check_permission(
        PermissionResource.DEPARTMENTS, PermissionAction.CREATE
    ))]
)
@log_activity(
    action="department.create",
    resource="department",
    meta_extractor=lambda res, *args, **kwargs: {
        "department_id": res.id,
        "department_name": res.name
    }
)
# @limiter.limit(settings.RATE_LIMIT_ENDPOINTS["create_user"][0])
async def create_department(
    request: Request, 
    data: DepartmentCreate,
    background_tasks: BackgroundTasks,
    department_service: DepartmentService = Depends(get_department_service),
):
    try:
        user_id = request.state.user["id"]
        tenant_id = request.state.tenant_id
        return await department_service.create_department(
            tenant_id, user_id, data
        )
    except DepartmentAlreadyExistsError:
        logger.error("department_already_exists", department_name=data.name)
        raise HTTPException(status_code=409, detail="Department already exists")
    except Exception:
        logger.error(
            "create_department_failed", 
            department_name=data.name, 
            exc_info=True
        )
        raise HTTPException(status_code=422, detail="Failed to create department")

@router.get(
    "/simple",
    response_model=List[DepartmentSimple],
    dependencies=[Depends(check_permission(
        PermissionResource.DEPARTMENTS, PermissionAction.READ
    ))]
)
# @limiter.limit(settings.RATE_LIMIT_ENDPOINTS["create_user"][0])
async def get_all_simple_departments(
    request: Request,
    department_service: DepartmentService = Depends(get_department_service),
):
    try:
        tenant_id = request.state.tenant_id
        return await department_service.get_all_simple_departments(tenant_id)
    except Exception:
        logger.error(
            "get_all_simple_departments_failed",
            exc_info=True
        )
        raise HTTPException(status_code=422, detail="Failed to get all departments")

@router.get(
    "/{department_id}",
    response_model=DepartmentResponse,
    dependencies=[Depends(check_permission(
        PermissionResource.DEPARTMENTS, PermissionAction.READ
    ))]
)
# @limiter.limit(settings.RATE_LIMIT_ENDPOINTS["create_user"][0])
async def get_department(
    request: Request, 
    department_id: str,
    department_service: DepartmentService = Depends(get_department_service),
):
    """ Get a department detail.

    Args:
        request: The FastAPI request object for rate limiting.
        department_id: department's id

    Returns:
        departmentResponse: department detail
    """
    try:
        tenant_id = request.state.tenant_id
        return await department_service.get_department_by_id(
            tenant_id, department_id
        )
    except NotFoundError:
        logger.error("department_not_found", department_id=department_id)
        raise HTTPException(status_code=404, detail="department not found")
    except Exception:
        logger.error(
            "get_department_failed",
            department_id=department_id,
            exc_info=True
        )
        raise HTTPException(status_code=422, detail="Failed to get department")

@router.patch(
    "/{department_id}",
    response_model=DepartmentResponse,
    dependencies=[Depends(check_permission(
        PermissionResource.DEPARTMENTS, PermissionAction.UPDATE
    ))]
)
@log_activity(
    action="department.update",
    resource="department",
    meta_extractor=lambda res, *args, **kwargs: {
        "department_id": kwargs.get("department_id"),
        "department_name": res.name
    }
)
# @limiter.limit(settings.RATE_LIMIT_ENDPOINTS["create_user"][0])
async def update_department(
    request: Request,
    department_id: str, 
    data: DepartmentUpdate,
    background_tasks: BackgroundTasks,
    department_service: DepartmentService = Depends(get_department_service),
):
    try:
        tenant_id = request.state.tenant_id
        return await department_service.update_department(
            tenant_id, department_id, data
        )
    except NotFoundError:
        logger.error("updated_department_not_found", department_id=department_id)
        raise HTTPException(status_code=404, detail="Department not found")
    except Exception:
        logger.error(
            "update_department_failed", 
            department_id=department_id, 
            exc_info=True
        )
        raise HTTPException(status_code=422, detail="Failed to update department")

@router.delete(
    "/{department_id}",
    response_model=DepartmentResponse,
    dependencies=[Depends(check_permission(
        PermissionResource.DEPARTMENTS, PermissionAction.DELETE
    ))]
)
@log_activity(
    action="department.delete",
    resource="department",
    meta_extractor=lambda res, *args, **kwargs: {
        "department_id": kwargs.get("department_id"),
        "department_name": res.name
    }
)
# @limiter.limit(settings.RATE_LIMIT_ENDPOINTS["create_user"][0])
async def delete_department(
    request: Request,
    department_id: str,
    background_tasks: BackgroundTasks,
    department_service: DepartmentService = Depends(get_department_service),
):
    """Delete custom department.

    Args:
        request: The FastAPI request object for rate limiting.
        department_id: Custom department's id

    Returns:
        departmentResponse: Deleted department information
    """
    try:
        tenant_id = request.state.tenant_id
        return await department_service.delete_department(
            tenant_id, department_id
        )
    except NotFoundError:
        logger.error("deleted_department_not_found", department_id=department_id)
        raise HTTPException(status_code=404, detail="Department not found")
    except Exception:
        logger.error(
            "delete_department_failed", 
            department_id=department_id, 
            exc_info=True
        )
        raise HTTPException(status_code=422, detail="Failed to delete department")
