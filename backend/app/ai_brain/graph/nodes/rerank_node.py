"""
rerank_node.py
──────────────
Node rerank kết quả retrieval bằng CrossEncoder.

- Nếu có sub_query_chunks trong state → rerank riêng từng sub-query với
đúng sub_query_text của nó.
- Mỗi sub-query lấy top-K chunk sau rerank.
- Tính best_score của từng sub-query và ghi vào sub_query_chunks.
- Xác định failed_sub_query_ids (best_score < threshold) và
passed_sub_query_ids (best_score >= threshold).
- Fallback: nếu không có sub_query_chunks (single_rag) → rerank phẳng.
"""

import time
from typing import List, Set

from app.ai_brain.models import get_reranker_model
from app.ai_brain.schemas import RetrievalResult
from app.ai_brain.state import AgentState
from app.core.config import settings
from app.core.logging import logger


async def rerank_node(state: AgentState) -> dict:
    """
    LangGraph node — rerank retrieved chunks bằng CrossEncoder.

    Per-subquery mode (khi có sub_query_chunks):
      1. Lấy sub_query_chunks từ state.
      2. Với mỗi sub-query: tạo pairs (sub_query_text, chunk_content) →
         CrossEncoder.predict() → sort → top-K.
      3. Cập nhật best_score cho mỗi sub-query.
      4. Ghi failed_sub_query_ids và passed_sub_query_ids.

    Flat mode (single_rag fallback):
      - Rerank toàn bộ chunks với rewritten_question.
    """
    t_start = time.perf_counter()
    top_k: int = settings.RERANKER_TOP_K
    threshold: float = settings.RETRIEVAL_RELEVANCE_THRESHOLD
    reranker = get_reranker_model()

    sub_query_chunks: List[dict] = state.get("sub_query_chunks", [])

    # ── PER-SUBQUERY MODE ────────────────────────────────────────────────────
    if sub_query_chunks:
        updated_sqc: List[dict] = []
        all_reranked_flat: List[dict] = []
        failed_ids: List[int] = []
        passed_ids: List[int] = []
        seen_chunk_ids: Set[str] = set()

        for entry in sub_query_chunks:
            sq_id: int = entry["sub_query_id"]
            sq_text: str = entry["sub_query_text"]
            raw_chunks: List[dict] = entry.get("chunks", [])

            if not raw_chunks:
                logger.info(
                    "[RerankNode] Q%d: no chunks — marking as failed.", sq_id
                )
                updated_sqc.append({**entry, "chunks": [], "best_score": 0.0})
                failed_ids.append(sq_id)
                continue

            # Build pairs với đúng query của sub-query này
            pairs = [(sq_text, chunk["content"]) for chunk in raw_chunks]

            # CrossEncoder predict
            raw_scores: List[float] = reranker.predict(
                pairs, show_progress_bar=False
            ).tolist()

            # Gán score mới, sort giảm dần, cắt top-K
            scored = sorted(
                [
                    {**chunk, "score": float(score)}
                    for chunk, score in zip(raw_chunks, raw_scores)
                ],
                key=lambda c: c["score"],
                reverse=True,
            )
            reranked_chunks = scored[:top_k]
            best_score = reranked_chunks[0]["score"] if reranked_chunks else 0.0

            updated_sqc.append({
                **entry,
                "chunks": reranked_chunks,
                "best_score": best_score,
            })

            # Phân loại pass/fail
            if best_score >= threshold:
                passed_ids.append(sq_id)
            else:
                failed_ids.append(sq_id)

            logger.info(
                "[RerankNode] Q%d ('%s') | input=%d → output=%d | best=%.4f | %s",
                sq_id, sq_text[:50], len(raw_chunks), len(reranked_chunks),
                best_score, "PASS" if best_score >= threshold else "FAIL",
            )

            # Tích lũy flat list (dedup)
            for chunk in reranked_chunks:
                cid = chunk.get("chunk_id", "")
                if cid not in seen_chunk_ids:
                    seen_chunk_ids.add(cid)
                    all_reranked_flat.append(chunk)

        # Sort flat list theo score
        all_reranked_flat.sort(key=lambda c: c.get("score", 0.0), reverse=True)
        overall_best = all_reranked_flat[0]["score"] if all_reranked_flat else 0.0

        elapsed = time.perf_counter() - t_start
        logger.info(
            "[RerankNode] Per-subquery done in %.3fs | "
            "sub_queries=%d | passed=%d | failed=%d | overall_best=%.4f",
            elapsed, len(sub_query_chunks), len(passed_ids), len(failed_ids), overall_best,
        )

        return {
            "reranked_chunks": all_reranked_flat,
            "sub_query_chunks": updated_sqc,
            "failed_sub_query_ids": failed_ids,
            "passed_sub_query_ids": passed_ids,
            "confidence_score": overall_best,
        }

    # ── FLAT MODE (single_rag fallback) ──────────────────────────────────────
    raw_chunks: List[RetrievalResult] = [
        RetrievalResult(**c) if isinstance(c, dict) else c
        for c in state.get("retrieved_chunks", [])
    ]

    if not raw_chunks:
        logger.info("[RerankNode] No chunks to rerank — pass-through.")
        return {
            "reranked_chunks": [],
            "sub_query_chunks": [],
            "failed_sub_query_ids": [],
            "passed_sub_query_ids": [],
            "confidence_score": 0.0,
        }

    question = state.get("rewritten_question") or state["original_question"]
    pairs = [(question, chunk.content) for chunk in raw_chunks]
    raw_scores: List[float] = reranker.predict(pairs, show_progress_bar=False).tolist()

    scored: List[RetrievalResult] = []
    for chunk, score in zip(raw_chunks, raw_scores):
        updated = RetrievalResult(**{**chunk.model_dump(), "score": float(score)})
        scored.append(updated)

    scored.sort(key=lambda r: r.score, reverse=True)
    reranked = scored[:top_k]
    best_score = reranked[0].score if reranked else 0.0

    elapsed = time.perf_counter() - t_start
    logger.info(
        "[RerankNode] Flat mode done in %.3fs | input=%d → output=%d | best_score=%.4f",
        elapsed, len(raw_chunks), len(reranked), best_score,
    )

    return {
        "reranked_chunks": [r.model_dump() for r in reranked],
        "sub_query_chunks": [],
        "failed_sub_query_ids": [],
        "passed_sub_query_ids": [],
        "confidence_score": best_score,
    }
