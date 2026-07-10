from langgraph.graph.message import add_messages
from langchain_core.messages import BaseMessage
from typing import Any, Annotated, TypedDict

from app.ai_brain.schemas import PARContext, RetrievalResult, SubQuery, UserSecurityContext
from app.core.enum import GraphNodeID
from app.models import Message


class AgentState(TypedDict):
    """
    Shared state across the entire graph.
    Each node only reads/writes the fields it is responsible for.

    ── Security Boundary ────────────────────────────────────────────────────
    Hai field dưới đây được inject tại điểm vào của graph (trước node đầu tiên)
    và TUYỆT ĐỐI không được thay đổi bởi bất kỳ node nào downstream.
    Đây là cơ chế đảm bảo Tenant Isolation và Security Boundary trong toàn graph.

    user_security_ctx : UserSecurityContext
        Identity của người dùng — được build từ JWT token tại HTTP layer.
        Dùng cho: audit log, logging, hiển thị thông tin user.

    par_ctx : PARContext
        Authorization context — được build từ DB lookup tại entry point.
        Dùng cho: PAR filter, SQL boundary inject trong retrieval pipeline.
        Không được dùng ngoài ai_brain/retrieval.
    ─────────────────────────────────────────────────────────────────────────
    """

    # ── Security (injected once, never mutated) ───────────────────────────
    user_security_ctx: UserSecurityContext      # Identity layer
    par_ctx: PARContext                         # Authorization / PAR layer

    # ── Conversation ──────────────────────────────────────────────────────
    conversation_id: str
    chat_history: list[Message]

    # ── Query processing ──────────────────────────────────────────────────
    original_question: str
    rewritten_question: str         # Sau Contextual Compression (Tier-1 LLM)

    # ── Routing ───────────────────────────────────────────────────────────
    intent_type: str                # "direct" | "single_rag" | "multi_rag"
    execution_plan: str             # "direct" | "parallel" | "sequential"
    sub_queries: list[SubQuery]     # chỉ có giá trị khi intent="multi_rag"
    router_reasoning: str

    # ── Retrieval ─────────────────────────────────────────────────────────
    retrieved_chunks: list[RetrievalResult]   # Raw output từ hybrid search
    reranked_chunks: list[RetrievalResult]    # Sau khi qua CrossEncoder reranker
    confidence_score: float
    retry_count: int

    # ── Cache ─────────────────────────────────────────────────────────────
    cache_hit: bool
    cache_response: str | None

    # ── Output ────────────────────────────────────────────────────────────
    messages: Annotated[list[BaseMessage], add_messages]
    final_answer: str
    sources: list[dict[str, Any]]

    _next: GraphNodeID | None
