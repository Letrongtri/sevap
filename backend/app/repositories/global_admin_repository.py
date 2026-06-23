from datetime import datetime
from sqlalchemy import func, text
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from app.models import Tenants, DocumentChunk, User, UserSession, Document, VectorEmbedding
from app.core.enum import TenantStatus

class GlobalAdminRepository:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def count_tenant_by_status(self) -> dict[str, int]:
        stmt = select(
            Tenants.status,
            func.count(Tenants.id)
        ).group_by(Tenants.status)

        result = await self.db.execute(stmt)
        return {
            status: count 
            for status, count in result.all()
        }

    async def count_tenant_new_in_month(self, first_day_of_month: datetime) -> int:
        stmt = select(func.count(Tenants.id)).where(
            Tenants.created_at >= first_day_of_month
        )
        result = await self.db.execute(stmt)
        return result.scalar_one_or_none() or 0


    async def count_chunks(self) -> int:
        stmt = select(func.count(DocumentChunk.id))
        result = await self.db.execute(stmt)
        return result.scalar_one_or_none() or 0
    
    async def count_embeddings(self) -> int:
        stmt = select(func.count(VectorEmbedding.id))
        result = await self.db.execute(stmt)
        return result.scalar_one_or_none() or 0
    
    async def get_embedding_size_bytes(self) -> tuple[int, str]:
        index_size_raw_query = text("""
            SELECT 
                pg_relation_size(c.oid) AS index_size_bytes,
                pg_size_pretty(pg_relation_size(c.oid)) AS index_size_human
            FROM pg_class c
            WHERE c.relname = 'idx_vector_embeddings_hnsw';
        """)
        
        try:
            index_size_result = await self.db.execute(index_size_raw_query)
            index_row = index_size_result.fetchone()
            
            if index_row:
                bytes_size = index_row[0]
                human_size = index_row[1]
            else:
                # Trường hợp chỉ mục chưa được tạo hoặc sai tên
                bytes_size = 0
                human_size = "0 bytes (Index not found)"
        except Exception as e:
            # Cơ chế dự phòng (fallback) nếu không có đặc quyền truy cập hệ thống bảng pg_class
            bytes_size = 0
            human_size = "Unknown"
        
        return bytes_size, human_size

    async def get_postgres_db_size_bytes(self) -> int:
        """
        Truy vấn trực tiếp dung lượng vật lý của Database hiện tại trên đĩa cứng
        Bao gồm dữ liệu bảng, toast dữ liệu, và toàn bộ chỉ mục (Indexes HNSW).
        """
        try:
            sql = text("SELECT pg_database_size(current_database());")
            result = await self.db.execute(sql)
            return result.scalar() or 0
        except Exception:
            return 0

    async def count_total_users(self) -> int:
        stmt = select(func.count(User.id)).where(User.is_deleted == False)
        result = await self.db.execute(stmt)
        return result.scalar_one_or_none() or 0

    async def count_live_sessions(self) -> int:
        stmt = select(func.count(func.distinct(UserSession.user_id))).where(
            UserSession.revoked_at.is_(None),
            UserSession.expires_at > func.now()
        )
        result = await self.db.execute(stmt)
        return result.scalar_one_or_none() or 0

    async def get_document_status_stats(self) -> dict[str, int]:
        stmt = select(
            Document.status,
            func.count(Document.id)
        ).where(Document.is_deleted == False).group_by(Document.status)
        result = await self.db.execute(stmt)
        return {status or "unknown": count for status, count in result.all()}

    async def get_tenants_count_by_month(self, start_month: datetime):
        month_expr = func.date_trunc(
            "month",
            Tenants.created_at
        )

        stmt = (
            select(
                month_expr.label("month"),
                func.count(Tenants.id).label("count")
            )
            .where(
                Tenants.created_at >= start_month,
                Tenants.status != TenantStatus.DELETED
            )
            .group_by(month_expr)
            .order_by(month_expr)
        )

        result = await self.db.execute(stmt)

        return [
            {
                "month": row.month.strftime("%Y-%m"),
                "count": row.count,
            }
            for row in result
        ]

    async def get_users_count_by_month(self, start_month: datetime):
        month_expr = func.date_trunc(
            "month",
            User.created_at
        )
        stmt = (
            select(
                month_expr.label("month"),
                func.count(User.id).label("count")
            )
            .where(User.created_at >= start_month, User.is_deleted == False)
            .group_by(month_expr)
            .order_by(month_expr)
        )

        result = await self.db.execute(stmt)

        return [
            {
                "month": row.month.strftime("%Y-%m"),
                "count": row.count
            }
            for row in result
        ]

    async def get_top_tenants_by_documents(self, limit: int = 10) -> list[dict]:
        stmt = select(
            Tenants.id,
            Tenants.company_name,
            func.count(Document.id).label("doc_count"),
            func.sum(Document.file_size).label("total_size")
        ).outerjoin(
            Document, (Document.tenant_id == Tenants.id) & (Document.is_deleted == False)
        ).group_by(
            Tenants.id, Tenants.company_name
        ).order_by(
            text("total_size DESC NULLS LAST")
        ).limit(limit)
        
        result = await self.db.execute(stmt)
        top_tenants = []
        for tenant_id, company_name, doc_count, total_size in result.all():
            user_count_stmt = select(func.count(User.id)).where(
                User.tenant_id == tenant_id,
                User.is_deleted == False
            )
            user_count_res = await self.db.execute(user_count_stmt)
            user_count = user_count_res.scalar_one_or_none() or 0
            
            top_tenants.append({
                "company_name": company_name,
                "storage_bytes": total_size or 0,
                "users_count": user_count
            })
        return top_tenants