import asyncio
import uuid_utils
from typing import List, Set
from sqlalchemy import and_, or_, text, case, func, literal
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy.orm import selectinload

from app.ai_brain.schemas import ACCESS_LEVEL_HIERARCHY, PARContext, RetrievalResult, UserSecurityContext
from app.core.enum import AccessLevel, DocumentStatus, LogLevel, DocumentAccessPolicyConditionType
from app.models import (
    Document, DocumentUserAccess, User, UserRole, 
    DocumentAccessPolicy, AccessPolicyCondition, ActivityLog
)


def _format_vector(embedding: List[float] | list) -> str | None:
    if not embedding:
        return None
    if isinstance(embedding[0], (list, tuple)):
        if not embedding[0]:
            return None
        embedding = embedding[0]
    return "[" + ",".join(str(float(v)) for v in embedding) + "]"


class PARRepository:
    def __init__(self, db: AsyncSession) -> None:
        self.db = db
        self._lock = asyncio.Lock()

    async def log_activity(self, log: ActivityLog) -> None:
        async with self._lock:
            try:
                self.db.add(log)
                await self.db.commit()
            except Exception:
                try:
                    await self.db.rollback()
                except Exception:
                    pass

    async def build_par_context(self, security_ctx: UserSecurityContext) -> PARContext:
        """
        PAR Filter — bước 0 của RAG pipeline.

        Nhận UserSecurityContext (identity) từ HTTP layer,
        truy vấn DB một lần duy nhất để giải quyết RBAC,
        trả về PARContext (authorization) cho retrieval engine.

        Raises:
            ValueError: Nếu user không tồn tại hoặc không thuộc tenant.
        """
        async with self._lock:
            user_id = security_ctx.user_id
            tenant_id = security_ctx.tenant_id
            try:
                stmt = (
                    select(User)
                    .options(selectinload(User.role_associations).selectinload(UserRole.role))
                    .where(User.id == user_id)
                )
                result = await self.db.execute(stmt)
                user = result.scalar_one_or_none()

                if not user or user.tenant_id != tenant_id:
                    raise ValueError(f"User '{user_id}' not found or does not belong to tenant '{tenant_id}'")

                highest_level = AccessLevel.PUBLIC
                role_ids: list[str] = []
                department_ids: list[str] = []
                job_title_ids: list[str] = []

                if user.role_associations:
                    valid_roles = [r.role for r in user.role_associations if r.role]
                    if valid_roles:
                        highest_level_role = max(
                            valid_roles,
                            key=lambda r: ACCESS_LEVEL_HIERARCHY.get(r.access_level, 0)
                        )
                        highest_level = highest_level_role.access_level
                    role_ids = [r.role_id for r in user.role_associations]

                department_ids = [user.department_id] if user.department_id else []
                job_title_ids = [user.job_title_id] if getattr(user, "job_title_id", None) else []

                return PARContext(
                    user_id=user_id,
                    tenant_id=tenant_id,
                    role_ids=role_ids,
                    role_access_level=highest_level,
                    department_ids=department_ids,
                    job_title_ids=job_title_ids,
                )
            except Exception as e:
                try:
                    await self.db.rollback()
                except Exception:
                    pass
                log = ActivityLog(
                    id=str(uuid_utils.uuid7()),
                    user_id=user_id,
                    tenant_id=tenant_id,
                    action="rag.par_build_failed",
                    resource="user",
                    log_level=LogLevel.ERROR,
                    meta_data={"error": str(e)},
                    ip_address=security_ctx.ip_address,
                )
                try:
                    self.db.add(log)
                    await self.db.commit()
                except Exception:
                    try:
                        await self.db.rollback()
                    except Exception:
                        pass
                raise e

    async def get_allowed_document_ids(
        self,
        ctx: PARContext,
    ) -> Set[str]:
        """
        Relational Filter.
        Trả về SET document_ids mà user được phép đọc.
        Chạy hoàn toàn trên PostgreSQL quan hệ, không liên quan vector.
        """
        async with self._lock:
            try:
                allowed_levels = ctx.allowed_access_levels()
                allowed_ids = set()

                # NHÁNH 1: TÀI LIỆU PUBLIC (Ai hợp lệ cũng được đọc)
                stmt_public = select(Document.id).where(
                    and_(
                        Document.tenant_id == ctx.tenant_id,
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
                            Document.tenant_id == ctx.tenant_id,
                            Document.is_deleted == False,
                            Document.status == DocumentStatus.DONE,
                            Document.access_level == AccessLevel.MANAGERIAL
                        )
                    )
                    res_managerial = await self.db.execute(stmt_managerial)
                    allowed_ids.update({row[0] for row in res_managerial.fetchall()})

                # NHÁNH 3: TÀI LIỆU PRIVATE (Hợp của 2 nguồn cấp quyền)
                # Nguồn 1: Uploader OR explicit DocumentUserAccess
                stmt_private_direct = select(Document.id).outerjoin(
                    DocumentUserAccess, DocumentUserAccess.document_id == Document.id
                ).where(
                    and_(
                        Document.tenant_id == ctx.tenant_id,
                        Document.is_deleted == False,
                        Document.status == DocumentStatus.DONE,
                        Document.access_level == AccessLevel.PRIVATE,
                        or_(
                            Document.uploader_id == ctx.user_id,
                            DocumentUserAccess.user_id == ctx.user_id
                        )
                    )
                )
                res_private_direct = await self.db.execute(stmt_private_direct)
                allowed_ids.update({row[0] for row in res_private_direct.fetchall()})

                # Nguồn 2: Policy Groups (Policy-based AND logic inside each group)
                match_conditions = []
                if ctx.role_ids:
                    match_conditions.append(
                        and_(
                            AccessPolicyCondition.condition_type == DocumentAccessPolicyConditionType.ROLES.value,
                            AccessPolicyCondition.condition_value_id.in_(ctx.role_ids)
                        )
                    )
                if ctx.department_ids:
                    match_conditions.append(
                        and_(
                            AccessPolicyCondition.condition_type == DocumentAccessPolicyConditionType.DEPARTMENTS.value,
                            AccessPolicyCondition.condition_value_id.in_(ctx.department_ids)
                        )
                    )
                if ctx.job_title_ids:
                    match_conditions.append(
                        and_(
                            AccessPolicyCondition.condition_type == DocumentAccessPolicyConditionType.JOB_TITLES.value,
                            AccessPolicyCondition.condition_value_id.in_(ctx.job_title_ids)
                        )
                    )

                if match_conditions:
                    user_match_expr = case((or_(*match_conditions), 1), else_=None)
                else:
                    user_match_expr = case((literal(False), 1), else_=None)

                stmt_private_policy = (
                    select(DocumentAccessPolicy.document_id)
                    .join(Document, Document.id == DocumentAccessPolicy.document_id)
                    .join(AccessPolicyCondition, AccessPolicyCondition.policy_id == DocumentAccessPolicy.id)
                    .where(
                        and_(
                            Document.tenant_id == ctx.tenant_id,
                            Document.is_deleted == False,
                            Document.status == DocumentStatus.DONE,
                            Document.access_level == AccessLevel.PRIVATE
                        )
                    )
                    .group_by(DocumentAccessPolicy.id, DocumentAccessPolicy.document_id)
                    .having(
                        func.count(AccessPolicyCondition.id) == func.count(user_match_expr)
                    )
                )
                res_private_policy = await self.db.execute(stmt_private_policy)
                allowed_ids.update({row[0] for row in res_private_policy.fetchall()})

                return allowed_ids
            except Exception as e:
                try:
                    await self.db.rollback()
                except Exception:
                    pass
                raise e

    async def similarity_search(
        self,
        query_embedding: List[float],
        allowed_doc_ids: Set[str],
        tenant_id: str,
        top_k: int = 5,
    ) -> List[RetrievalResult]:
        """
        Bước 2 — Vector Search.
        Chỉ tìm kiếm trong vùng allowed_doc_ids — không biết gì về RBAC.
        """
        async with self._lock:
            if not allowed_doc_ids or not query_embedding:
                return []

            vec_literal = _format_vector(query_embedding)
            if not vec_literal:
                return []

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
                    d.tenant_id = :tenant_id
                    AND dc.document_id  = ANY(CAST(:doc_ids AS VARCHAR[]))     -- ← PAR boundary inject
                    AND dc.embedding_status = 'done'
                    AND d.is_deleted = FALSE
                ORDER BY
                    ve.embedding <=> CAST(:qvec AS vector)  -- cosine distance ASC
                LIMIT :top_k
            """)

            try:
                result = await self.db.execute(sql, {
                    "qvec":    vec_literal,
                    "doc_ids": list(allowed_doc_ids),
                    "tenant_id": tenant_id,
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
            except Exception as e:
                try:
                    await self.db.rollback()
                except Exception:
                    pass
                raise e

    async def keyword_search(
        self,
        query: str,
        allowed_doc_ids: Set[str],
        tenant_id: str,
        top_k: int = 5,
    ) -> List[RetrievalResult]:
        """
        Bước 2b — Full-Text Search (BM25-style).
        Dùng PostgreSQL ts_rank_cd + unaccent cho tiếng Việt.
        Chỉ tìm trong vùng allowed_doc_ids — tuân thủ PAR boundary.
        """
        async with self._lock:
            if not allowed_doc_ids:
                return []

            sql = text("""
                SELECT
                    dc.id               AS chunk_id,
                    dc.document_id,
                    dc.content,
                    dc.meta_data        AS metadata,
                    d.title             AS doc_title,
                    d.access_level,
                    ts_rank_cd(
                        dc.content_tsv,
                        plainto_tsquery('simple', immutable_unaccent(:query))
                    ) AS score
                FROM  document_chunks  dc
                JOIN  documents        d  ON d.id = dc.document_id
                WHERE
                    d.tenant_id = :tenant_id
                    AND dc.document_id = ANY(CAST(:doc_ids AS VARCHAR[]))
                    AND dc.embedding_status = 'done'
                    AND d.is_deleted = FALSE
                    AND dc.content_tsv @@ plainto_tsquery('simple', immutable_unaccent(:query))
                ORDER BY score DESC
                LIMIT :top_k
            """)

            try:
                result = await self.db.execute(sql, {
                    "query":    query,
                    "doc_ids":  list(allowed_doc_ids),
                    "tenant_id": tenant_id,
                    "top_k":    top_k,
                })

                return [
                    RetrievalResult(
                        chunk_id=row.chunk_id,
                        document_id=row.document_id,
                        content=row.content,
                        score=float(row.score),
                        doc_title=row.doc_title,
                        metadata=row.metadata,
                    )
                    for row in result.mappings().fetchall()
                ]
            except Exception as e:
                try:
                    await self.db.rollback()
                except Exception:
                    pass
                raise e


    async def check_par_gate_blocked(
        self,
        query_embedding: List[float],
        allowed_doc_ids: Set[str],
        tenant_id: str,
        threshold: float = 0.5
    ) -> List[dict]:
        """
        Check if there are any chunks in the tenant matching the query
        that were excluded from allowed_doc_ids (i.e., blocked by PAR gate).
        """
        async with self._lock:
            if not query_embedding:
                return []

            vec_literal = _format_vector(query_embedding)
            if not vec_literal:
                return []
            
            sql = text("""
                SELECT
                    d.id AS document_id,
                    d.title AS doc_title,
                    d.access_level,
                    1 - (ve.embedding <=> CAST(:qvec AS vector)) AS score
                FROM vector_embeddings ve
                JOIN document_chunks dc ON dc.id = ve.document_chunk_id
                JOIN documents d ON d.id = dc.document_id
                WHERE
                    d.tenant_id = :tenant_id
                    AND dc.embedding_status = 'done'
                    AND d.is_deleted = FALSE
                    AND (:doc_ids_empty = TRUE OR NOT (dc.document_id = ANY(CAST(:doc_ids AS VARCHAR[]))))
                    AND (1 - (ve.embedding <=> CAST(:qvec AS vector))) >= :threshold
                ORDER BY score DESC
                LIMIT 10
            """)
            
            try:
                result = await self.db.execute(sql, {
                    "qvec": vec_literal,
                    "tenant_id": tenant_id,
                    "doc_ids": list(allowed_doc_ids) if allowed_doc_ids else [],
                    "doc_ids_empty": len(allowed_doc_ids) == 0,
                    "threshold": threshold
                })
                
                seen = set()
                deduped = []
                for row in result.mappings().fetchall():
                    if row.document_id not in seen:
                        seen.add(row.document_id)
                        deduped.append({
                            "document_id": row.document_id,
                            "doc_title": row.doc_title,
                            "access_level": row.access_level,
                            "score": row.score
                        })
                return deduped
            except Exception as e:
                try:
                    await self.db.rollback()
                except Exception:
                    pass
                raise e
