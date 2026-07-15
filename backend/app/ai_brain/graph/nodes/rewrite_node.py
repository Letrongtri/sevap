"""
rewrite_node.py
───────────────
Node reformulate câu hỏi khi retrieval thất bại.

Smart Rewrite Logic (quy tắc 1/3):
  N = tổng số sub-query, F = số sub-query thất bại (từ failed_sub_query_ids)

  F >= N/3  → FULL REWRITE  : gửi toàn bộ câu hỏi gốc + tất cả sub-queries
                               vào prompt REWRITE_QUERY_FULL.
                               Reset toàn bộ sub_query_chunks.
  F < N/3   → PARTIAL REWRITE: chỉ gửi các sub-query thất bại vào prompt
                               REWRITE_QUERY_PARTIAL.
                               Giữ nguyên sub_query_chunks của passed sub-queries.
                               Merge sub-queries mới (rewritten) với cũ (passed).

Single-rag / no sub_queries → luôn dùng full rewrite (hành vi cũ).
"""

import json
from typing import Dict, List, Set

from langchain_core.messages import HumanMessage, SystemMessage
from langchain_core.runnables import RunnableConfig

from app.ai_brain.llm import get_llm
from app.ai_brain.prompts import (
    REWRITE_QUERY_FULL_SYSTEM_PROMPT,
    REWRITE_QUERY_FULL_USER_PROMPT,
    REWRITE_QUERY_PARTIAL_SYSTEM_PROMPT,
    REWRITE_QUERY_PARTIAL_USER_PROMPT,
)
from app.ai_brain.schemas import SubQuery
from app.ai_brain.state import AgentState
from app.core.config import settings
from app.core.enum import GraphNodeID, IntentType, RetrievalExecutionPlan
from app.core.logging import logger
from app.utils.json_utils import clean_and_extract_json


def _fmt_subquery(sq) -> str:
    """Format một SubQuery (object hoặc dict) thành string."""
    if hasattr(sq, "id"):
        return f"Q{sq.id}: {sq.query} (depends_on: {sq.depends_on or []})"
    return f"Q{sq.get('id')}: {sq.get('query')} (depends_on: {sq.get('depends_on', [])})"


async def rewrite_node(state: AgentState, config: RunnableConfig) -> dict:
    question          = state["original_question"]
    chat_history      = config["configurable"].get("chat_history", [])
    failed_rewritten  = state.get("rewritten_question", "")
    all_sub_queries   = state.get("sub_queries", [])
    failed_ids: List[int] = state.get("failed_sub_query_ids", [])
    passed_ids: List[int] = state.get("passed_sub_query_ids", [])

    N = len(all_sub_queries)
    F = len(failed_ids)

    model_name = settings.OLLAMA_SLM_MODEL
    llm = get_llm(model_name=model_name, temperature=0.6, format_json=True)

    history_context = "\n".join([
        f"{msg.actor}: {msg.content}"
        for msg in chat_history
    ]) if chat_history else "No previous conversation history."

    # ── Xác định chiến lược: PARTIAL hay FULL ────────────────────────────────
    use_partial = (N > 1) and (F > 0) and (F < N / 3)

    logger.info(
        "[RewriteNode] N=%d F=%d → strategy=%s",
        N, F, "PARTIAL" if use_partial else "FULL",
    )

    # ─────────────────────────────────────────────────────────────────────────
    # PARTIAL REWRITE — chỉ reformulate F sub-queries thất bại
    # ─────────────────────────────────────────────────────────────────────────
    if use_partial:
        failed_id_set: Set[int] = set(failed_ids)
        passed_id_set: Set[int] = set(passed_ids)

        # Phân tách sub-queries thành 2 nhóm
        failed_sqs  = [sq for sq in all_sub_queries if _get_id(sq) in failed_id_set]
        passed_sqs  = [sq for sq in all_sub_queries if _get_id(sq) in passed_id_set]

        passed_str  = "\n".join(_fmt_subquery(sq) for sq in passed_sqs)  or "None"
        failed_str  = "\n".join(_fmt_subquery(sq) for sq in failed_sqs)

        messages = [
            SystemMessage(content=REWRITE_QUERY_PARTIAL_SYSTEM_PROMPT),
            HumanMessage(content=REWRITE_QUERY_PARTIAL_USER_PROMPT.format(
                original_question=question,
                passed_sub_queries=passed_str,
                failed_sub_queries=failed_str,
            )),
        ]

        response    = await llm.ainvoke(messages)
        clean_json  = clean_and_extract_json(response.content.strip())
        resp_dict   = json.loads(clean_json)

        if resp_dict.get("is_security_anomaly", False):
            return _security_anomaly(resp_dict)

        # Build map của sub-queries mới (chỉ failed ones được trả về)
        reformulated: List[dict] = resp_dict.get("reformulated_sub_queries", [])
        reformulated_map: Dict[int, dict] = {r["id"]: r for r in reformulated}

        # Merge: passed giữ nguyên, failed dùng bản reformulated
        merged_sqs: List[SubQuery] = []
        for sq in all_sub_queries:
            sq_id = _get_id(sq)
            if sq_id in reformulated_map:
                r = reformulated_map[sq_id]
                merged_sqs.append(SubQuery(
                    id=r["id"],
                    query=r["query"],
                    depends_on=r.get("depends_on", []),
                ))
            else:
                # Giữ nguyên sub-query đã pass
                merged_sqs.append(SubQuery.model_validate(sq))

        # Giữ nguyên sub_query_chunks của passed sub-queries
        existing_sqc: List[dict] = state.get("sub_query_chunks", [])
        kept_sqc = [e for e in existing_sqc if e["sub_query_id"] in passed_id_set]

        logger.info(
            "[RewriteNode] PARTIAL done | kept=%d passed chunks | reformulated=%d sub-queries",
            len(kept_sqc), len(reformulated),
        )

        return {
            "sub_queries": merged_sqs,
            "sub_query_chunks": kept_sqc,           # chỉ giữ passed
            "passed_sub_query_ids": list(passed_id_set),
            "failed_sub_query_ids": [],             # reset, sẽ được rerank_node cập nhật
            "retry_count": state.get("retry_count", 0) + 1,
            "_next": GraphNodeID.RETRIEVAL.value,
        }

    # ─────────────────────────────────────────────────────────────────────────
    # FULL REWRITE — reformulate toàn bộ từ câu hỏi gốc
    # ─────────────────────────────────────────────────────────────────────────
    all_sqs_str = "\n".join(_fmt_subquery(sq) for sq in all_sub_queries) \
                  if all_sub_queries else "No sub-queries."

    messages = [
        SystemMessage(content=REWRITE_QUERY_FULL_SYSTEM_PROMPT),
        HumanMessage(content=REWRITE_QUERY_FULL_USER_PROMPT.format(
            history=history_context,
            original_question=question,
            rewritten_question=failed_rewritten,
            sub_queries=all_sqs_str,
        )),
    ]

    response    = await llm.ainvoke(messages)
    clean_json  = clean_and_extract_json(response.content.strip())
    resp_dict   = json.loads(clean_json)

    if resp_dict.get("is_security_anomaly", False):
        return _security_anomaly(resp_dict)

    raw_subs       = resp_dict.get("sub_queries", [])
    sub_query_objs = [SubQuery(**q) for q in raw_subs]

    # Trường hợp Single RAG (không có hoặc chỉ 1 sub-query)
    if not sub_query_objs or len(sub_query_objs) == 1:
        fallback_q = sub_query_objs[0].query if sub_query_objs else question
        return {
            "rewritten_question": resp_dict.get("rewritten_query", question),
            "intent_type": IntentType.SINGLE_RAG.value,
            "execution_plan": RetrievalExecutionPlan.PARALLEL.value,
            "sub_queries": [SubQuery(id=1, query=fallback_q, depends_on=[])],
            "sub_query_chunks": [],
            "failed_sub_query_ids": [],
            "passed_sub_query_ids": [],
            "router_reasoning": resp_dict.get("reasoning", ""),
            "retry_count": state.get("retry_count", 0) + 1,
            "_next": GraphNodeID.RETRIEVAL.value,
        }

    # Multi RAG
    has_deps  = any(len(q.depends_on) > 0 for q in sub_query_objs)
    plan_type = RetrievalExecutionPlan.SEQUENTIAL if has_deps else RetrievalExecutionPlan.PARALLEL

    logger.info(
        "[RewriteNode] FULL done | new_sub_queries=%d | plan=%s",
        len(sub_query_objs), plan_type.value,
    )

    return {
        "rewritten_question": resp_dict.get("rewritten_query", question),
        "intent_type": IntentType.MULTI_RAG.value,
        "execution_plan": plan_type.value,
        "sub_queries": sub_query_objs,
        "sub_query_chunks": [],          # reset toàn bộ
        "failed_sub_query_ids": [],
        "passed_sub_query_ids": [],
        "router_reasoning": resp_dict.get("reasoning", ""),
        "retry_count": state.get("retry_count", 0) + 1,
        "_next": GraphNodeID.RETRIEVAL.value,
    }


# ─────────────────────────────────────────────────────────────────────────────
# Helpers
# ─────────────────────────────────────────────────────────────────────────────

def _get_id(sq) -> int:
    """Lấy ID từ SubQuery object hoặc dict."""
    return sq.id if hasattr(sq, "id") else sq.get("id")


def _security_anomaly(resp_dict: dict) -> dict:
    """Trả về dict khi phát hiện security anomaly."""
    return {
        "rewritten_question": "SECURITY WARNING: Malicious input detected.",
        "intent_type": IntentType.SECURITY_ANOMALY.value,
        "execution_plan": RetrievalExecutionPlan.UNKNOWN.value,
        "sub_queries": [],
        "sub_query_chunks": [],
        "failed_sub_query_ids": [],
        "passed_sub_query_ids": [],
        "reasoning": resp_dict.get(
            "reasoning", "Phát hiện Prompt Injection hoặc leo thang đặc quyền."
        ),
        "_next": GraphNodeID.SECURITY_KILL_SWITCH.value,
    }
