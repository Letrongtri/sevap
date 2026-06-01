from app.ai_brain.retrieval.pipeline import RetrievalPipeline
from app.ai_brain.retrieval.repository import PARRepository
from app.ai_brain.retrieval.schemas import RetrievalResult


class RetrievalService:

    def __init__(self, repo: PARRepository, pipeline: RetrievalPipeline):
        self.repo = repo
        self.pipeline = pipeline

    async def retrieve(
        self,
        user_id: int,
        query: str,
        top_k: int = 5,
    ) -> list[RetrievalResult]:
        par_ctx = await self.repo.build_par_context(user_id)

        # ── Bước 1: Relational Filter ─────────────────────────────
        allowed_ids = await self.repo.get_allowed_document_ids(par_ctx)

        if not allowed_ids:
            return []           # Chặn sớm — không tốn tài nguyên embedding

        # ── Bước 2: Vector Search ─────────────────────────────────
        query_embedding = await self.pipeline.encode_query(query)

        chunks = await self.repo.similarity_search(
            query_embedding=query_embedding,
            allowed_doc_ids=allowed_ids,   # boundary từ bước 1
            top_k=top_k,
        )

        return chunks
    