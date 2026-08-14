from langgraph.graph.message import add_messages
from langchain_core.messages import BaseMessage
from typing import Any, Annotated, TypedDict

from app.ai_brain.schemas import RetrievalResult, SubQuery
from app.core.enum import GraphNodeID


class AgentState(TypedDict):
    """
    Shared state across the entire graph — chỉ chứa dữ liệu có thể serialize (JSON-safe).

    Per-request context không có thể serialize (dataclasses, SQLAlchemy models)
    được truyền qua RunnableConfig["configurable"] để tránh Postgres checkpointer lỗi.

    config["configurable"] chứa:
        user_security_ctx : UserSecurityContext  — identity (frozen dataclass)
        par_ctx           : PARContext            — authorization (frozen dataclass)
        retrieval_service : RetrievalService      — per-request service
        chat_history      : list[Message]         — SQLAlchemy models
    """

    # ── Conversation ──────────────────────────────────────────────────────
    conversation_id: str

    # ── Query processing ──────────────────────────────────────────────────
    original_question: str
    rewritten_question: str         # Sau Contextual Compression (Tier-1 LLM)

    # ── Routing ───────────────────────────────────────────────────────────
    intent_type: str                # "direct" | "single_rag" | "multi_rag"
    execution_plan: str             # "direct" | "parallel" | "sequential"
    sub_queries: list[SubQuery]     # chỉ có giá trị khi intent="multi_rag"
    router_reasoning: str

    # ── Time-Range Filter ─────────────────────────────────────────────────
    # Khoảng thời gian được trích xuất từ câu hỏi của người dùng.
    # {"date_from": "YYYY-MM-DD"|None, "date_to": "YYYY-MM-DD"|None, "is_time_sensitive": bool}
    # Dùng dict thay Pydantic model để JSON-safe với Postgres checkpointer.
    time_range: dict | None

    # ── Retrieval ─────────────────────────────────────────────────────────
    retrieved_chunks: list[RetrievalResult]   # Raw output từ hybrid search
    reranked_chunks: list[RetrievalResult]    # Sau khi qua CrossEncoder reranker (flat, compat)
    confidence_score: float
    retry_count: int

    # ── Per-subquery structured retrieval ─────────────────────────────────
    # Mỗi entry: {"sub_query_id": int, "sub_query_text": str,
    #             "chunks": list[dict], "best_score": float}
    sub_query_chunks: list[dict]

    # IDs của sub-query có best_score < threshold sau rerank
    failed_sub_query_ids: list[int]

    # IDs của sub-query đã pass threshold (dùng để skip retrieval khi partial retry)
    passed_sub_query_ids: list[int]

    # ── Prompt Templates ──────────────────────────────────────────────────
    # Active prompt templates của tenant — load 1 lần khi invoke graph.
    # Key: PromptType.value (str), Value: content (str).
    # Nếu key không tồn tại → node fallback về default_prompts.prompt_map.
    prompt_templates: dict[str, str]

    # ── Cache ─────────────────────────────────────────────────────────────
    cache_hit: bool
    cache_response: str | None

    # ── Output ────────────────────────────────────────────────────────────
    messages: Annotated[list[BaseMessage], add_messages]
    final_answer: str
    sources: list[dict[str, Any]]

    _next: GraphNodeID | None
