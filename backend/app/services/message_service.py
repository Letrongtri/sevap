import json
from typing import List, AsyncGenerator

from app.repositories import MessageRepository, ConversationRepository
from app.models import Message, Conversation
from app.services.exceptions import NotFoundError, InternalError
from app.ai_brain.retrieval.repository import PARRepository
from app.ai_brain.router.intent_router import IntentRouter
from app.core.logging import logger


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

    async def get_messages_by_conversation_id(
        self,
        conversation_id: int,
        limit: int = 20,
        last_id: int | None = None,
    ) -> List[Message]:
        try:
            messages = await self.msg_repo.get_messages_by_conversation_id(
                conversation_id=conversation_id,
                last_id=last_id,
                limit=limit,
            )
            return messages
        except NotFoundError:
            raise NotFoundError()
        except Exception:
            logger.error(
                "get_messages_by_conversation_id_failed",
                conversation_id=conversation_id,
                last_id=last_id,
                limit=limit,
                exc_info=True,
            )
            raise InternalError("Failed to get messages by conversation_id")

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

    async def stream_message_response(
        self,
        user_id: int,
        content: str,
        conversation_id: int | None = None,
    ) -> AsyncGenerator[str, None]:
        """
        Async generator that yields Server-Sent Events (SSE) strings.

        Event sequence:
          1. event: metadata  — conversation_id, user_message_id
          2. event: token     — one per LLM chunk (streamed)
          3. event: done      — assistant_message_id, sources, agent_type
          4. event: error     — if no retrieval results found

        Each yielded value is a complete SSE "data: ...\\n\\n" line.
        """
        # ── 1. Ensure conversation exists ──────────────────────────────────
        if conversation_id is None:
            title = content[:40] + "..." if len(content) > 40 else content
            created_conv = await self.conv_repo.create_conversation(
                Conversation(user_id=user_id, title=title)
            )
            conversation_id = created_conv.id

        # ── 2. Persist user message ────────────────────────────────────────
        user_message = Message(
            conversation_id=conversation_id,
            actor="user",
            content=content,
        )
        created_user_message = await self.msg_repo.create_message(user_message)

        # ── 3. Yield metadata so client can track IDs immediately ──────────
        yield "event: metadata\ndata: " + json.dumps({
            "conversation_id": conversation_id,
            "user_message_id": created_user_message.id,
        }) + "\n\n"

        # ── 4. Build PAR context & stream from LLM ─────────────────────────
        par_context = await self.par_repo.build_par_context(user_id)

        full_answer = ""
        agent_type: str | None = None
        sources: list = []
        had_error = False

        async for event in self.intent_router.route_stream(
            query=content, par_context=par_context
        ):
            etype = event.get("type")

            if etype == "token":
                token = event["data"]
                full_answer += token
                yield "event: token\ndata: " + json.dumps({"token": token}) + "\n\n"

            elif etype == "done":
                sources = event.get("sources", [])
                agent_type = event.get("agent_type")

            elif etype == "error":
                had_error = True
                full_answer = event.get("message", "")
                yield "event: error\ndata: " + json.dumps({"message": full_answer}) + "\n\n"

        # ── 5. Persist assistant message ───────────────────────────────────
        assistant_message = Message(
            conversation_id=conversation_id,
            actor="assistant",
            agent_type=agent_type,
            content=full_answer,
            retrieval_context=sources if sources else None,
            confidence_score=None,
        )
        new_assistant_message = await self.msg_repo.create_message(assistant_message)

        # ── 6. Yield done (only when no error already signalled) ───────────
        if not had_error:
            yield "event: done\ndata: " + json.dumps({
                "assistant_message_id": new_assistant_message.id,
                "sources": sources,
                "agent_type": agent_type,
            }) + "\n\n"
