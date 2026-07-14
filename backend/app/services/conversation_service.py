import math
from app.repositories import ConversationRepository, MessageRepository
from app.models import Conversation
from app.services.exceptions import NotFoundError
from app.schemas import (
    ConversationResponse, ConversationPaginatedResponse,
    ConversationDetailResponse, MessageResponse,
    PaginationQuery, PaginationResponse, ConversationQuery
)


class ConversationService:
    def __init__(
        self, repo: ConversationRepository, 
        message_repo: MessageRepository
    ):
        self.repo = repo
        self.message_repo = message_repo
    
    async def get_all_conversations_by_user_id(
        self, tenant_id: str, user_id: str, query: ConversationQuery,
        pagination: PaginationQuery
    ) -> ConversationPaginatedResponse:
        skip = (pagination.page - 1) * pagination.limit

        conversations, total = await self.repo.get_all_conversations_by_user_id(
            tenant_id, user_id, query.query, skip, limit=pagination.limit
        )
        
        total_pages = math.ceil(total / pagination.limit) if total > 0 else 0
        return ConversationPaginatedResponse(
            conversations=[
                ConversationResponse.model_validate(conversation) 
                for conversation in conversations
            ],
            pagination=PaginationResponse(
                page=pagination.page,
                limit=pagination.limit,
                total=total,
                total_pages=total_pages
            )
        )

    async def create_conversation(
        self, tenant_id: str, user_id: str, 
        title: str | None = None
    ) -> ConversationResponse:
        if title is None:
            # TODO: use a llm to generate a title 
            title = "New conversation"
            
        conversation = Conversation(
            tenant_id=tenant_id,
            user_id=user_id,
            title=title
        )

        created = await self.repo.create_conversation(conversation)
        return ConversationResponse.model_validate(created)
    
    async def get_conversation_by_id(
        self,
        tenant_id: str,
        conversation_id: str,
        get_messages: bool = False
    ) -> ConversationDetailResponse:
        conversation = await self.repo.get_conversation_by_id(conversation_id)
        if conversation is None or conversation.tenant_id != tenant_id:
            raise NotFoundError()

        response = ConversationDetailResponse(
            id=conversation.id,
            user_id=conversation.user_id,
            title=conversation.title,
            is_deleted=conversation.is_deleted,
            created_at=conversation.created_at,
            updated_at=conversation.updated_at,
            messages=[]
        )
        
        if get_messages:
            messages = await self.message_repo.get_messages_by_conversation_id(
                conversation_id=conversation_id,
                limit=10
            )
            response.messages = [
                MessageResponse.model_validate(message) 
                for message in messages
            ]
        return ConversationDetailResponse.model_validate(response)
    
    async def update_conversation(
        self, tenant_id: str, conversation_id: str,
        title: str | None = None
    ) -> ConversationResponse:
        existing = await self.repo.get_conversation_by_id(conversation_id)
        if existing is None or existing.tenant_id != tenant_id:
            raise NotFoundError()
        
        existing.title = title

        await self.repo.save(conversation=existing)
        return ConversationResponse.model_validate(existing)
    
    async def delete_conversation(
        self, tenant_id: str, conversation_id: str
    ) -> ConversationResponse:
        existing = await self.repo.get_conversation_by_id(conversation_id)
        if existing is None or existing.tenant_id != tenant_id:
            raise NotFoundError()
        
        existing.is_deleted = True

        await self.repo.save(conversation=existing)
        return ConversationResponse.model_validate(existing)
