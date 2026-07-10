import time
from typing import List

from app.ai_brain.models import get_reranker_model
from app.ai_brain.schemas import RetrievalResult
from app.ai_brain.state import AgentState
from app.core.config import settings
from app.core.logging import logger


async def rerank_node(state: AgentState) -> dict:
    """
    LangGraph node — rerank retrieved_chunks bằng CrossEncoder.

    Logic:
      1. Nếu không có chunk nào → trả về empty (pass-through).
      2. Tạo các cặp (query, chunk_content) → CrossEncoder.predict().
      3. Gán score mới, sort giảm dần, cắt top-K.
      4. Ghi vào state["reranked_chunks"] + cập nhật confidence_score.
    """
    t_start = time.perf_counter()

    raw_chunks: List[RetrievalResult] = [
        RetrievalResult(**c) if isinstance(c, dict) else c
        for c in state.get("retrieved_chunks", [])
    ]

    if not raw_chunks:
        logger.info("[RerankNode] No chunks to rerank — pass-through.")
        return {"reranked_chunks": [], "confidence_score": 0.0}

    question = state.get("rewritten_question") or state["original_question"]
    top_k: int = settings.RERANKER_TOP_K

    # ── Build pairs ──────────────────────────────────────────────────────────
    pairs = [(question, chunk.content) for chunk in raw_chunks]

    # ── Score với CrossEncoder (blocking — CPU inference) ───────────────────
    reranker = get_reranker_model()
    raw_scores: List[float] = reranker.predict(pairs, show_progress_bar=False).tolist()

    # ── Gán score mới và sort ────────────────────────────────────────────────
    scored: List[RetrievalResult] = []
    for chunk, score in zip(raw_chunks, raw_scores):
        updated = RetrievalResult(**{**chunk.model_dump(), "score": float(score)})
        scored.append(updated)

    scored.sort(key=lambda r: r.score, reverse=True)
    reranked = scored[:top_k]

    best_score = reranked[0].score if reranked else 0.0
    elapsed = time.perf_counter() - t_start

    logger.info(
        "[RerankNode] Done in %.3fs | input=%d → output=%d | best_score=%.4f",
        elapsed, len(raw_chunks), len(reranked), best_score,
    )

    return {
        "reranked_chunks": [r.model_dump() for r in reranked],
        "confidence_score": best_score,
    }
