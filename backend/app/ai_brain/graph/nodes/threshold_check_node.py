"""
threshold_check_node.py
───────────────────────
Node kiểm tra chất lượng retrieval và quyết định bước tiếp theo.

Quy tắc routing:

  N = tổng số sub-query
  F = số sub-query có best_score < threshold (failed_sub_query_ids)

  F == 0                         → FINAL_RESPONSE_GENERATOR (tất cả pass)
  F > 0 AND retry < max          → REWRITE (rewrite_node sẽ tự phân loại partial/full)
  F > 0 AND retry >= max AND F<N → FINAL_RESPONSE_GENERATOR (partial result, còn ít nhất 1 pass)
  F == N AND retry >= max        → FALLBACK_NODE (không có gì đủ tốt)

Single-rag fallback (không có sub_query_chunks):
  confidence_score >= threshold  → FINAL_RESPONSE_GENERATOR
  confidence_score <  threshold  → REWRITE / FALLBACK_NODE (logic cũ)
"""

from app.core.enum import GraphNodeID
from app.ai_brain.state import AgentState
from app.core.logging import logger
from app.core.config import settings


async def threshold_check_node(state: AgentState) -> dict:
    """
    Kiểm tra chất lượng retrieval kết quả.
    Đây là node điều phối thuần túy — không gọi LLM, không gọi DB.
    """
    retry_count    = state.get("retry_count", 0)
    max_retry      = settings.MAX_RETRY
    threshold      = settings.RETRIEVAL_RELEVANCE_THRESHOLD

    failed_ids     = state.get("failed_sub_query_ids", [])
    sub_qc         = state.get("sub_query_chunks", [])

    N = len(sub_qc) if sub_qc else 0
    F = len(failed_ids)

    # ── Per-subquery mode ────────────────────────────────────────────────────
    if N > 0:
        if F == 0:
            next_node = GraphNodeID.FINAL_RESPONSE_GENERATOR.value
            reason = "Tất cả sub-query đều pass threshold."
        elif retry_count < max_retry:
            next_node = GraphNodeID.REWRITE.value
            reason = f"{F}/{N} sub-query thất bại — tiến hành rewrite."
        elif F < N:
            # Hết retry nhưng còn ít nhất 1 sub-query pass → generate partial
            next_node = GraphNodeID.FINAL_RESPONSE_GENERATOR.value
            reason = (
                f"Hết retry ({retry_count}/{max_retry}). "
                f"{N - F}/{N} sub-query có kết quả — generate partial."
            )
        else:
            # Hết retry, tất cả đều fail
            next_node = GraphNodeID.FALLBACK_NODE.value
            reason = f"Hết retry ({retry_count}/{max_retry}). Toàn bộ {N} sub-query đều thất bại — fallback."

        logger.info(
            "[ThresholdCheck] Per-subquery | N=%d F=%d retry=%d/%d → %s | %s",
            N, F, retry_count, max_retry, next_node, reason,
        )
        return {"_next": next_node}

    # ── Flat / single-rag mode (backward compat) ─────────────────────────────
    score  = state.get("confidence_score", 0.0)
    chunks = state.get("reranked_chunks", [])

    if score > threshold and chunks:
        next_node = GraphNodeID.FINAL_RESPONSE_GENERATOR.value
    elif retry_count < max_retry:
        next_node = GraphNodeID.REWRITE.value
    else:
        next_node = GraphNodeID.FALLBACK_NODE.value

    logger.debug(
        "[ThresholdCheck] Flat mode | score=%.3f threshold=%.3f retry=%d → %s",
        score, threshold, retry_count, next_node,
    )
    return {"_next": next_node}
