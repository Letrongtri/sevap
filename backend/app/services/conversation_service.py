from typing import List

from app.repositories import ConversationRepository
from app.models import Conversation
from app.services.exceptions import NotFoundError


class ConversationService:
    def __init__(self, repo: ConversationRepository):
        self.repo = repo
    
    async def get_all_conversations(self) -> List[Conversation]:
        return await self.repo.get_all_conversations()

    async def create_conversation(self, user_id: int, title: str | None = None) -> Conversation:
        if title is None:
            # use a llm to generate a title 
            title = "New conversation"
            
        conversation = Conversation(
            user_id=user_id,
            title=title
        )

        return await self.repo.create_conversation(conversation)
    
    async def get_conversation_by_id(self, conversation_id: int) -> Conversation | None:
        conversation = await self.repo.get_conversation_by_id(conversation_id, get_messages=True)
        if conversation is None:
            raise NotFoundError()
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
