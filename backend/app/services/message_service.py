from typing import List

from app.repositories import MessageRepository, ConversationRepository
from app.models import Message
from app.services.exceptions import NotFoundError
from app.ai_brain.retrieval.repository import PARRepository
from app.ai_brain.router.intent_router import IntentRouter


class MessageService:
    def __init__(
        self, 
        msg_repo: MessageRepository, 
        conv_repo: ConversationRepository,
        par_repo: PARRepository,
        intent_router: IntentRouter,
    ):
        self.msg_repo = msg_repo
        self.conv_repo = conv_repo
        self.par_repo = par_repo
        self.intent_router = intent_router

    async def create_user_message(self, user_id: int, conversation_id: int, content: str) -> Message:
        try:
            conversation = await self.conv_repo.get_conversation_by_id(conversation_id)
            if conversation is None:
                raise NotFoundError()
        except NotFoundError:
            raise NotFoundError()
        
        message = Message(
            conversation_id=conversation_id,
            actor="user",
            content=content
        )

        await self.msg_repo.create_message(message)

        par_context = await self.par_repo.build_par_context(user_id)

        # 2. Route & execute
        result = await self.intent_router.route(query=content, par_context=par_context)

        # 3. Save assistant message
        assistant_message = Message(
            conversation_id=conversation_id,
            actor="assistant",
            agent_type=result.get("agent_type"),
            content=result.get("answer", ""),
            retrieval_context=result.get("sources"),
            confidence_score=result.get("confidence")
        )
        new_assistant_message = await self.msg_repo.create_message(assistant_message)

        return new_assistant_message
