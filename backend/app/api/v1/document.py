from typing import Annotated
from fastapi import (
    APIRouter, 
    HTTPException, 
    Depends, 
    Request, 
    UploadFile,
    File,
    Form,
    BackgroundTasks
)
from fastapi.responses import FileResponse
from pathlib import Path
from typing import List
from datetime import datetime

from app.services import DocumentService, NotFoundError
from app.services.exceptions import MissingRequiredFieldsError, OnProcessingError
from app.schemas import (
    DocumentResponse, 
    DocumentUpdate,
    DocumentQuery,
    DocumentPaginatedResponse,
    PaginationQuery
)
from app.dependencies import get_document_service, check_permission
from app.decorators import log_activity
from app.core.logging import logger
from app.core.config import settings
from app.core.enum import AccessLevel, PermissionAction, PermissionResource

router = APIRouter()

@router.post(
    "",
    response_model=DocumentResponse,
    dependencies=[Depends(check_permission(
        PermissionResource.DOCUMENTS, PermissionAction.UPLOAD
    ))]
)
@log_activity(
    action="document.upload",
    resource="document",
    meta_extractor=lambda res, *args, **kwargs: {
        "document_id": res.id, 
        "title": res.title, 
        "access_level": res.access_level
    }
)
# @limiter.limit(settings.RATE_LIMIT_ENDPOINTS["upload_document"][0])
async def upload_document(
    request: Request,
    background_tasks: BackgroundTasks,
    file: UploadFile = File(...),
    access_level: AccessLevel = Form(..., description="Document's access level"),
    department_ids: List[str] | None = Form(None, description="Document's department scopes"),
    title: str | None = Form(None, description="Document's title"),
    category: str | None = Form(None, description="Document's category"),
    target_user_ids: List[str] | None = Form(None, description="Document's target user ids"),
    effective_date: datetime | None = Form(None, description="Document's effective date"),
    role_access: List[str] | None = Form(None, description="User's role to access document"),
    document_service: DocumentService = Depends(get_document_service),
):
    file_ext = Path(file.filename).suffix.lower() if file.filename else ""
    if file_ext not in settings.ALLOWED_UPLOAD_EXTENSIONS:
        raise HTTPException(
            status_code=400, 
            detail=f"File type '{file_ext}' is not allowed. Accepted: {', '.join(settings.ALLOWED_UPLOAD_EXTENSIONS)}"
        )
    
    user_id = request.state.user["id"]
    tenant_id = request.state.tenant_id

    try:
        return await document_service.upload(
            file=file,
            tenant_id=tenant_id,
            uploader_id=user_id,
            access_level=access_level,
            department_ids=department_ids,
            title=title,
            category=category,
            target_user_ids=target_user_ids,
            effective_date=effective_date,
            role_access=role_access,
            background_tasks=background_tasks
        )
    except MissingRequiredFieldsError:
        raise HTTPException(
            status_code=422,
            detail="Private documents require at least one of: department_ids, role_access, or target_user_ids"
        )
    except OnProcessingError:
        raise HTTPException(
            status_code=409,
            detail="This document is already being processed. Please wait before uploading again."
        )
    except NotFoundError:
        logger.error("document_access_entity_not_found", role_access=role_access, department_ids=department_ids)
        raise HTTPException(status_code=404, detail="Role, department, or user not found")
    except Exception:
        logger.error(
            "upload_document_failed", 
            document_name=file.filename,
            tenant_id=tenant_id,
            exc_info=True
        )
        raise HTTPException(status_code=500, detail="Failed to upload document")

@router.get(
    "", 
    response_model=DocumentPaginatedResponse,
    dependencies=[Depends(check_permission(
        PermissionResource.DOCUMENTS, PermissionAction.READ
    ))]
)
# @limiter.limit(settings.RATE_LIMIT_ENDPOINTS["create_user"][0])
async def get_all_documents(
    request: Request,
    query: Annotated[DocumentQuery, Depends()],
    pagination: Annotated[PaginationQuery, Depends()],
    document_service: DocumentService = Depends(get_document_service),
):
    try:
        tenant_id = request.state.tenant_id
        # TODO: Lấy những tài liệu mà user có quyền đọc
        
        return await document_service.get_all_documents(
            tenant_id, query, pagination
        )
    except Exception:
        logger.error(
            "get_all_documents_failed",
            tenant_id=tenant_id,
            query=query,
            pagination=pagination,
            exc_info=True
        )
        raise HTTPException(status_code=422, detail="Failed to get all documents")

@router.get(
    "/{document_id}", 
    response_model=DocumentResponse,
    dependencies=[Depends(check_permission(
        PermissionResource.DOCUMENTS, PermissionAction.READ
    ))]
)
# @limiter.limit(settings.RATE_LIMIT_ENDPOINTS["create_user"][0])
async def get_document(
    request: Request, 
    document_id: str,
    document_service: DocumentService = Depends(get_document_service),
):
    try:
        tenant_id = request.state.tenant_id
        return await document_service.get_document_by_id(
            tenant_id, document_id
        )
    except NotFoundError:
        logger.error(
            "document_not_found",
            tenant_id=tenant_id,
            document_id=document_id
        )
        raise HTTPException(status_code=404, detail="Document not found")
    except Exception:
        logger.error(
            "get_document_failed",
            tenant_id=tenant_id,
            document_id=document_id,
            exc_info=True
        )
        raise HTTPException(status_code=422, detail="Failed to get document")

@router.get(
    "/{document_id}/file",
    dependencies=[Depends(check_permission(
        PermissionResource.DOCUMENTS, PermissionAction.DOWNLOAD
    ))]
)
async def get_document_file(
    request: Request, 
    document_id: str,
    document_service: DocumentService = Depends(get_document_service),
):
    try:
        tenant_id = request.state.tenant_id
        document = await document_service.get_document_by_id(
            tenant_id, document_id
        )
        if not document.file_path or not Path(document.file_path).exists():
            logger.error(
                "file_not_found",
                tenant_id=tenant_id,
                document_id=document_id,
                file_path=document.file_path
            )
            raise HTTPException(status_code=404, detail="File not found on disk")
        
        media_type = document.file_type or "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
        return FileResponse(
            path=document.file_path,
            media_type=media_type,
            filename=document.file_name
        )
    except NotFoundError:
        logger.error(
            "document_not_found",
            tenant_id=tenant_id,
            document_id=document_id
        )
        raise HTTPException(status_code=404, detail="Document not found")
    except Exception:
        logger.error(
            "get_document_file_failed",
            tenant_id=tenant_id,
            document_id=document_id,
            exc_info=True
        )
        raise HTTPException(status_code=500, detail="Failed to retrieve document file")

@router.put(
    "/{document_id}", 
    response_model=DocumentResponse,
    dependencies=[Depends(check_permission(
        PermissionResource.DOCUMENTS, PermissionAction.UPDATE
    ))]
)
@log_activity(
    action="document.update",
    resource="document",
    meta_extractor=lambda res, *args, **kwargs: {
        "document_id": kwargs.get("document_id"), 
        "title": res.title
    }
)
# @limiter.limit(settings.RATE_LIMIT_ENDPOINTS["upload_document"][0])
async def update_document(
    request: Request,
    document_id: str,
    data: DocumentUpdate,
    background_tasks: BackgroundTasks,
    document_service: DocumentService = Depends(get_document_service),
):
    try:
        tenant_id = request.state.tenant_id
        return await document_service.update_document(
            tenant_id=tenant_id,
            document_id=document_id,
            access_level=data.access_level,
            department_ids=data.department_ids,
            title=data.title,
            category=data.category,
            role_access=data.role_access,
            effective_date=data.effective_date,
            target_user_ids=data.target_user_ids
        )
    except Exception:
        logger.error(
            "upload_document_failed",
            tenant_id=tenant_id,
            document_id=document_id,
            exc_info=True
        )
        raise HTTPException(status_code=422, detail="Failed to upload document")

@router.delete(
    "/{document_id}", 
    response_model=DocumentResponse,
    dependencies=[Depends(check_permission(
        PermissionResource.DOCUMENTS, PermissionAction.DELETE
    ))]
)
@log_activity(
    action="document.delete",
    resource="document",
    meta_extractor=lambda res, *args, **kwargs: {
        "document_id": kwargs.get("document_id"), 
        "title": res.title
    }
)
# @limiter.limit(settings.RATE_LIMIT_ENDPOINTS["create_user"][0])
async def delete_document(
    request: Request,
    document_id: str,
    background_tasks: BackgroundTasks,
    document_service: DocumentService = Depends(get_document_service),
):
    try:
        tenant_id = request.state.tenant_id
        return await document_service.delete_document(
            tenant_id=tenant_id,
            document_id=document_id
        )
    except NotFoundError:
        logger.error(
            "deleted_document_not_found",
            tenant_id=tenant_id,
            document_id=document_id
        )
        raise HTTPException(status_code=404, detail="Document not found")
    except Exception:
        logger.error(
            "delete_document_failed", 
            document_id=document_id, 
            exc_info=True
        )
        raise HTTPException(status_code=422, detail="Failed to delete document")
