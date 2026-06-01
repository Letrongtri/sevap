from typing import Any, Dict, List, Set
from sqlalchemy import and_, or_, text
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select

from app.ai_brain.retrieval.schemas import ACCESS_LEVEL_HIERARCHY, PARContext, RetrievalResult
from app.core.enum import AccessLevel, DocumentStatus
from app.models import Document, DocumentRoleAccess, Role, UserRole


class PARRepository:
    def __init__(self, db: AsyncSession) -> None:
        self.db = db

    async def build_par_context(self, user_id: int) -> PARContext:
        """Xây dựng PAR Context từ user_id, truy vấn DB một lần."""
        
        # Lấy tất cả roles của user
        stmt = (
            select(Role)
            .join(UserRole, UserRole.role_id == Role.id)
            .where(UserRole.user_id == user_id)
        )
        result = await self.db.execute(stmt)
        roles = result.scalars().all()
        
        if not roles:
            # Fallback: chỉ đọc public
            return PARContext(user_id=user_id, role_ids=[], role_access_level="public")
        
        # Lấy access level cao nhất trong các role
        highest_level = max(
            roles,
            key=lambda r: ACCESS_LEVEL_HIERARCHY.get(r.access_level, 0)
        )
        
        return PARContext(
            user_id=user_id,
            role_ids=[r.id for r in roles],
            role_access_level=highest_level.access_level,
        )

    async def get_allowed_document_ids(
        self,
        ctx: PARContext,
    ) -> Set[int]:
        """
        Relational Filter.
        Trả về SET document_ids mà user được phép đọc.
        Chạy hoàn toàn trên PostgreSQL quan hệ, không liên quan vector.
        """

        allowed_levels = ctx.allowed_access_levels()

        # --- Nhánh A: Document public theo access_level ---
        # Bất kỳ document nào có access_level nằm trong phạm vi của user
        # Với 'private': KHÔNG dùng nhánh này — dùng nhánh B bên dưới
        # để tránh user A đọc private doc của user B
        stmt_level = (
            select(Document.id)
            .where(
                and_(
                    Document.is_deleted == False,
                    Document.status == DocumentStatus.DONE,
                    Document.access_level.in_(allowed_levels),
                    or_( # Không lấy document private
                        Document.access_level == AccessLevel.PUBLIC,
                        Document.access_level == AccessLevel.MANAGERIAL,
                    )
                )
            )
        )

        # --- Nhánh B: Document 'private' được gán explicit cho role của user ---
        # Qua bảng document_role_access (PAR Gate fine-grained)
        stmt_role = (
            select(DocumentRoleAccess.document_id)
            .join(Document, Document.id == DocumentRoleAccess.document_id)
            .where(
                and_(
                    DocumentRoleAccess.role_id.in_(ctx.role_ids) if ctx.role_ids else False,
                    Document.is_deleted == False,
                    Document.status == DocumentStatus.DONE,
                )
            )
        )

        result_level = await self.db.execute(stmt_level)
        result_role  = await self.db.execute(stmt_role)

        ids_from_level = {row[0] for row in result_level.fetchall()}
        ids_from_role  = {row[0] for row in result_role.fetchall()}

        # Union: được phép nếu thoả MỘT TRONG HAI điều kiện
        return ids_from_level | ids_from_role

    async def similarity_search(
        self,
        query_embedding: List[float],
        allowed_doc_ids: Set[int],
        top_k: int = 5,
    ) -> List[RetrievalResult]:
        """
        Bước 2 — Vector Search.
        Chỉ tìm kiếm trong vùng allowed_doc_ids — không biết gì về RBAC.
        """

        if not allowed_doc_ids:
            return []

        vec_literal = "[" + ",".join(str(v) for v in query_embedding) + "]"

        sql = text("""
            SELECT
                dc.id               AS chunk_id,
                dc.document_id,
                dc.content,
                dc.metadata,
                d.title             AS doc_title,
                d.access_level,
                1 - (ve.embedding <=> CAST(:qvec AS vector))  AS score
            FROM  vector_embeddings  ve
            JOIN  document_chunks    dc ON dc.id = ve.chunk_id
            JOIN  documents          d  ON d.id  = dc.document_id
            WHERE
                dc.document_id  = ANY(:doc_ids)     -- ← PAR boundary inject
                AND dc.embedding_status = 'done'
                AND d.is_deleted = FALSE
            ORDER BY
                ve.embedding <=> CAST(:qvec AS vector)  -- cosine distance ASC
            LIMIT :top_k
        """)

        result = await self.db.execute(sql, {
            "qvec":    vec_literal,
            "doc_ids": list(allowed_doc_ids),
            "top_k":   top_k,
        })

        return [
            RetrievalResult(
                chunk_id=row.chunk_id,
                document_id=row.document_id,
                content=row.content,
                score=row.score,
                doc_title=row.doc_title,
                metadata=row.metadata,
            )
            for row in result.mappings().fetchall()
        ]
