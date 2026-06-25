from typing import Annotated
from typing import List

from fastapi import APIRouter, Depends, HTTPException, Request, BackgroundTasks

from app.dependencies import get_job_title_service, check_permission
from app.schemas import (
    JobTitleCreate, JobTitleResponse, JobTitleUpdate, JobTitleSimple,
    JobTitlePaginatedResponse, JobTitleQuery, PaginationQuery
)
from app.services import JobTitleService, NotFoundError, JobTitleAlreadyExistsError
from app.decorators import log_activity
from app.core.logging import logger
from app.core.enum import PermissionAction, PermissionResource


router = APIRouter()

@router.get(
    "", 
    response_model=JobTitlePaginatedResponse,
    dependencies=[Depends(check_permission(
        PermissionResource.JOB_TITLES, PermissionAction.READ
    ))]
)
# @limiter.limit(settings.RATE_LIMIT_ENDPOINTS["create_user"][0])
async def get_all_job_titles(
    request: Request,
    query: Annotated[JobTitleQuery, Depends()],
    pagination: Annotated[PaginationQuery, Depends()],
    job_title_service: JobTitleService = Depends(get_job_title_service),
):
    try:
        tenant_id = request.state.tenant_id
        return await job_title_service.get_all_job_titles(tenant_id, query, pagination)
    except Exception:
        logger.error(
            "get_all_job_titles_failed",
            exc_info=True
        )
        raise HTTPException(status_code=422, detail="Failed to get all job_titles")

@router.post(
    "", 
    response_model=JobTitleResponse,
    dependencies=[Depends(check_permission(
        PermissionResource.JOB_TITLES, PermissionAction.CREATE
    ))]
)
@log_activity(
    action="job_title.create",
    resource="job_title",
    meta_extractor=lambda res, *args, **kwargs: {
        "job_title_id": res.id,
        "job_title_name": res.title_name
    }
)
# @limiter.limit(settings.RATE_LIMIT_ENDPOINTS["create_user"][0])
async def create_job_title(
    request: Request, 
    data: JobTitleCreate,
    background_tasks: BackgroundTasks,
    job_title_service: JobTitleService = Depends(get_job_title_service),
):
    try:
        tenant_id = request.state.tenant_id
        return await job_title_service.create_job_title(tenant_id, data)
    except JobTitleAlreadyExistsError:
        logger.error("job_title_already_exists", job_title_name=data.title_name)
        raise HTTPException(status_code=409, detail="Job title already exists")
    except Exception:
        logger.error(
            "create_job_title_failed", 
            job_title_name=data.title_name, 
            exc_info=True
        )
        raise HTTPException(status_code=422, detail="Failed to create job title")

@router.get(
    "/simple", 
    response_model=List[JobTitleSimple],
    dependencies=[Depends(check_permission(
        PermissionResource.JOB_TITLES, PermissionAction.READ
    ))]
)
# @limiter.limit(settings.RATE_LIMIT_ENDPOINTS["create_user"][0])
async def get_all_simple_job_titles(
    request: Request,
    job_title_service: JobTitleService = Depends(get_job_title_service),
):
    try:
        tenant_id = request.state.tenant_id
        return await job_title_service.get_all_simple_job_titles(tenant_id)
    except Exception:
        logger.error(
            "get_all_simple_job_titles_failed",
            exc_info=True
        )
        raise HTTPException(status_code=422, detail="Failed to get all job_titles")

@router.get(
    "/{job_title_id}", 
    response_model=JobTitleResponse,
    dependencies=[Depends(check_permission(
        PermissionResource.JOB_TITLES, PermissionAction.READ
    ))]
)
# @limiter.limit(settings.RATE_LIMIT_ENDPOINTS["create_user"][0])
async def get_job_title(
    request: Request, 
    job_title_id: str,
    job_title_service: JobTitleService = Depends(get_job_title_service),
):
    """ Get a job_title detail.

    Args:
        request: The FastAPI request object for rate limiting.
        job_title_id: job_title's id

    Returns:
        JobTitleResponse: job_title detail
    """
    try:
        tenant_id = request.state.tenant_id
        return await job_title_service.get_job_title_by_id(tenant_id, job_title_id)
    except NotFoundError:
        logger.error("job_title_not_found", job_title_id=job_title_id)
        raise HTTPException(status_code=404, detail="job_title not found")
    except Exception:
        logger.error(
            "get_job_title_failed",
            job_title_id=job_title_id,
            exc_info=True
        )
        raise HTTPException(status_code=422, detail="Failed to get job_title")

@router.patch(
    "/{job_title_id}", 
    response_model=JobTitleResponse,
    dependencies=[Depends(check_permission(
        PermissionResource.JOB_TITLES, PermissionAction.UPDATE
    ))]
)
@log_activity(
    action="job_title.update",
    resource="job_title",
    meta_extractor=lambda res, *args, **kwargs: {
        "job_title_id": kwargs.get("job_title_id"),
        "job_title_name": res.title_name
    }
)
# @limiter.limit(settings.RATE_LIMIT_ENDPOINTS["create_user"][0])
async def update_job_title(
    request: Request,
    job_title_id: str, 
    data: JobTitleUpdate,
    background_tasks: BackgroundTasks,
    job_title_service: JobTitleService = Depends(get_job_title_service),
):
    try:
        tenant_id = request.state.tenant_id
        return await job_title_service.update_job_title(
            tenant_id, 
            job_title_id, 
            data
        )
    except NotFoundError:
        logger.error("updated_job_title_not_found", job_title_id=job_title_id)
        raise HTTPException(status_code=404, detail="Job title not found")
    except Exception:
        logger.error(
            "update_job_title_failed", 
            job_title_id=job_title_id, 
            exc_info=True
        )
        raise HTTPException(status_code=422, detail="Failed to update job title")

@router.delete(
    "/{job_title_id}", 
    response_model=JobTitleResponse,
    dependencies=[Depends(check_permission(
        PermissionResource.JOB_TITLES, PermissionAction.DELETE
    ))]
)
@log_activity(
    action="job_title.delete",
    resource="job_title",
    meta_extractor=lambda res, *args, **kwargs: {
        "job_title_id": kwargs.get("job_title_id"),
        "job_title_name": res.title_name
    }
)
# @limiter.limit(settings.RATE_LIMIT_ENDPOINTS["create_user"][0])
async def delete_job_title(
    request: Request,
    job_title_id: str,
    background_tasks: BackgroundTasks,
    job_title_service: JobTitleService = Depends(get_job_title_service),
):
    """Delete custom job_title.

    Args:
        request: The FastAPI request object for rate limiting.
        job_title_id: Custom job_title's id

    Returns:
        JobTitleResponse: Deleted job_title information
    """
    try:
        tenant_id = request.state.tenant_id
        return await job_title_service.delete_job_title(
            tenant_id, 
            job_title_id
        )
    except NotFoundError:
        logger.error("deleted_job_title_not_found", job_title_id=job_title_id)
        raise HTTPException(status_code=404, detail="Job title not found")
    except Exception:
        logger.error(
            "delete_job_title_failed", 
            job_title_id=job_title_id, 
            exc_info=True
        )
        raise HTTPException(status_code=422, detail="Failed to delete job title")
