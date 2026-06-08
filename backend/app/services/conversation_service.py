from typing import List

from app.repositories import ConversationRepository, MessageRepository
from app.models import Conversation
from app.services.exceptions import NotFoundError


class ConversationService:
    def __init__(self, repo: ConversationRepository, message_repo: MessageRepository):
        self.repo = repo
        self.message_repo = message_repo
    
    async def get_all_conversations_by_user_id(self, user_id: int) -> List[Conversation]:
        return await self.repo.get_all_conversations_by_user_id(user_id)

    async def create_conversation(self, user_id: int, title: str | None = None) -> Conversation:
        if title is None:
            # use a llm to generate a title 
            title = "New conversation"
            
        conversation = Conversation(
            user_id=user_id,
            title=title
        )

        return await self.repo.create_conversation(conversation)
    
    async def get_conversation_by_id(
        self, 
        conversation_id: int,
        get_messages: bool = False
    ) -> Conversation | None:
        conversation = await self.repo.get_conversation_by_id(conversation_id)
        if conversation is None:
            raise NotFoundError()
        if get_messages:
            messages = await self.message_repo.get_messages_by_conversation_id(
                conversation_id=conversation_id,
                limit=10
            )
            return conversation, messages
        return conversation
    
    async def update_conversation(self, conversation_id: int, title: str) -> Conversation:
        existing = await self.repo.get_conversation_by_id(conversation_id)
        if existing is None:
            raise NotFoundError()
        
        existing.title = title

        await self.repo.save(conversation=existing)
        return existing
    
    async def delete_conversation(self, conversation_id: int) -> Conversation:
        existing = await self.repo.get_conversation_by_id(conversation_id)
        if existing is None:
            raise NotFoundError()
        
        existing.is_deleted = True

        await self.repo.save(conversation=existing)
        return existing
