from fastapi.responses import StreamingResponse
from typing import List

from fastapi import APIRouter, Depends, HTTPException, Request

from app.dependencies import get_conversation_service, get_message_service
from app.schemas import ConversationResponse, ConversationDetailResponse, ConversationUpdate, MessageSend, MessageResponse
from app.services import ConversationService, MessageService, NotFoundError, InternalError
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

# POST /message
# Nhận câu hỏi ->
# tạo cuộc hội thoại mới (nếu chưa có) ->
# thêm câu hỏi vào cuộc hội thoại ->
# stream câu trả lời từ AI brain token-by-token
@router.post("/message")
# @limiter.limit(settings.RATE_LIMIT_ENDPOINTS["create_user"][0])
async def send_message(
    request: Request,
    data: MessageSend,
    message_service: MessageService = Depends(get_message_service),
):
    user_id: int | None = None
    try:
        user_id = int(request.state.user["id"])
        stream_generator = message_service.stream_message_response(
            user_id=user_id,
            content=data.content,
            conversation_id=data.conversation_id,
        )

        return StreamingResponse(
            stream_generator,
            media_type="text/event-stream",
            headers={
                # Prevent proxy / CDN buffering
                "Cache-Control": "no-cache",
                "X-Accel-Buffering": "no",
                "Connection": "keep-alive",
            },
        )
    except Exception:
        logger.error(
            "send_message_failed",
            user_id=user_id,
            exc_info=True,
        )
        raise HTTPException(status_code=422, detail="Failed to send message")


@router.get("/{conversation_id}", response_model=ConversationDetailResponse)
# @limiter.limit(settings.RATE_LIMIT_ENDPOINTS["create_user"][0])
async def get_conversation(
    request: Request, 
    conversation_id: int,
    conversation_service: ConversationService = Depends(get_conversation_service),
):
    try:
        conversation, messages = await conversation_service.get_conversation_by_id(
            conversation_id=conversation_id,
            get_messages=True
        )

        return ConversationDetailResponse(
            id=conversation.id,
            user_id=conversation.user_id,
            title=conversation.title,
            is_deleted=conversation.is_deleted,
            created_at=conversation.created_at,
            updated_at=conversation.updated_at,
            messages=[
                MessageResponse.model_validate(m) for m in messages
            ],
        )
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

@router.get("/{conversation_id}/messages", response_model=List[MessageResponse])
# @limiter.limit(settings.RATE_LIMIT_ENDPOINTS["create_user"][0])
async def get_messages_by_conversation_id(
    request: Request,
    conversation_id: int,
    limit: int = 20,
    last_id: int | None = None,
    message_service: MessageService = Depends(get_message_service),
):
    try:
        messages = await message_service.get_messages_by_conversation_id(
            conversation_id=conversation_id,
            last_id=last_id,
            limit=limit,
        )
        
        return [
            MessageResponse.model_validate(message) 
            for message in messages
        ]
    except NotFoundError:
        logger.error("messages_not_found", conversation_id=conversation_id)
        raise HTTPException(status_code=404, detail="Messages not found")
    except InternalError:
        logger.error(
            "get_messages_failed", 
            conversation_id=conversation_id, 
            exc_info=True
        )
        raise HTTPException(status_code=500, detail="Failed to get messages")

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
