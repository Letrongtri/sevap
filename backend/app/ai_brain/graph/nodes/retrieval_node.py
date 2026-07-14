"""
retrieval_node.py
─────────────────
Node thực thi Hybrid Search cho từng sub-query theo đồ thị phụ thuộc (DAG).

Chiến lược thực thi:
  - Câu hỏi KHÔNG có depends_on (hoặc rỗng) → đưa vào nhóm song song.
  - Câu hỏi CÓ depends_on → đợi tất cả ID phụ thuộc hoàn thành trước.
  - Mỗi "wave" (lớp không có phụ thuộc tồn đọng) được chạy song song với asyncio.gather.
"""

import asyncio
import time
from typing import Dict, List, Set

from langchain_core.runnables import RunnableConfig

from app.ai_brain.schemas import PARContext, RetrievalResult, SubQuery
from app.ai_brain.state import AgentState
from app.ai_brain.retrieval import RetrievalService
from app.core.logging import logger


# ─────────────────────────────────────────────────────────────────────────────
# Helpers
# ─────────────────────────────────────────────────────────────────────────────

def _build_waves(sub_queries: List[SubQuery]) -> List[List[SubQuery]]:
    """
    Topo-sort sub_queries thành các "wave" (lớp song song).

    Mỗi wave chứa các query mà mọi phụ thuộc đã nằm ở wave trước.
    Raise ValueError nếu phát hiện vòng tròn phụ thuộc.
    """
    id_map: Dict[int, SubQuery] = {q.id: q for q in sub_queries}
    remaining: Set[int] = set(id_map.keys())
    completed: Set[int] = set()
    waves: List[List[SubQuery]] = []

    max_iterations = len(sub_queries) + 1  # bảo vệ vòng lặp vô hạn
    iteration = 0

    while remaining:
        iteration += 1
        if iteration > max_iterations:
            raise ValueError(
                f"[RetrievalNode] Circular dependency detected in sub_queries: {remaining}"
            )

        # Lấy tất cả query chưa chạy mà phụ thuộc đã hoàn thành
        ready = [
            id_map[qid]
            for qid in remaining
            if all(dep in completed for dep in (id_map[qid].depends_on or []))
        ]

        if not ready:
            raise ValueError(
                f"[RetrievalNode] Unresolvable dependencies for sub_query IDs: {remaining}"
            )

        waves.append(ready)
        completed.update(q.id for q in ready)
        remaining -= {q.id for q in ready}

    return waves


async def _retrieve_single(
    query: SubQuery,
    par_context: PARContext,
    retrieval_service: RetrievalService,
    context_map: Dict[int, List[RetrievalResult]],
) -> List[RetrievalResult]:
    """
    Thực thi hybrid search cho một sub-query.

    Nếu query có depends_on, context của các câu trước sẽ được inject vào
    query text để tạo context-aware retrieval (multi-hop).
    """
    enriched_query = query.query

    # Multi-hop: bổ sung context từ câu hỏi phụ thuộc
    if query.depends_on:
        prior_contexts = []
        for dep_id in query.depends_on:
            prior_results = context_map.get(dep_id, [])
            if prior_results:
                combined = " ".join(r.content[:200] for r in prior_results[:2])
                prior_contexts.append(f"[Context từ Q{dep_id}]: {combined}")

        if prior_contexts:
            enriched_query = "\n".join(prior_contexts) + "\n\nCâu hỏi: " + query.query

    logger.info(
        "[RetrievalNode] Retrieving Q%d: %s", query.id, query.query
    )

    results = await retrieval_service.retrieve(
        query=enriched_query,
        par_context=par_context,
    )
    return results


# ─────────────────────────────────────────────────────────────────────────────
# Main node
# ─────────────────────────────────────────────────────────────────────────────

async def retrieval_node(state: AgentState, config: RunnableConfig) -> dict:
    """
    LangGraph node — thực thi retrieval theo DAG (song song + tuần tự).

    RetrievalService được lấy từ config["configurable"]["retrieval_service"].
    Không lưu vào AgentState — tránh serialize issue với Postgres checkpointer.

    Writes:
        retrieved_chunks  : list[RetrievalResult]  — tất cả chunk đã thu thập
        confidence_score  : float                  — điểm cao nhất trong batch
    """
    t_start = time.perf_counter()
    par_ctx: PARContext = config["configurable"]["par_ctx"]
    retrieval_service: RetrievalService = config["configurable"]["retrieval_service"]

    logger.info(
        "[RetrievalNode] Start | intent=%s | tenant=%s",
        state["intent_type"], par_ctx.tenant_id,
        extra={"tenant_id": par_ctx.tenant_id},
    )

    sub_queries: List[SubQuery] = state.get("sub_queries", [])

    # ── Fallback: single_rag không có sub_queries ────────────────────────────
    if not sub_queries:
        question = state.get("rewritten_question") or state["original_question"]
        logger.info("[RetrievalNode] No sub_queries — falling back to direct retrieve.")
        results = await retrieval_service.retrieve(
            query=question,
            par_context=par_ctx,
        )
        best_score = max((r.score for r in results), default=0.0)
        logger.info(
            "[RetrievalNode] Done in %.3fs | chunks=%d | best_score=%.3f",
            time.perf_counter() - t_start, len(results), best_score,
        )
        return {
            "retrieved_chunks": [r.model_dump() for r in results],
            "confidence_score": best_score,
        }

    # ── Xây dựng DAG và thực thi theo wave ──────────────────────────────────
    try:
        waves = _build_waves(sub_queries)
    except ValueError as e:
        logger.error(str(e))
        return {"retrieved_chunks": [], "confidence_score": 0.0}

    logger.info(
        "[RetrievalNode] Execution plan: %d wave(s) for %d sub-queries",
        len(waves), len(sub_queries),
    )

    context_map: Dict[int, List[RetrievalResult]] = {}  # id → results
    all_chunks: List[RetrievalResult] = []

    for wave_idx, wave in enumerate(waves):
        wave_ids = [q.id for q in wave]
        logger.info("[RetrievalNode] Wave %d → Q%s (parallel)", wave_idx, wave_ids)

        # Chạy song song toàn bộ các query trong cùng wave
        wave_results: List[List[RetrievalResult]] = await asyncio.gather(
            *[
                _retrieve_single(query, par_ctx, retrieval_service, context_map)
                for query in wave
            ]
        )

        for query, results in zip(wave, wave_results):
            context_map[query.id] = results
            all_chunks.extend(results)

    # ── Dedup theo chunk_id (cùng chunk có thể xuất hiện nhiều sub-query) ──
    seen_ids: Set[str] = set()
    deduped: List[RetrievalResult] = []
    for chunk in all_chunks:
        if chunk.chunk_id not in seen_ids:
            seen_ids.add(chunk.chunk_id)
            deduped.append(chunk)

    # Sắp xếp theo score giảm dần
    deduped.sort(key=lambda r: r.score, reverse=True)
    best_score = deduped[0].score if deduped else 0.0

    elapsed = time.perf_counter() - t_start
    logger.info(
        "[RetrievalNode] Done in %.3fs | waves=%d | total_chunks=%d | best_score=%.3f",
        elapsed, len(waves), len(deduped), best_score,
    )

    return {
        "retrieved_chunks": [r.model_dump() for r in deduped],
        "confidence_score": best_score,
    }
