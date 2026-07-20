import json
from typing import List, AsyncGenerator

from langchain_core.messages import HumanMessage
from langgraph.graph.state import CompiledStateGraph

from app.repositories import MessageRepository, ConversationRepository
from app.models import Message, Conversation
from app.schemas.message_schema import MessageResponse
from app.services.exceptions import NotFoundError, InternalError
from app.ai_brain.retrieval.repository import PARRepository
from app.ai_brain.retrieval.service import RetrievalService
from app.ai_brain.schemas import UserSecurityContext
from app.core.logging import logger
from app.core.enum import GraphNodeID


class MessageService:
    def __init__(
        self,
        msg_repo: MessageRepository,
        conv_repo: ConversationRepository,
        par_repo: PARRepository,
        retrieval_service: RetrievalService,
        compiled_graph: CompiledStateGraph,
    ):
        self.msg_repo = msg_repo
        self.conv_repo = conv_repo
        self.par_repo = par_repo
        self.retrieval_service = retrieval_service
        self.compiled_graph = compiled_graph

    async def get_messages_by_conversation_id(
        self, tenant_id: str,
        conversation_id: str,
        limit: int = 20,
        last_id: str | None = None,
    ) -> List[MessageResponse]:
        try:
            existing_conv = await self.conv_repo.get_conversation_by_id(conversation_id)
            if existing_conv is None or existing_conv.tenant_id != tenant_id:
                raise NotFoundError()

            messages = await self.msg_repo.get_messages_by_conversation_id(
                conversation_id=conversation_id,
                last_id=last_id,
                limit=limit,
            )
            return [
                MessageResponse.model_validate(m) 
                for m in messages
            ]
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

    async def stream_message_response(
        self,
        tenant_id: str,
        user_id: str,
        content: str,
        conversation_id: str | None = None,
    ) -> AsyncGenerator[str, None]:
        """
        Async generator that yields Server-Sent Events (SSE) strings.

        Event sequence:
          1. event: metadata  — conversation_id, user_message_id
          2. event: token     — one per LLM chunk (streamed via astream_events)
          3. event: done      — assistant_message_id, sources, agent_type
          4. event: error     — if an unrecoverable error occurs

        Each yielded value is a complete SSE "data: ...\\n\\n" line.
        """
        # ── 1. Ensure conversation exists ──────────────────────────────────
        if conversation_id is None:
            title = content[:40] + "..." if len(content) > 40 else content
            created_conv = await self.conv_repo.create_conversation(
                Conversation(
                    tenant_id=tenant_id,
                    user_id=user_id,
                    title=title
                )
            )
            conversation_id = created_conv.id

        # ── 2. Load chat history (excl. current message, ordered oldest first) ──
        try:
            chat_history = await self.msg_repo.get_messages_by_conversation_id(
                conversation_id=conversation_id,
                limit=4,
            )
            # Reversing descending order from DB to get chronological order (oldest first)
            chat_history = list(reversed(chat_history))
        except Exception:
            chat_history = []

        # ── 3. Persist user message ────────────────────────────────────────
        user_message = Message(
            conversation_id=conversation_id,
            actor="user",
            content=content,
        )
        created_user_message = await self.msg_repo.create_message(user_message)

        # ── 4. Yield metadata so client can track IDs immediately ──────────
        yield "event: metadata\ndata: " + json.dumps({
            "conversation_id": conversation_id,
            "user_message_id": created_user_message.id,
        }) + "\n\n"

        # ── 5. Build PAR context ───────────────────────────────────────────
        try:
            security_ctx = UserSecurityContext(user_id=user_id, tenant_id=tenant_id)
            par_ctx = await self.par_repo.build_par_context(security_ctx)
        except Exception:
            logger.error(
                "build_par_context_failed",
                tenant_id=tenant_id,
                user_id=user_id,
                exc_info=True,
            )
            try:
                await self.msg_repo.db.rollback()
            except Exception:
                pass
            yield "event: error\ndata: " + json.dumps({
                "message": "Không thể xác thực quyền truy cập. Vui lòng thử lại."
            }) + "\n\n"
            return

        # ── 6. Invoke LangGraph và stream kết quả ─────────────────────────
        full_answer = ""
        sources: list = []
        agent_type: str | None = None
        had_error = False

        try:
            # Reset all state fields from previous checkpoints to prevent state bleed
            graph_input = {
                "original_question": content,
                "conversation_id": conversation_id,
                "messages": [HumanMessage(content=content)],
                "retry_count": 0,
                "cache_hit": False,
                "cache_response": None,
                "rewritten_question": "",
                "intent_type": "",
                "execution_plan": "",
                "sub_queries": [],
                "router_reasoning": "",
                "retrieved_chunks": [],
                "reranked_chunks": [],
                "sub_query_chunks": [],
                "failed_sub_query_ids": [],
                "passed_sub_query_ids": [],
                "confidence_score": 0.0,
                "final_answer": "",
                "sources": [],
                "_next": None,
            }

            thread_config = {
                "configurable": {
                    "thread_id": conversation_id,
                    # Per-request context — không persist bởi checkpointer
                    # (tránh serialize lỗi với Postgres vì đây là dataclass/ORM objects)
                    "user_security_ctx": security_ctx,
                    "par_ctx": par_ctx,
                    "chat_history": chat_history,
                    "retrieval_service": self.retrieval_service,
                }
            }

            # Stream sự kiện từ LangGraph — chỉ lấy token từ LLM node
            async for event in self.compiled_graph.astream_events(
                graph_input,
                config=thread_config,
                version="v2",
            ):
                event_name = event.get("event")
                event_data = event.get("data", {})

                # Lấy token streaming từ on_chat_model_stream
                if event_name == "on_chat_model_stream":
                    # Chỉ stream token từ các node tạo câu trả lời trực tiếp cho người dùng
                    node_id = event.get("metadata", {}).get("langgraph_node")
                    if node_id not in [
                        GraphNodeID.DIRECT_RESPONSE_GENERATOR.value,
                        GraphNodeID.FINAL_RESPONSE_GENERATOR.value,
                        GraphNodeID.FALLBACK_NODE.value,
                        GraphNodeID.SECURITY_KILL_SWITCH.value
                    ]:
                        continue

                    chunk = event_data.get("chunk")
                    if chunk and hasattr(chunk, "content") and chunk.content:
                        token = chunk.content
                        full_answer += token
                        yield "event: token\ndata: " + json.dumps({"token": token}) + "\n\n"

            # ── 7. Lấy final state sau khi graph hoàn thành ────────────────
            final_state = await self.compiled_graph.aget_state(config=thread_config)
            if final_state and final_state.values:
                state_vals = final_state.values
                full_answer = state_vals.get("final_answer") or full_answer
                sources = state_vals.get("sources") or []
                # Xác định agent_type từ intent
                intent = state_vals.get("intent_type")
                agent_type = intent if intent else "rag"

        except Exception:
            had_error = True
            logger.error(
                "graph_stream_failed",
                tenant_id=tenant_id,
                user_id=user_id,
                conversation_id=conversation_id,
                exc_info=True,
            )
            # Rollback DB session để reset Postgres transaction state từ ABORTED
            try:
                await self.msg_repo.db.rollback()
            except Exception:
                pass
            full_answer = "Đã xảy ra lỗi khi xử lý câu hỏi. Vui lòng thử lại."
            yield "event: error\ndata: " + json.dumps({"message": full_answer}) + "\n\n"

        # ── 8. Persist assistant message ───────────────────────────────────
        assistant_message_id = None
        try:
            assistant_message = Message(
                conversation_id=conversation_id,
                actor="assistant",
                agent_type=agent_type,
                content=full_answer,
                retrieval_context=sources if sources else None,
                confidence_score=None,
            )
            new_assistant_message = await self.msg_repo.create_message(assistant_message)
            if new_assistant_message:
                assistant_message_id = new_assistant_message.id
        except Exception:
            logger.error(
                "persist_assistant_message_failed",
                conversation_id=conversation_id,
                exc_info=True,
            )
            try:
                await self.msg_repo.db.rollback()
            except Exception:
                pass

        # ── 9. Yield done (only when no error already signalled) ───────────
        if not had_error:
            yield "event: done\ndata: " + json.dumps({
                "assistant_message_id": assistant_message_id,
                "sources": sources,
                "agent_type": agent_type,
            }) + "\n\n"
