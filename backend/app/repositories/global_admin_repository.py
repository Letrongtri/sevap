from app.models import VectorEmbedding
from datetime import datetime
from sqlalchemy import func, text
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from app.models import Tenants, DocumentChunk

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