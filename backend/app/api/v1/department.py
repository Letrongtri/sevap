from typing import List

from fastapi import APIRouter, Depends, HTTPException, Request

from app.dependencies import get_department_service, get_message_service
from app.schemas import DepartmentCreate, DepartmentResponse, DepartmentUpdate
from app.services import DepartmentService, NotFoundError, DepartmentAlreadyExistsError
from app.core.logging import logger


router = APIRouter()

@router.get("", response_model=List[DepartmentResponse])
# @limiter.limit(settings.RATE_LIMIT_ENDPOINTS["create_user"][0])
async def get_all_departments(
    request: Request,
    department_service: DepartmentService = Depends(get_department_service),
):
    try:
        departments = await department_service.get_all_departments()
        
        return [
            DepartmentResponse.model_validate(department) 
            for department in departments
        ]
    except Exception:
        logger.error(
            "get_all_departments_failed",
            exc_info=True
        )
        raise HTTPException(status_code=422, detail="Failed to get all departments")

@router.post("", response_model=DepartmentResponse)
# @limiter.limit(settings.RATE_LIMIT_ENDPOINTS["create_user"][0])
async def create_department(
    request: Request, 
    data: DepartmentCreate,
    department_service: DepartmentService = Depends(get_department_service),
):
    user_id = request.state.user["id"]
    try:
        department = await department_service.create_department(
            name=data.name, 
            code=data.code, 
            description=data.description, 
            parent_id=data.parent_id, 
            manager_id=data.manager_id
        )
        
        return DepartmentResponse.model_validate(department)
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

@router.get("/{department_id}", response_model=DepartmentResponse)
# @limiter.limit(settings.RATE_LIMIT_ENDPOINTS["create_user"][0])
async def get_department(
    request: Request, 
    department_id: int,
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
        department = await department_service.get_department_by_id(department_id)
        
        return DepartmentResponse.model_validate(department)
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

@router.patch("/{department_id}", response_model=DepartmentResponse)
# @limiter.limit(settings.RATE_LIMIT_ENDPOINTS["create_user"][0])
async def update_department(
    request: Request,
    department_id: int, 
    data: DepartmentUpdate,
    department_service: DepartmentService = Depends(get_department_service),
):
    try:
        department = await department_service.update_department(
            department_id=department_id,
            name=data.name,
            description=data.description,
            parent_id=data.parent_id,
            manager_id=data.manager_id
        )
        
        return DepartmentResponse.model_validate(department)
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

@router.delete("/{department_id}", response_model=DepartmentResponse)
# @limiter.limit(settings.RATE_LIMIT_ENDPOINTS["create_user"][0])
async def delete_department(
    request: Request,
    department_id: int,
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
        department = await department_service.delete_department(department_id=department_id)
        
        return DepartmentResponse.model_validate(department)
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
