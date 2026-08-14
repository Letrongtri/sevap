"""
retrieval_node.py
─────────────────
Node thực thi Hybrid Search cho từng sub-query theo đồ thị phụ thuộc (DAG).

Chiến lược thực thi:
  - Câu hỏi KHÔNG có depends_on (hoặc rỗng) → đưa vào nhóm song song.
  - Câu hỏi CÓ depends_on → đợi tất cả ID phụ thuộc hoàn thành trước.
  - Mỗi "wave" (lớp không có phụ thuộc tồn đọng) được chạy song song với asyncio.gather.

Multi-hop Context-Aware Rewriting:
  - Sau khi wave N hoàn thành, với mỗi query thuộc wave N+1 có depends_on:
    1. Thu thập top-k (3) chunks của từng câu phụ thuộc từ context_map.
    2. Gọi SLM (OLLAMA_SLM_MODEL) để tổng hợp câu trả lời ngắn và viết lại
       câu hỏi bị phụ thuộc thành dạng self-contained, có đủ ngữ cảnh.
    3. Dùng câu hỏi đã viết lại để thực hiện hybrid search.
  - Chiến lược này thay thế việc gắn cố định 200 ký tự từ 2 chunk.

Partial retry:
  - Khi rewrite_node chỉ rewrite một phần sub-queries (partial rewrite),
    `passed_sub_query_ids` trong state sẽ chứa IDs của sub-query đã pass.
  - retrieval_node sẽ skip những sub-query này và giữ nguyên chunk đã có,
    chỉ retrieve lại những sub-query mới/thất bại.
"""

import asyncio
import json
import time
from typing import Dict, List, Set

from langchain_core.messages import HumanMessage, SystemMessage
from langchain_core.runnables import RunnableConfig

from app.ai_brain.llm import get_llm
from app.ai_brain.prompts import (
    CONTEXT_AWARE_REWRITE_SYSTEM_PROMPT,
    CONTEXT_AWARE_REWRITE_USER_PROMPT,
)
from app.ai_brain.schemas import PARContext, RetrievalResult, SubQuery
from app.ai_brain.state import AgentState
from app.ai_brain.retrieval import RetrievalService
from app.core.config import settings
from app.core.logging import logger
from app.utils.json_utils import clean_and_extract_json


# ─────────────────────────────────────────────────────────────────────────────
# Topo-sort helper
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


# ─────────────────────────────────────────────────────────────────────────────
# SLM context-aware rewrite helper
# ─────────────────────────────────────────────────────────────────────────────

def _format_chunks_for_prompt(chunks: List[RetrievalResult], top_k: int) -> str:
    """
    Format top-k chunks thành chuỗi văn bản để đưa vào prompt SLM.

    Mỗi chunk hiển thị nội dung gốc (không cắt cứng ký tự) theo thứ tự score giảm dần.
    """
    selected = sorted(chunks, key=lambda r: r.score, reverse=True)[:top_k]
    if not selected:
        return "  (Không có chunk nào được truy xuất)"

    lines = []
    for i, chunk in enumerate(selected, start=1):
        lines.append(f"  Chunk {i} (score={chunk.score:.3f}): {chunk.content.strip()}")
    return "\n".join(lines)


async def _slm_rewrite_query(
    dep_query: SubQuery,
    dep_chunks: List[RetrievalResult],
    dependent_query: SubQuery,
) -> str:
    """
    Gọi SLM để:
      1. Tổng hợp câu trả lời ngắn từ top-k chunks của dep_query.
      2. Viết lại dependent_query thành dạng self-contained.

    Trả về chuỗi query đã được viết lại. Nếu SLM thất bại (parse lỗi
    hoặc low_confidence), trả về câu gốc để retrieval vẫn tiếp tục.
    """
    chunks_text = _format_chunks_for_prompt(dep_chunks, top_k=settings.MAX_KNOWLEDGE_DOCUMENTS)

    user_prompt = CONTEXT_AWARE_REWRITE_USER_PROMPT.format(
        dep_id=dep_query.id,
        dep_query=dep_query.query,
        chunks_text=chunks_text,
        dependent_id=dependent_query.id,
        dependent_query=dependent_query.query,
    )

    llm = get_llm(
        model_name=settings.OLLAMA_SLM_MODEL,
        temperature=0.2,
        format_json=True,
    )

    try:
        response = await llm.ainvoke([
            SystemMessage(content=CONTEXT_AWARE_REWRITE_SYSTEM_PROMPT),
            HumanMessage(content=user_prompt),
        ])
        clean_json = clean_and_extract_json(response.content.strip())
        result = json.loads(clean_json)

        rewritten = result.get("rewritten_query", "").strip()
        low_confidence = result.get("low_confidence", False)

        if low_confidence:
            logger.warning(
                "[RetrievalNode] SLM low_confidence for Q%d→Q%d. Using rewritten anyway: %s",
                dep_query.id, dependent_query.id, rewritten,
            )

        if rewritten:
            logger.info(
                "[RetrievalNode] SLM rewrite Q%d: [%s] → [%s]",
                dependent_query.id, dependent_query.query, rewritten,
            )
            return rewritten

    except Exception as exc:
        logger.warning(
            "[RetrievalNode] SLM rewrite failed for Q%d (dep=Q%d): %s. Falling back to original.",
            dependent_query.id, dep_query.id, exc,
        )

    return dependent_query.query


async def _build_enriched_query(
    query: SubQuery,
    context_map: Dict[int, List[RetrievalResult]],
    id_map: Dict[int, SubQuery],
) -> str:
    """
    Với mỗi dependency của `query`, gọi SLM rewrite tuần tự (nếu có nhiều dep,
    mỗi dep sẽ enrich thêm).

    Trả về chuỗi query đã được enrich với ngữ cảnh từ tất cả dependencies.

    Lưu ý: nếu query có nhiều depends_on, chúng ta gọi SLM lần lượt cho từng dep,
    kết quả rewrite của dep trước làm đầu vào cho dep tiếp theo để tích lũy ngữ cảnh.
    """
    if not query.depends_on:
        return query.query

    current_query_text = query.query

    for dep_id in query.depends_on:
        dep_chunks = context_map.get(dep_id, [])
        dep_sub_query = id_map.get(dep_id)

        if not dep_sub_query:
            logger.warning(
                "[RetrievalNode] depends_on ID=%d không tồn tại trong id_map. Bỏ qua.", dep_id
            )
            continue

        if not dep_chunks:
            logger.warning(
                "[RetrievalNode] Q%d depends on Q%d nhưng Q%d không có chunks. "
                "Giữ câu hỏi hiện tại.",
                query.id, dep_id, dep_id,
            )
            continue

        # Tạo SubQuery tạm thời với text hiện tại (đã enrich từ dep trước)
        current_as_subquery = SubQuery(
            id=query.id,
            query=current_query_text,
            depends_on=query.depends_on,
        )

        current_query_text = await _slm_rewrite_query(
            dep_query=dep_sub_query,
            dep_chunks=dep_chunks,
            dependent_query=current_as_subquery,
        )

    return current_query_text


# ─────────────────────────────────────────────────────────────────────────────
# Single query retrieval helper
# ─────────────────────────────────────────────────────────────────────────────

async def _retrieve_single(
    query: SubQuery,
    par_context: PARContext,
    retrieval_service: RetrievalService,
    context_map: Dict[int, List[RetrievalResult]],
    id_map: Dict[int, SubQuery],
    time_range: dict | None = None,
) -> List[RetrievalResult]:
    """
    Thực thi hybrid search cho một sub-query.

    Nếu query có depends_on:
      - Gọi SLM để tổng hợp context từ chunks của câu phụ thuộc.
      - Viết lại câu hỏi thành dạng self-contained trước khi retrieve.
    """
    enriched_query = await _build_enriched_query(query, context_map, id_map)

    logger.info(
        "[RetrievalNode] Retrieving Q%d | enriched=%s | time_sensitive=%s",
        query.id,
        "yes" if enriched_query != query.query else "no",
        time_range.get("is_time_sensitive", False) if time_range else False,
    )

    results = await retrieval_service.retrieve(
        query=enriched_query,
        par_context=par_context,
        time_range=time_range,
    )
    return results


# ─────────────────────────────────────────────────────────────────────────────
# Main node
# ─────────────────────────────────────────────────────────────────────────────

async def retrieval_node(state: AgentState, config: RunnableConfig) -> dict:
    """
    LangGraph node — thực thi retrieval theo DAG.

    Execution model:
      - Các query trong cùng wave chạy SONG SONG với asyncio.gather.
      - Các wave chạy TUẦN TỰ: wave sau đợi wave trước hoàn toàn.
      - Trước mỗi wave, các query có depends_on được viết lại qua SLM
        dựa trên chunks đã thu thập từ wave trước.

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
    time_range: dict | None = state.get("time_range")

    # ── Fallback: single_rag không có sub_queries ────────────────────────────
    if not sub_queries:
        question = state.get("rewritten_question") or state["original_question"]
        logger.info("[RetrievalNode] No sub_queries — falling back to direct retrieve.")
        results = await retrieval_service.retrieve(
            query=question,
            par_context=par_ctx,
            time_range=time_range,
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
        # id_map toàn bộ (kể cả passed) để _build_enriched_query có thể resolve dep
        id_map: Dict[int, SubQuery] = {q.id: q for q in sub_queries}

        try:
            waves = _build_waves(queries_to_retrieve)
        except ValueError as e:
            logger.error(str(e))
            return {"retrieved_chunks": [], "sub_query_chunks": [], "confidence_score": 0.0}

        logger.info(
            "[RetrievalNode] Execution plan: %d wave(s) for %d sub-queries",
            len(waves), len(queries_to_retrieve),
        )

        # context_map: id → List[RetrievalResult] — dùng cho multi-hop
        # Khởi tạo với chunks của passed sub-queries (nếu có) để dep resolve đúng
        context_map: Dict[int, List[RetrievalResult]] = {}
        for entry in existing_sqc:
            sqid = entry["sub_query_id"]
            if sqid in passed_ids:
                # Reconstruct RetrievalResult từ dict đã lưu (chỉ cần score + content)
                context_map[sqid] = [
                    RetrievalResult(**chunk)
                    for chunk in entry.get("chunks", [])
                ]

        new_sqc_map: Dict[int, dict] = {}

        for wave_idx, wave in enumerate(waves):
            wave_ids = [q.id for q in wave]
            logger.info("[RetrievalNode] Wave %d → Q%s (parallel)", wave_idx, wave_ids)

            # Chạy song song tất cả query trong wave
            wave_results: List[List[RetrievalResult]] = await asyncio.gather(
                *[
                    _retrieve_single(query, par_ctx, retrieval_service, context_map, id_map, time_range)
                    for query in wave
                ]
            )

            # Cập nhật context_map sau khi wave hoàn thành
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
