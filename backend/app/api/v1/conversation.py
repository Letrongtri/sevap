from typing import List

from fastapi import APIRouter, Depends, HTTPException, Request

from app.dependencies.conversation import get_conversation_service
from app.schemas.conversation_schema import ConversationCreate, ConversationResponse, ConversationUpdate
from app.services.conversation_service import ConversationService
from app.core.logging import logger
from app.services.exceptions import NotFoundError


router = APIRouter()

@router.get("", response_model=List[ConversationResponse])
# @limiter.limit(settings.RATE_LIMIT_ENDPOINTS["create_user"][0])
async def get_all_conversations(
    request: Request,
    conversation_service: ConversationService = Depends(get_conversation_service),
):
    try:
        conversations = await conversation_service.get_all_conversations()
        
        return [
            ConversationResponse.model_validate(conversation) 
            for conversation in conversations
        ]
    except Exception:
        logger.error(
            "get_all_conversations_failed",
            exc_info=True
        )
        raise HTTPException(status_code=422, detail="Failed to get all conversations")

@router.post("", response_model=ConversationResponse)
# @limiter.limit(settings.RATE_LIMIT_ENDPOINTS["create_user"][0])
async def create_conversation(
    request: Request, 
    data: ConversationCreate,
    conversation_service: ConversationService = Depends(get_conversation_service),
):
    user_id = 1 # Lấy từ token: request.user.id
    try:
        conversation = await conversation_service.create_conversation(
            user_id=user_id, 
            title=data.title
        )
        
        return ConversationResponse.model_validate(conversation)
    except Exception:
        logger.error(
            "create_conversation_failed", 
            user_id=user_id, 
            exc_info=True
        )
        raise HTTPException(status_code=422, detail="Failed to create conversation")

@router.get("/{conversation_id}", response_model=ConversationResponse)
# @limiter.limit(settings.RATE_LIMIT_ENDPOINTS["create_user"][0])
async def get_conversation(
    request: Request, 
    conversation_id: int,
    conversation_service: ConversationService = Depends(get_conversation_service),
):
    try:
        conversation = await conversation_service.get_conversation_by_id(conversation_id)
        
        return ConversationResponse.model_validate(conversation)
    except NotFoundError:
        logger.error("conversation_not_found", conversation_id=conversation_id)
        raise HTTPException(status_code=404, detail="Conversation not found")
    except Exception:
        logger.error(
            "get_conversation_failed",
            conversation_id=conversation_id,
            exc_info=True
        )
        raise HTTPException(status_code=422, detail="Failed to get conversation")

@router.patch("/{conversation_id}", response_model=ConversationResponse)
# @limiter.limit(settings.RATE_LIMIT_ENDPOINTS["create_user"][0])
async def update_conversation(
    request: Request,
    conversation_id: int, 
    data: ConversationUpdate,
    conversation_service: ConversationService = Depends(get_conversation_service),
):
    try:
        conversation = await conversation_service.update_conversation(
            conversation_id=conversation_id,
            title=data.title
        )
        
        return ConversationResponse.model_validate(conversation)
    except NotFoundError:
        logger.error("updated_conversation_not_found", conversation_id=conversation_id)
        raise HTTPException(status_code=404, detail="Conversation not found")
    except Exception:
        logger.error(
            "update_conversation_failed", 
            conversation_id=conversation_id, 
            exc_info=True
        )
        raise HTTPException(status_code=422, detail="Failed to update conversation")

@router.delete("/{conversation_id}", response_model=ConversationResponse)
# @limiter.limit(settings.RATE_LIMIT_ENDPOINTS["create_user"][0])
async def delete_conversation(
    request: Request,
    conversation_id: int,
    conversation_service: ConversationService = Depends(get_conversation_service),
):
    try:
        conversation = await conversation_service.delete_conversation(conversation_id=conversation_id)
        
        return ConversationResponse.model_validate(conversation)
    except NotFoundError:
        logger.error("deleted_conversation_not_found", conversation_id=conversation_id)
        raise HTTPException(status_code=404, detail="Conversation not found")
    except Exception:
        logger.error(
            "delete_conversation_failed", 
            conversation_id=conversation_id, 
            exc_info=True
        )
        raise HTTPException(status_code=422, detail="Failed to delete conversation")
