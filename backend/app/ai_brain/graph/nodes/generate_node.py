"""
generate_node.py
────────────────
Node tổng hợp câu trả lời cuối cùng từ LLM.

Context format:
  - Nếu có sub_query_chunks → format theo từng sub-query (structured mode).
  - Nếu không (single_rag) → format phẳng như trước (flat mode).

Structured mode:
  [Sub-query 1]: "Câu hỏi con 1?"
    - [Document A] Nội dung...
    - [Document B] Nội dung...

  [Sub-query 2]: "Câu hỏi con 2?"
   Không tìm thấy tài liệu liên quan.
"""

from typing import List

from langchain_core.messages import AIMessage, HumanMessage, SystemMessage
from langchain_core.runnables import RunnableConfig

from app.ai_brain.llm import get_llm
from app.ai_brain.prompts import (
    GENERATE_RESPONSE_SYSTEM_PROMPT,
    GENERATE_RESPONSE_USER_PROMPT,
)
from app.ai_brain.prompts.prompt_resolver import get_prompt
from app.ai_brain.state import AgentState
from app.core.enum import GraphNodeID, PromptType
from app.core.logging import logger


def _build_structured_context(
    sub_query_chunks: List[dict],
    failed_ids: set,
) -> str:
    """
    Tạo context text có cấu trúc theo từng sub-query.

    Sub-query có ID nằm trong failed_ids sẽ KHÔNG truyền chunk vào context
    (dù chunk có tồn tại trong state) — thay vào đó hiển thị cảnh báo.
    Điều này ngăn LLM hallucinate từ chunk chất lượng thấp dưới threshold.

    Format:
        [Sub-query 1]: "Câu hỏi?"
          - [Document Title] Nội dung chunk...

        [Sub-query 2]: "Câu hỏi khác?"  ← failed
         Không tìm thấy tài liệu đủ độ tin cậy cho câu hỏi này.
    """
    parts = []
    for entry in sub_query_chunks:
        sq_id   = entry.get("sub_query_id", "?")
        sq_text = entry.get("sub_query_text", "")
        chunks  = entry.get("chunks", [])

        header = f'[Sub-query {sq_id}]: "{sq_text}"'

        # Sub-query thất bại (dưới threshold) → hiển thị cảnh báo, bỏ qua chunks
        if sq_id in failed_ids:
            parts.append(
                header + "\n Không tìm thấy tài liệu đủ độ tin cậy cho câu hỏi này."
            )
        elif chunks:
            chunk_lines = []
            for chunk in chunks:
                doc_title  = chunk.get("doc_title", "Tài liệu không xác định")
                content    = chunk.get("content", "").strip()
                metadata   = chunk.get("metadata") or {}
                eff_date   = metadata.get("effective_date") or chunk.get("effective_date")
                date_label = f" | Hiệu lực từ: {eff_date}" if eff_date else ""
                chunk_lines.append(f"  - [{doc_title}{date_label}]\n    {content}")
            parts.append(header + "\n" + "\n".join(chunk_lines))
        else:
            parts.append(header + "\n Không tìm thấy tài liệu liên quan đến câu hỏi này.")

    return "\n\n".join(parts)


def _build_flat_context(chunks: List[dict]) -> str:
    """Flat context format cho single_rag (backward compat)."""
    context_parts = []
    for i, chunk in enumerate(chunks, 1):
        doc_title = chunk.get('doc_title', '')
        metadata  = chunk.get("metadata") or {}
        eff_date  = metadata.get("effective_date") or chunk.get("effective_date")
        date_label = f" | Hiệu lực từ: {eff_date}" if eff_date else ""
        context_parts.append(
            f"[Document {i}: {doc_title}{date_label}]\n{chunk.get('content', '')}"
        )
    return "\n\n---\n\n".join(context_parts)


async def generate_final_response_node(state: AgentState, config: RunnableConfig) -> dict:
    original_question = state["original_question"]
    question          = state.get("rewritten_question") or original_question
    chat_history      = config["configurable"].get("chat_history", [])
    sub_query_chunks  = state.get("sub_query_chunks", [])
    failed_ids: set   = set(state.get("failed_sub_query_ids", []))

    llm = get_llm(temperature=0.6)

    history_context = "\n".join([
        f"{msg.actor}: {msg.content}"
        for msg in chat_history
    ]) if chat_history else "No previous conversation history."

    # ── Chọn mode context ─────────────────────────────────────────────────────
    if sub_query_chunks:
        context_text = _build_structured_context(sub_query_chunks, failed_ids)
        mode = "structured"
    else:
        flat_chunks = state.get("reranked_chunks") or state.get("retrieved_chunks", [])
        context_text = _build_flat_context(flat_chunks)
        mode = "flat"

    logger.info(
        "[GenerateNode] Context mode=%s | sub_query_count=%d | failed_ids=%s",
        mode, len(sub_query_chunks), sorted(failed_ids),
    )

    # Lấy prompt values từ state (custom tenant) hoặc fallback về default
    system_prompt = GENERATE_RESPONSE_SYSTEM_PROMPT.format(
        assistant_name=get_prompt(state, PromptType.ASSISTANT_NAME),
        language=get_prompt(state, PromptType.LANGUAGE),
        response_citation=get_prompt(state, PromptType.RESPONSE_CITATION),
    )

    messages = [
        SystemMessage(content=system_prompt),
        HumanMessage(content=GENERATE_RESPONSE_USER_PROMPT.format(
            history=history_context,
            context=context_text,
            query=question
        )),
    ]

    response = await llm.ainvoke(messages)
    answer   = response.content.strip()

    # ── Build sources list ────────────────────────────────────────────────────
    # Chỉ collect chunks từ sub-query đã PASS (không lấy chunk của failed sub-queries)
    if sub_query_chunks:
        seen_chunk_ids = set()
        all_chunks_for_sources = []
        for entry in sub_query_chunks:
            if entry.get("sub_query_id") in failed_ids:
                continue  # bỏ qua chunks của sub-query thất bại
            for c in entry.get("chunks", []):
                cid = c.get("chunk_id", "")
                if cid not in seen_chunk_ids:
                    seen_chunk_ids.add(cid)
                    all_chunks_for_sources.append(c)
    else:
        all_chunks_for_sources = state.get("reranked_chunks") or state.get("retrieved_chunks", [])

    sources = [
        {
            "chunk_id":    c.get("chunk_id") if isinstance(c, dict) else c.chunk_id,
            "document_id": c.get("document_id") if isinstance(c, dict) else c.document_id,
            "doc_title":   c.get("doc_title") if isinstance(c, dict) else c.doc_title,
            "content":     c.get("content") if isinstance(c, dict) else c.content,
            "score":       c.get("score") if isinstance(c, dict) else c.score,
        }
        for c in all_chunks_for_sources
    ]

    return {
        "final_answer": answer,
        "sources": sources,
        "messages": [
            HumanMessage(content=original_question),
            AIMessage(content=answer)
        ],
        "_next": GraphNodeID.END.value,
    }
