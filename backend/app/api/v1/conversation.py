from typing import Annotated
from fastapi.responses import StreamingResponse
from typing import List

from fastapi import APIRouter, Depends, HTTPException, Request, BackgroundTasks

from app.core.enum import PermissionAction, PermissionResource
from app.dependencies import (
    check_permission, 
    get_conversation_service, 
    get_message_service
)
from app.schemas import (
    ConversationPaginatedResponse, PaginationQuery, ConversationQuery,
    ConversationResponse, ConversationDetailResponse, 
    ConversationUpdate, MessageSend, MessageResponse
)
from app.services import (
    ConversationService, MessageService, 
    NotFoundError, InternalError
)
from app.decorators import log_activity
from app.core.logging import logger


router = APIRouter()

@router.get(
    "",
    response_model=ConversationPaginatedResponse,
    dependencies=[Depends(check_permission(
        PermissionResource.CONVERSATIONS, PermissionAction.READ
    ))]
)
# @limiter.limit(settings.RATE_LIMIT_ENDPOINTS["create_user"][0])
async def get_all_personal_conversations(
    request: Request,
    query: Annotated[ConversationQuery, Depends()],
    pagination: Annotated[PaginationQuery, Depends()],
    conversation_service: ConversationService = Depends(get_conversation_service),
):
    try:
        user_id = request.state.user["id"]
        tenant_id = request.state.tenant_id
        return await (
            conversation_service.get_all_conversations_by_user_id(
                tenant_id, user_id, query, pagination
            )
        )
    except Exception:
        logger.error(
            "get_all_personal_conversations_failed",
            user_id=user_id,
            exc_info=True
        )
        raise HTTPException(
            status_code=422,
            detail="Failed to get all personal conversations"
        )

# POST /message
# Nhận câu hỏi ->
# tạo cuộc hội thoại mới (nếu chưa có) ->
# thêm câu hỏi vào cuộc hội thoại ->
# stream câu trả lời từ AI brain token-by-token
@router.post(
    "/message",
    dependencies=[Depends(check_permission(
        PermissionResource.CONVERSATIONS, PermissionAction.SEND
    ))]
)
@log_activity(
    action="chat.message_sent",
    resource="conversation",
    meta_extractor=lambda res, *args, **kwargs: {
        "conversation_id": kwargs.get("data").conversation_id,
        "prompt_length": len(kwargs.get("data").content)
    }
)
# @limiter.limit(settings.RATE_LIMIT_ENDPOINTS["create_user"][0])
async def send_message(
    request: Request,
    data: MessageSend,
    background_tasks: BackgroundTasks,
    message_service: MessageService = Depends(get_message_service),
):
    user_id: str | None = None
    try:
        user_id = request.state.user["id"]
        tenant_id = request.state.tenant_id
        stream_generator = message_service.stream_message_response(
            tenant_id=tenant_id,
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


@router.get(
    "/{conversation_id}",
    response_model=ConversationDetailResponse,
    dependencies=[Depends(check_permission(
        PermissionResource.CONVERSATIONS, PermissionAction.READ
    ))]
)
# @limiter.limit(settings.RATE_LIMIT_ENDPOINTS["create_user"][0])
async def get_conversation(
    request: Request, 
    conversation_id: str,
    conversation_service: ConversationService = Depends(get_conversation_service),
):
    try:
        tenant_id = request.state.tenant_id
        return await (
            conversation_service.get_conversation_by_id(
                tenant_id=tenant_id,
                conversation_id=conversation_id,
                get_messages=True
            )
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

@router.patch(
    "/{conversation_id}", 
    response_model=ConversationResponse,
    dependencies=[Depends(check_permission(
        PermissionResource.CONVERSATIONS, PermissionAction.UPDATE
    ))]
)
@log_activity(
    action="conversation.update",
    resource="conversation",
    meta_extractor=lambda res, *args, **kwargs: {
        "conversation_id": kwargs.get("conversation_id"), 
        "title": kwargs.get("data").title
    }
)
# @limiter.limit(settings.RATE_LIMIT_ENDPOINTS["create_user"][0])
async def update_conversation(
    request: Request,
    conversation_id: str, 
    data: ConversationUpdate,
    background_tasks: BackgroundTasks,
    conversation_service: ConversationService = Depends(get_conversation_service),
):
    try:
        tenant_id = request.state.tenant_id
        return await conversation_service.update_conversation(
            tenant_id=tenant_id,
            conversation_id=conversation_id,
            title=data.title
        )
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

@router.delete(
    "/{conversation_id}", 
    response_model=ConversationResponse,
    dependencies=[Depends(check_permission(
        PermissionResource.CONVERSATIONS, PermissionAction.DELETE
    ))]
)
@log_activity(
    action="conversation.delete",
    resource="conversation",
    meta_extractor=lambda res, *args, **kwargs: {
        "conversation_id": kwargs.get("conversation_id")
    }
)
# @limiter.limit(settings.RATE_LIMIT_ENDPOINTS["create_user"][0])
async def delete_conversation(
    request: Request,
    conversation_id: str,
    background_tasks: BackgroundTasks,
    conversation_service: ConversationService = Depends(get_conversation_service),
):
    try:
        tenant_id = request.state.tenant_id
        return await conversation_service.delete_conversation(
            tenant_id=tenant_id,
            conversation_id=conversation_id
        )
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

@router.get(
    "/{conversation_id}/messages",
    response_model=List[MessageResponse],
    dependencies=[Depends(check_permission(
        PermissionResource.CONVERSATIONS, PermissionAction.READ
    ))]
)
# @limiter.limit(settings.RATE_LIMIT_ENDPOINTS["create_user"][0])
async def get_messages_by_conversation_id(
    request: Request,
    conversation_id: str,
    limit: int = 20,
    last_id: str | None = None,
    message_service: MessageService = Depends(get_message_service),
):
    try:
        tenant_id = request.state.tenant_id
        return await message_service.get_messages_by_conversation_id(
            tenant_id=tenant_id,
            conversation_id=conversation_id,
            last_id=last_id,
            limit=limit,
        )
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
