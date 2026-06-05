from typing import List

from fastapi import APIRouter, Depends, HTTPException, Request

from app.dependencies import get_conversation_service, get_message_service
from app.schemas import ConversationCreate, ConversationResponse, ConversationUpdate, MessageSend
from app.services import ConversationService, MessageService, NotFoundError
from app.core.logging import logger


router = APIRouter()

@router.get("", response_model=List[ConversationResponse])
# @limiter.limit(settings.RATE_LIMIT_ENDPOINTS["create_user"][0])
async def get_all_personal_conversations(
    request: Request,
    conversation_service: ConversationService = Depends(get_conversation_service),
):
    try:
        user_id = request.state.user["id"]
        conversations = await conversation_service.get_all_conversations_by_user_id(
            user_id=int(user_id)
        )
        
        return [
            ConversationResponse.model_validate(conversation) 
            for conversation in conversations
        ]
    except Exception:
        logger.error(
            "get_all_personal_conversations_failed",
            exc_info=True
        )
        raise HTTPException(status_code=422, detail="Failed to get all personal conversations")

@router.post("", response_model=ConversationResponse)
# @limiter.limit(settings.RATE_LIMIT_ENDPOINTS["create_user"][0])
async def create_conversation(
    request: Request, 
    data: ConversationCreate,
    conversation_service: ConversationService = Depends(get_conversation_service),
):
    user_id = request.state.user["id"]
    try:
        conversation = await conversation_service.create_conversation(
            user_id=int(user_id), 
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

@router.post("/{conversation_id}/message", response_model=ConversationResponse)
# @limiter.limit(settings.RATE_LIMIT_ENDPOINTS["create_user"][0])
async def add_message_to_conversation(
    request: Request,
    conversation_id: int,
    data: MessageSend,
    message_service: MessageService = Depends(get_message_service),
    conversation_service: ConversationService = Depends(get_conversation_service),
):
    try:
        user_id = request.state.user["id"]
        await message_service.create_user_message(
            user_id=int(user_id),
            conversation_id=conversation_id, 
            content=data.content
        )

        conversation = await conversation_service.get_conversation_by_id(conversation_id)
        
        return ConversationResponse.model_validate(conversation)
    except NotFoundError:
        logger.error("conversation_not_found", conversation_id=conversation_id)
        raise HTTPException(status_code=404, detail="Conversation not found")
    except Exception:
        logger.error(
            "add_message_to_conversation_failed", 
            conversation_id=conversation_id, 
            exc_info=True
        )
        raise HTTPException(status_code=422, detail="Failed to add message to conversation")
