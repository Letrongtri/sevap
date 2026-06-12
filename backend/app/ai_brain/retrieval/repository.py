from typing import List, Set
from sqlalchemy import and_, or_, text
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy.orm import selectinload

from app.ai_brain.retrieval.schemas import ACCESS_LEVEL_HIERARCHY, PARContext, RetrievalResult
from app.core.enum import AccessLevel, DocumentStatus
from app.models import Document, DocumentRoleAccess, DocumentUserAccess, Department, User, UserRole, DocumentDepartmentAccess
from sqlalchemy import cast
from sqlalchemy.dialects.postgresql import JSONB


class PARRepository:
    def __init__(self, db: AsyncSession) -> None:
        self.db = db

    async def build_par_context(self, user_id: int) -> PARContext:
        """Xây dựng PAR Context từ user_id, truy vấn DB một lần."""
        
        # Lấy thông tin user
        stmt = (
            select(User)
            .options(selectinload(User.role_associations).selectinload(UserRole.role))
            .where(User.id == user_id)
        )
        result = await self.db.execute(stmt)
        user = result.scalar_one_or_none()

        highest_level = AccessLevel.PUBLIC
        is_admin = False
        role_ids = []
        department_ids = []
        managed_department_ids = []
        
        if not user:
            # Fallback: chỉ đọc public
            return PARContext(
                user_id=user_id, 
                role_ids=role_ids, 
                role_access_level=highest_level,
                department_ids=department_ids,
                managed_department_ids=managed_department_ids,
                is_admin=is_admin
            )
        
        if user.role_associations:
            # Lấy access level cao nhất trong các role
            valid_roles = [r.role for r in user.role_associations if r.role]
            if valid_roles:
                highest_level_role = max(
                    valid_roles,
                    key=lambda r: ACCESS_LEVEL_HIERARCHY.get(r.access_level, 0)
                )
                highest_level = highest_level_role.access_level
                is_admin = any(r.name == "admin" for r in valid_roles)
            role_ids = [r.role_id for r in user.role_associations]

        stmt_managed = select(Department.id).where(Department.manager_id == user_id)
        res_managed = await self.db.execute(stmt_managed)
        managed_department_ids = [row[0] for row in res_managed.fetchall()]
        
        department_ids = [user.department_id] if user.department_id else []

        
        return PARContext(
            user_id=user_id,
            role_ids=role_ids,
            role_access_level=highest_level,
            department_ids=department_ids,
            managed_department_ids=managed_department_ids,
            is_admin=is_admin
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
        allowed_ids = set()

        # Admin có quyền cao nhất, đọc toàn bộ tài liệu 
        if ctx.is_admin:
            stmt_private_admin = select(Document.id).where(
                and_(
                    Document.is_deleted == False,
                    Document.status == DocumentStatus.DONE
                )
            )
            res_private_admin = await self.db.execute(stmt_private_admin)
            allowed_ids.update({row[0] for row in res_private_admin.fetchall()})
            return allowed_ids

        # NHÁNH 1: TÀI LIỆU PUBLIC (Ai hợp lệ cũng được đọc)
        stmt_public = select(Document.id).where(
            and_(
                Document.is_deleted == False,
                Document.status == DocumentStatus.DONE,
                Document.access_level == AccessLevel.PUBLIC
            )
        )
        res_public = await self.db.execute(stmt_public)
        allowed_ids.update({row[0] for row in res_public.fetchall()})


        # NHÁNH 2: TÀI LIỆU MANAGERIAL (Chỉ Manager và Admin)
        if AccessLevel.MANAGERIAL in allowed_levels:
            stmt_managerial = select(Document.id).where(
                and_(
                    Document.is_deleted == False,
                    Document.status == DocumentStatus.DONE,
                    Document.access_level == AccessLevel.MANAGERIAL
                )
            )
            res_managerial = await self.db.execute(stmt_managerial)
            allowed_ids.update({row[0] for row in res_managerial.fetchall()})

        # NHÁNH 3: TÀI LIỆU PRIVATE
        ## Điều kiện 1: Là người upload
        private_conds = [
            Document.uploader_id == ctx.user_id,
        ] 
        
        ## Điều kiện 2: Là Quản lý của phòng ban sở hữu tài liệu đó
        if ctx.managed_department_ids:
            private_conds.append(Document.department_accesses.any(DocumentDepartmentAccess.department_id.in_(ctx.managed_department_ids)))
            
        stmt_private_base = select(Document.id).where(
            and_(
                Document.is_deleted == False,
                Document.status == DocumentStatus.DONE,
                Document.access_level == AccessLevel.PRIVATE,
                or_(*private_conds)
            )
        )
        res_private_base = await self.db.execute(stmt_private_base)
        allowed_ids.update({row[0] for row in res_private_base.fetchall()})

        ## Điều kiện 3: Gán Explicit Quyền riêng cho User qua document_user_access
        stmt_private_user = select(DocumentUserAccess.document_id).join(
            Document, Document.id == DocumentUserAccess.document_id
        ).where(
            and_(
                DocumentUserAccess.user_id == ctx.user_id,
                Document.is_deleted == False,
                Document.status == DocumentStatus.DONE,
                Document.access_level == AccessLevel.PRIVATE
            )
        )
        res_private_user = await self.db.execute(stmt_private_user)
        allowed_ids.update({row[0] for row in res_private_user.fetchall()})

        ## Điều kiện 4: Gán Explicit Quyền riêng cho Role (Ví dụ: HR chuyên trách)
        if ctx.role_ids:
            stmt_private_role = select(DocumentRoleAccess.document_id).join(
                Document, Document.id == DocumentRoleAccess.document_id
            ).where(
                and_(
                    DocumentRoleAccess.role_id.in_(ctx.role_ids),
                    Document.is_deleted == False,
                    Document.status == DocumentStatus.DONE,
                    Document.access_level == AccessLevel.PRIVATE
                )
            )
            res_private_role = await self.db.execute(stmt_private_role)
            allowed_ids.update({row[0] for row in res_private_role.fetchall()})

        return allowed_ids
    
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
                dc.meta_data        AS metadata,
                d.title             AS doc_title,
                d.access_level,
                1 - (ve.embedding <=> CAST(:qvec AS vector))  AS score
            FROM  vector_embeddings  ve
            JOIN  document_chunks    dc ON dc.id = ve.document_chunk_id
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
