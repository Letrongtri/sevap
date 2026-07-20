"""
retrieval_node.py
─────────────────
Node thực thi Hybrid Search cho từng sub-query theo đồ thị phụ thuộc (DAG).

Chiến lược thực thi:
  - Câu hỏi KHÔNG có depends_on (hoặc rỗng) → đưa vào nhóm song song.
  - Câu hỏi CÓ depends_on → đợi tất cả ID phụ thuộc hoàn thành trước.
  - Mỗi "wave" (lớp không có phụ thuộc tồn đọng) được chạy song song với asyncio.gather.

Partial retry:
  - Khi rewrite_node chỉ rewrite một phần sub-queries (partial rewrite),
    `passed_sub_query_ids` trong state sẽ chứa IDs của sub-query đã pass.
  - retrieval_node sẽ skip những sub-query này và giữ nguyên chunk đã có,
    chỉ retrieve lại những sub-query mới/thất bại.
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

    Partial retry support:
        - Nếu state["passed_sub_query_ids"] không rỗng, những sub-query đó
          sẽ được bỏ qua và chunk cũ được giữ nguyên từ state["sub_query_chunks"].
        - Chỉ retrieve các sub-query KHÔNG nằm trong passed_sub_query_ids.

    Writes:
        retrieved_chunks    : list[RetrievalResult]  — tất cả chunk đã thu thập (flat)
        sub_query_chunks    : list[dict]             — map per-subquery chunks
        confidence_score    : float                  — điểm cao nhất trong batch
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
            "sub_query_chunks": [],  # single_rag không dùng sub_query_chunks
            "confidence_score": best_score,
        }

    # ── Partial retry: lấy sub_query_chunks đã có của các sub-query đã pass ─
    passed_ids: Set[int] = set(state.get("passed_sub_query_ids", []))
    existing_sqc: List[dict] = state.get("sub_query_chunks", [])

    # Build map từ id → existing sqc entry (để giữ lại khi skip)
    existing_sqc_map: Dict[int, dict] = {
        entry["sub_query_id"]: entry
        for entry in existing_sqc
    }

    # Chỉ retrieve những sub-query chưa pass
    queries_to_retrieve: List[SubQuery] = [
        q for q in sub_queries if q.id not in passed_ids
    ]

    if passed_ids:
        logger.info(
            "[RetrievalNode] Partial retry — skipping passed sub-queries: %s | retrieving: %s",
            sorted(passed_ids),
            [q.id for q in queries_to_retrieve],
        )

    # ── Xây dựng DAG và thực thi theo wave ──────────────────────────────────
    if queries_to_retrieve:
        try:
            waves = _build_waves(queries_to_retrieve)
        except ValueError as e:
            logger.error(str(e))
            return {"retrieved_chunks": [], "sub_query_chunks": [], "confidence_score": 0.0}

        logger.info(
            "[RetrievalNode] Execution plan: %d wave(s) for %d sub-queries",
            len(waves), len(queries_to_retrieve),
        )

        context_map: Dict[int, List[RetrievalResult]] = {}
        new_sqc_map: Dict[int, dict] = {}  # id → new sqc entry

        for wave_idx, wave in enumerate(waves):
            wave_ids = [q.id for q in wave]
            logger.info("[RetrievalNode] Wave %d → Q%s", wave_idx, wave_ids)

            wave_results: List[List[RetrievalResult]] = []
            for query in wave:
                results = await _retrieve_single(query, par_ctx, retrieval_service, context_map)
                wave_results.append(results)

            for query, results in zip(wave, wave_results):
                context_map[query.id] = results
                new_sqc_map[query.id] = {
                    "sub_query_id": query.id,
                    "sub_query_text": query.query,
                    "chunks": [r.model_dump() for r in results],
                    "best_score": max((r.score for r in results), default=0.0),
                }
    else:
        new_sqc_map = {}

    # ── Merge: kết hợp passed chunks với new chunks ──────────────────────────
    merged_sqc: List[dict] = []
    for q in sub_queries:
        if q.id in passed_ids and q.id in existing_sqc_map:
            merged_sqc.append(existing_sqc_map[q.id])
        elif q.id in new_sqc_map:
            merged_sqc.append(new_sqc_map[q.id])
        else:
            # sub-query không có kết quả (edge case)
            merged_sqc.append({
                "sub_query_id": q.id,
                "sub_query_text": q.query,
                "chunks": [],
                "best_score": 0.0,
            })

    # ── Flat list: dedup theo chunk_id để backward compat ───────────────────
    seen_ids: Set[str] = set()
    all_chunks_flat: List[dict] = []
    for entry in merged_sqc:
        for chunk in entry["chunks"]:
            chunk_id = chunk.get("chunk_id", "")
            if chunk_id not in seen_ids:
                seen_ids.add(chunk_id)
                all_chunks_flat.append(chunk)

    # Sắp xếp flat list theo score giảm dần
    all_chunks_flat.sort(key=lambda r: r.get("score", 0.0), reverse=True)
    best_score = all_chunks_flat[0].get("score", 0.0) if all_chunks_flat else 0.0

    elapsed = time.perf_counter() - t_start
    logger.info(
        "[RetrievalNode] Done in %.3fs | sub_queries=%d | total_unique_chunks=%d | best_score=%.3f",
        elapsed, len(sub_queries), len(all_chunks_flat), best_score,
    )

    return {
        "retrieved_chunks": all_chunks_flat,
        "sub_query_chunks": merged_sqc,
        "confidence_score": best_score,
    }
