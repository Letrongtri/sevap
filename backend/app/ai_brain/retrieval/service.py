import uuid_utils
from app.ai_brain.retrieval.pipeline import RetrievalPipeline
from app.ai_brain.retrieval.repository import PARRepository
from app.ai_brain.retrieval.schemas import RetrievalResult, PARContext
from app.models import ActivityLog


class RetrievalService:

    def __init__(self, repo: PARRepository, pipeline: RetrievalPipeline):
        self.repo = repo
        self.pipeline = pipeline

    async def retrieve(
        self,
        query: str,
        par_context: PARContext,
        top_k: int = 5,
    ) -> list[RetrievalResult]:

        # ── Bước 1: Relational Filter ─────────────────────────────
        allowed_ids = await self.repo.get_allowed_document_ids(par_context)

        # Generate query embedding
        query_embedding = self.pipeline.encode_query(query)

        # Check if any documents matched but were blocked by PAR
        blocked_docs = await self.repo.check_par_gate_blocked(
            query_embedding=query_embedding,
            allowed_doc_ids=allowed_ids,
            tenant_id=par_context.tenant_id,
            threshold=0.5
        )

        if blocked_docs:
            # Log PAR Gate Blocked event
            
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
            return []           # Chặn sớm — không tốn tài nguyên embedding

        # ── Bước 2: Vector Search ─────────────────────────────────
        chunks = await self.repo.similarity_search(
            query_embedding=query_embedding,
            allowed_doc_ids=allowed_ids,   # boundary từ bước 1
            tenant_id=par_context.tenant_id,
            top_k=top_k,
        )

        return chunks
    