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
from typing import List
from datetime import datetime

from app.services import DocumentService, NotFoundError
from app.schemas import (
    DocumentResponse, 
    DocumentUpdate
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
    department_id: int | None = Form(None, description="Document's department scope"),
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
            department_id=department_id,
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

@router.get("", response_model=List[DocumentResponse])
# @limiter.limit(settings.RATE_LIMIT_ENDPOINTS["create_user"][0])
async def get_all_documents(
    request: Request,
    document_service: DocumentService = Depends(get_document_service),
):
    try:
        documents = await document_service.get_documents()
        
        return [
            DocumentResponse.model_validate(document) 
            for document in documents
        ]
    except Exception:
        logger.error(
            "get_all_documents_failed", 
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

@router.put("/{document_id}", response_model=DocumentResponse)
# @limiter.limit(settings.RATE_LIMIT_ENDPOINTS["upload_document"][0])
async def update_document(
    request: Request,
    document_id: int,
    data: DocumentUpdate,
    document_service: DocumentService = Depends(get_document_service),
):
    try:
        document = await document_service.update_document(
            document_id=document_id,
            access_level=data.access_level,
            department_id=data.department_id,
            title=data.title,
            category=data.category,
            role_access=data.role_access,
            effective_date=data.effective_date,
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
