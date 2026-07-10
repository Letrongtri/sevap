from app.core.enum import GraphNodeID
from app.ai_brain.state import AgentState
from app.core.logging import logger
from app.core.config import settings


async def threshold_check_node(state: AgentState) -> dict:
    """
    Kiểm tra chất lượng retrieval kết quả.
    Đây là node điều phối thuần túy — không gọi LLM, không gọi DB.

    Đọc từ reranked_chunks (output của rerank_node) thay vì retrieved_chunks.
    """
    score       = state.get("confidence_score", 0.0)
    retry_count = state.get("retry_count", 0)
    chunks      = state.get("reranked_chunks", [])

    retrieval_threshold = settings.RETRIEVAL_RELEVANCE_THRESHOLD
    max_retry = settings.MAX_RETRY

    if score > retrieval_threshold and chunks:
        next_node = GraphNodeID.FINAL_RESPONSE_GENERATOR.value
    elif retry_count < max_retry:
        next_node = GraphNodeID.REWRITE.value
    else:
        next_node = GraphNodeID.FALLBACK_NODE.value

    logger.debug(
        "ThresholdCheck: score=%.3f threshold=%.3f retry=%d → %s",
        score, retrieval_threshold, retry_count, next_node
    )
    return {"_next": next_node}
