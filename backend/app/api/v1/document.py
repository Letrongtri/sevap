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

from app.services.document_service import DocumentService
from app.schemas.document_schema import (
    DocumentResponse, 
)
from app.dependencies.document import get_document_service
from app.core.logging import logger

router = APIRouter()

@router.post("", response_model=DocumentResponse)
# @limiter.limit(settings.RATE_LIMIT_ENDPOINTS["upload_document"][0])
async def upload_document(
    request: Request,
    background_tasks: BackgroundTasks,
    file: UploadFile = File(...),
    access_level: str = Form(..., description="Document's access level"),
    department_scope: str | None = Form(None, description="Document's department scope"),
    title: str | None = Form(None, description="Document's title"),
    category: str | None = Form(None, description="Document's category"),
    effective_date: datetime | None = Form(None, description="Document's effective date"),
    document_service: DocumentService = Depends(get_document_service),
):
    if not file.filename.endswith(".docx"):
        raise HTTPException(status_code=400, detail="File must be a docx file")
    
    valid_levels = ["public", "private", "managerial"]
    if access_level not in valid_levels:
        raise HTTPException(status_code=400, detail="Invalid access level")
    
    try:
        document = await document_service.upload(
            file=file,
            access_level=access_level,
            department_scope=department_scope,
            title=title,
            category=category,
            effective_date=effective_date,
            background_tasks=background_tasks
        )
        
        return DocumentResponse.model_validate(document)
    except Exception:
        logger.error(
            "upload_document_failed", 
            document_name=file.filename, 
            exc_info=True
        )
        raise HTTPException(status_code=422, detail="Failed to upload document")
