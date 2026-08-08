from typing import Annotated
from fastapi import APIRouter, HTTPException, Depends, Request, BackgroundTasks

from app.services import PromptTemplateService, NotFoundError
from app.schemas import (
    PromptTemplateCreate, PromptTemplateResponse, PromptTemplateUpdate,
    PromptTemplateQuery, PromptTemplatePaginatedResponse, PaginationQuery
)
from app.dependencies import get_prompt_template_service, check_permission
from app.decorators import log_activity
from app.core.logging import logger
from app.core.config import settings
from app.core.limiter import limiter
from app.core.enum import PermissionAction, PermissionResource

router = APIRouter()

@router.get(
    "", 
    response_model=PromptTemplatePaginatedResponse,
    dependencies=[Depends(check_permission(
        PermissionResource.PROMPT_TEMPLATES, PermissionAction.READ
    ))]
)
@limiter.limit(settings.RATE_LIMIT_ENDPOINTS["create_user"][0])
async def get_all_prompt_templates(
    request: Request,
    query: Annotated[PromptTemplateQuery, Depends()],
    pagination: Annotated[PaginationQuery, Depends()],
    prompt_template_service: PromptTemplateService = Depends(get_prompt_template_service),
):
    try:
        tenant_id = request.state.tenant_id
        return await prompt_template_service.get_all_prompt_templates(tenant_id, query, pagination)
    except Exception:
        logger.error(
            "get_all_prompt_templates_failed",
            exc_info=True
        )
        raise HTTPException(status_code=422, detail="Failed to get all roles")

@router.post(
    "", 
    response_model=PromptTemplateResponse,
    dependencies=[Depends(check_permission(
        PermissionResource.PROMPT_TEMPLATES, PermissionAction.CREATE
    ))]
)
@log_activity(
    action="prompt_template.create",
    resource="prompt_template",
    meta_extractor=lambda res, *args, **kwargs: {
        "prompt_template_id": res.id, 
        "prompt_template_type": res.type
    }
)
@limiter.limit(settings.RATE_LIMIT_ENDPOINTS["create_user"][0])
async def create_prompt_template(
    request: Request, 
    data: PromptTemplateCreate,
    background_tasks: BackgroundTasks,
    prompt_template_service: PromptTemplateService = Depends(get_prompt_template_service),
):
    try:
        tenant_id = request.state.tenant_id
        user_id = request.state.user["id"]
        return await prompt_template_service.create_prompt_template(tenant_id, user_id, data)
    except Exception:
        logger.error(
            "create_prompt_template_failed", 
            prompt_template_type=data.type, 
            exc_info=True
        )
        raise HTTPException(status_code=422, detail="Failed to create prompt template")

@router.get(
    "/{prompt_template_id}", 
    response_model=PromptTemplateResponse,
    dependencies=[Depends(check_permission(
        PermissionResource.PROMPT_TEMPLATES, PermissionAction.READ
    ))]
)
@limiter.limit(settings.RATE_LIMIT_ENDPOINTS["create_user"][0])
async def get_prompt_template(
    request: Request, 
    prompt_template_id: str,
    prompt_template_service: PromptTemplateService = Depends(get_prompt_template_service),
):
    """ Get a prompt template detail.

    Args:
        request: The FastAPI request object for rate limiting.
        prompt_template_id: Prompt template's id

    Returns:
        PromptTemplateResponse: Prompt template detail
    """
    try:
        tenant_id = request.state.tenant_id
        return await prompt_template_service.get_prompt_template_by_id(tenant_id, prompt_template_id)
    except NotFoundError:
        logger.error("prompt_template_not_found", prompt_template_id=prompt_template_id)
        raise HTTPException(status_code=404, detail="Prompt template not found")
    except Exception:
        logger.error(
            "get_prompt_template_failed",
            prompt_template_id=prompt_template_id,
            exc_info=True
        )
        raise HTTPException(status_code=422, detail="Failed to get prompt template")

@router.put(
    "/{prompt_template_id}", 
    response_model=PromptTemplateResponse,
    dependencies=[Depends(check_permission(
        PermissionResource.PROMPT_TEMPLATES, PermissionAction.UPDATE
    ))]
)
@log_activity(
    action="prompt_template.update",
    resource="prompt_template",
    meta_extractor=lambda res, *args, **kwargs: {
        "prompt_template_id": kwargs.get("prompt_template_id"),
        "prompt_template_type": res.type
    }
)
@limiter.limit(settings.RATE_LIMIT_ENDPOINTS["create_user"][0])
async def update_prompt_template(
    request: Request,
    prompt_template_id: str, 
    data: PromptTemplateUpdate,
    background_tasks: BackgroundTasks,
    prompt_template_service: PromptTemplateService = Depends(get_prompt_template_service),
):
    try:
        tenant_id = request.state.tenant_id
        return await prompt_template_service.update_prompt_template(tenant_id, prompt_template_id, data)
    except NotFoundError:
        logger.error("updated_prompt_template_not_found", prompt_template_id=prompt_template_id)
        raise HTTPException(status_code=404, detail="Prompt template not found")
    except Exception:
        logger.error(
            "update_prompt_template_failed", 
            prompt_template_id=prompt_template_id, 
            exc_info=True
        )
        raise HTTPException(status_code=422, detail="Failed to update prompt template")

@router.patch(
    "/{prompt_template_id}/toggle", 
    response_model=PromptTemplateResponse,
    dependencies=[Depends(check_permission(
        PermissionResource.PROMPT_TEMPLATES, PermissionAction.UPDATE
    ))]
)
@log_activity(
    action="prompt_template.toggle_status",
    resource="prompt_template",
    meta_extractor=lambda res, *args, **kwargs: {
        "prompt_template_id": kwargs.get("prompt_template_id"),
        "prompt_template_type": res.type
    }
)
@limiter.limit(settings.RATE_LIMIT_ENDPOINTS["create_user"][0])
async def toggle_prompt_template_status(
    request: Request,
    prompt_template_id: str, 
    background_tasks: BackgroundTasks,
    prompt_template_service: PromptTemplateService = Depends(get_prompt_template_service),
):
    try:
        tenant_id = request.state.tenant_id
        return await prompt_template_service.toggle_prompt_template_status(tenant_id, prompt_template_id)
    except NotFoundError:
        logger.error("toggle_prompt_template_status_not_found", prompt_template_id=prompt_template_id)
        raise HTTPException(status_code=404, detail="Prompt template not found")
    except Exception:
        logger.error(
            "toggle_prompt_template_status_failed", 
            prompt_template_id=prompt_template_id, 
            exc_info=True
        )
        raise HTTPException(status_code=422, detail="Failed to toggle prompt template status")

@router.delete(
    "/{prompt_template_id}", 
    response_model=PromptTemplateResponse,
    dependencies=[Depends(check_permission(
        PermissionResource.PROMPT_TEMPLATES, PermissionAction.DELETE
    ))]
)
@log_activity(
    action="prompt_template.delete",
    resource="prompt_template",
    meta_extractor=lambda res, *args, **kwargs: {
        "prompt_template_id": kwargs.get("prompt_template_id"), 
        "prompt_template_type": res.type
    }
)
@limiter.limit(settings.RATE_LIMIT_ENDPOINTS["create_user"][0])
async def delete_prompt_template(
    request: Request,
    prompt_template_id: str,
    background_tasks: BackgroundTasks,
    prompt_template_service: PromptTemplateService = Depends(get_prompt_template_service),
):
    """Delete prompt template.

    Args:
        request: The FastAPI request object for rate limiting.
        prompt_template_id: Prompt template's id

    Returns:
        PromptTemplateResponse: Deleted prompt template information
    """
    try:
        tenant_id = request.state.tenant_id
        return await prompt_template_service.delete_prompt_template(tenant_id, prompt_template_id)
    except NotFoundError:
        logger.error("deleted_prompt_template_not_found", prompt_template_id=prompt_template_id)
        raise HTTPException(status_code=404, detail="Prompt template not found")
    except Exception:
        logger.error(
            "delete_prompt_template_failed", 
            prompt_template_id=prompt_template_id, 
            exc_info=True
        )
        raise HTTPException(status_code=422, detail="Failed to delete prompt template")
