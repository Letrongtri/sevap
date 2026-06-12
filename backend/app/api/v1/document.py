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
from app.schemas import (
    DocumentResponse, 
    DocumentUpdate,
    DocumentQuery,
    DocumentPaginatedResponse,
    PaginationQuery
)
from app.dependencies import get_document_service
from app.core.logging import logger
from app.core.enum import AccessLevel

router = APIRouter()

@router.post("", response_model=DocumentResponse)
# @limiter.limit(settings.RATE_LIMIT_ENDPOINTS["upload_document"][0])
async def upload_document(
    request: Request,
    background_tasks: BackgroundTasks,
    file: UploadFile = File(...),
    access_level: AccessLevel = Form(..., description="Document's access level"),
    department_ids: List[int] | None = Form(None, description="Document's department scopes"),
    title: str | None = Form(None, description="Document's title"),
    category: str | None = Form(None, description="Document's category"),
    target_user_ids: List[int] | None = Form(None, description="Document's target user ids"),
    effective_date: datetime | None = Form(None, description="Document's effective date"),
    role_access: List[int] | None = Form(None, description="User's role to access document"),
    document_service: DocumentService = Depends(get_document_service),
):
    if not file.filename.endswith(".docx"):
        raise HTTPException(status_code=400, detail="File must be a docx file")
    
    try:
        user_id = request.state.user["id"]
        document = await document_service.upload(
            file=file,
            uploader_id=int(user_id),
            access_level=access_level,
            department_ids=department_ids,
            title=title,
            category=category,
            target_user_ids=target_user_ids,
            effective_date=effective_date,
            role_access=role_access,
            background_tasks=background_tasks
        )
        
        return DocumentResponse.model_validate(document)
    except NotFoundError:
        logger.error("document_role_access_not_found", role_access=role_access)
        raise HTTPException(status_code=404, detail="Document role access not found")
    except Exception:
        logger.error(
            "upload_document_failed", 
            document_name=file.filename, 
            exc_info=True
        )
        raise HTTPException(status_code=422, detail="Failed to upload document")

@router.get("", response_model=DocumentPaginatedResponse)
# @limiter.limit(settings.RATE_LIMIT_ENDPOINTS["create_user"][0])
async def get_all_documents(
    request: Request,
    query: Annotated[DocumentQuery, Depends()],
    pagination: Annotated[PaginationQuery, Depends()],
    document_service: DocumentService = Depends(get_document_service),
):
    try:
        return await document_service.get_all_documents(query, pagination)
    except Exception:
        logger.error(
            "get_all_documents_failed",
            query=query,
            pagination=pagination,
            exc_info=True
        )
        raise HTTPException(status_code=422, detail="Failed to get all documents")

@router.get("/{document_id}", response_model=DocumentResponse)
# @limiter.limit(settings.RATE_LIMIT_ENDPOINTS["create_user"][0])
async def get_document(
    request: Request, 
    document_id: int,
    document_service: DocumentService = Depends(get_document_service),
):
    try:
        document = await document_service.get_document_by_id(document_id)
        
        return DocumentResponse.model_validate(document)
    except NotFoundError:
        logger.error("document_not_found", document_id=document_id)
        raise HTTPException(status_code=404, detail="Document not found")
    except Exception:
        logger.error(
            "get_document_failed",
            document_id=document_id,
            exc_info=True
        )
        raise HTTPException(status_code=422, detail="Failed to get document")

@router.get("/{document_id}/file")
async def get_document_file(
    document_id: int,
    document_service: DocumentService = Depends(get_document_service),
):
    try:
        document = await document_service.get_document_by_id(document_id)
        if not document.file_path or not Path(document.file_path).exists():
            raise HTTPException(status_code=404, detail="File not found on disk")
        
        media_type = document.file_type or "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
        print(document.file_name)
        print(document.title)
        print(document.file_path)
        print(document.file_type)
        print(media_type)
        print("-----------------")
        return FileResponse(
            path=document.file_path,
            media_type=media_type,
            filename=document.file_name
        )
    except NotFoundError:
        raise HTTPException(status_code=404, detail="Document not found")
    except Exception:
        logger.error("get_document_file_failed", document_id=document_id, exc_info=True)
        raise HTTPException(status_code=500, detail="Failed to retrieve document file")

@router.put("/{document_id}", response_model=DocumentResponse)
# @limiter.limit(settings.RATE_LIMIT_ENDPOINTS["upload_document"][0])
async def update_document(
    request: Request,
    document_id: int,
    data: DocumentUpdate,
    document_service: DocumentService = Depends(get_document_service),
):
    try:
        user_id = request.state.user["id"]
        document = await document_service.update_document(
            document_id=document_id,
            access_level=data.access_level,
            department_ids=data.department_ids,
            title=data.title,
            category=data.category,
            role_access=data.role_access,
            effective_date=data.effective_date,
            target_user_ids=data.target_user_ids
        )
        
        return DocumentResponse.model_validate(document)
    except Exception:
        logger.error(
            "upload_document_failed", 
            document_id=document_id, 
            exc_info=True
        )
        raise HTTPException(status_code=422, detail="Failed to upload document")

@router.delete("/{document_id}", response_model=DocumentResponse)
# @limiter.limit(settings.RATE_LIMIT_ENDPOINTS["create_user"][0])
async def delete_document(
    request: Request,
    document_id: int,
    document_service: DocumentService = Depends(get_document_service),
):
    try:
        document = await document_service.delete_document(document_id=document_id)
        
        return DocumentResponse.model_validate(document)
    except NotFoundError:
        logger.error("deleted_document_not_found", document_id=document_id)
        raise HTTPException(status_code=404, detail="Document not found")
    except Exception:
        logger.error(
            "delete_document_failed", 
            document_id=document_id, 
            exc_info=True
        )
        raise HTTPException(status_code=422, detail="Failed to delete document")
