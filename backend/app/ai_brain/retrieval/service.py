import asyncio
import uuid_utils
from app.ai_brain.embeddings.embedder import document_embedder
from app.ai_brain.retrieval.repository import PARRepository
from app.ai_brain.schemas import RetrievalResult, PARContext
from app.models import ActivityLog


class RetrievalService:

    def __init__(self, repo: PARRepository):
        self.repo = repo

    async def retrieve(
        self,
        query: str,
        par_context: PARContext,
        top_k: int = 30,
        rrf_k: int = 60,
    ) -> list[RetrievalResult]:
        """
        Hybrid Search Pipeline:
          1. PAR Filter  — lấy allowed document IDs (RBAC)
          2a. Vector Search — cosine similarity
          2b. Keyword Search — PostgreSQL FTS (BM25-style, unaccent)
          3. RRF Merge   — Reciprocal Rank Fusion kết hợp 2 kết quả
        """

        # ── Bước 1: Relational Filter ─────────────────────────────
        allowed_ids = await self.repo.get_allowed_document_ids(par_context)

        # Generate query embedding từ shared singleton
        query_embedding = document_embedder.encode_query(query)

        # Check if any documents matched but were blocked by PAR
        blocked_docs = await self.repo.check_par_gate_blocked(
            query_embedding=query_embedding,
            allowed_doc_ids=allowed_ids,
            tenant_id=par_context.tenant_id,
            threshold=0.5
        )

        if blocked_docs:
            meta_data = {
                "query": query,
                "blocked_documents": [
                    {
                        "document_id": doc["document_id"],
                        "doc_title": doc["doc_title"],
                        "access_level": doc["access_level"],
                        "score": float(doc["score"])
                    }
                    for doc in blocked_docs
                ]
            }

            log = ActivityLog(
                id=str(uuid_utils.uuid7()),
                user_id=par_context.user_id,
                tenant_id=par_context.tenant_id,
                action="rag.par_gate_blocked",
                resource="document",
                log_level="WARNING",
                meta_data=meta_data,
                ip_address=None
            )
            self.repo.db.add(log)
            await self.repo.db.commit()

        if not allowed_ids:
            return []  # Chặn sớm — không tốn tài nguyên embedding

        # ── Bước 2: Chạy song song Vector Search + Keyword Search ─
        fetch_k = top_k * 2  # lấy nhiều hơn để merge
        vector_results, keyword_results = await asyncio.gather(
            self.repo.similarity_search(
                query_embedding=query_embedding,
                allowed_doc_ids=allowed_ids,
                tenant_id=par_context.tenant_id,
                top_k=fetch_k,
            ),
            self.repo.keyword_search(
                query=query,
                allowed_doc_ids=allowed_ids,
                tenant_id=par_context.tenant_id,
                top_k=fetch_k,
            ),
        )

        # ── Bước 3: Reciprocal Rank Fusion ────────────────────────
        return self._rrf_merge(vector_results, keyword_results, top_k, rrf_k)

    def _rrf_merge(
        self,
        vector_results: list[RetrievalResult],
        keyword_results: list[RetrievalResult],
        top_k: int,
        rrf_k: int = 60,
    ) -> list[RetrievalResult]:
        """
        Reciprocal Rank Fusion: score = Σ 1/(k + rank_i)

        Chunk xuất hiện ở cả 2 danh sách sẽ được cộng điểm từ cả 2 rank,
        tự nhiên float lên đầu danh sách.
        """
        scores: dict[str, float] = {}
        chunk_map: dict[str, RetrievalResult] = {}

        for rank, r in enumerate(vector_results):
            scores[r.chunk_id] = scores.get(r.chunk_id, 0.0) + 1.0 / (rrf_k + rank + 1)
            chunk_map[r.chunk_id] = r

        for rank, r in enumerate(keyword_results):
            scores[r.chunk_id] = scores.get(r.chunk_id, 0.0) + 1.0 / (rrf_k + rank + 1)
            chunk_map[r.chunk_id] = r

        sorted_ids = sorted(scores, key=lambda cid: scores[cid], reverse=True)[:top_k]

        return [
            RetrievalResult(
                **{**chunk_map[cid].model_dump(), "score": scores[cid]}
            )
            for cid in sorted_ids
        ]