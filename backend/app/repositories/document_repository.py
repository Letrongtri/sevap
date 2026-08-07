from datetime import datetime
from typing import Set, Optional
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy import update, or_, func, bindparam, text
from sqlalchemy.orm import selectinload

from app.core.enum import DocumentStatus
from app.models import (
    Document, DocumentChunk, DocumentUserAccess, 
    DocumentRoleAccess, DocumentDepartmentAccess, User
)

class DocumentRepository:
    def __init__(self, db: AsyncSession):
        self.db = db
    
    async def create_document(self, document: Document):
        try:
            self.db.add(document)
            await self.db.commit()
            return await self.get_document_by_id(
                document.id,
                get_roles=True,
                get_users=True,
                get_departments=True
            )
        except Exception as e:
            await self.db.rollback()
            raise e
        
    async def update_document_status(self, document_id: str, status: str):
        try:
            stmt = (
                update(Document)
                .where(Document.id == document_id)
                .values(status=status)
            )
            await self.db.execute(stmt)
            await self.db.commit()
        except Exception as e:
            await self.db.rollback()
            raise e
        
    async def save_chunks(self, document_chunks: list[DocumentChunk]):
        try:
            self.db.add_all(document_chunks)
            await self.db.commit()
        except Exception as e:
            await self.db.rollback()
            raise e
        
    async def get_document_by_id(
        self, document_id: str, 
        get_chunks: bool = False, 
        get_roles: bool = False, 
        get_users: bool = False, 
        get_departments: bool = False
    ):
        stmt = select(Document).where(
            Document.id == document_id,
            Document.is_deleted == False
        )

        options = []
        if get_roles:
            options.append(
                selectinload(Document.role_accesses)
                .selectinload(DocumentRoleAccess.role)
            )
        if get_users:
            options.append(
                selectinload(Document.user_accesses)
                .selectinload(DocumentUserAccess.user)
                .selectinload(User.department)
            )
            options.append(
                selectinload(Document.user_accesses)
                .selectinload(DocumentUserAccess.user)
                .selectinload(User.job_title)
            )
        if get_departments:
            options.append(
                selectinload(Document.department_accesses)
                .selectinload(DocumentDepartmentAccess.department)
            )
        if get_chunks:
            options.append(selectinload(Document.document_chunks))

        options.append(selectinload(Document.uploader))

        stmt = stmt.options(*options)
        # populate_existing=True: buộc reload từ DB ngay cả khi object đã có
        # trong identity map (tránh expired attribute gây MissingGreenlet)
        stmt = stmt.execution_options(populate_existing=True)

        result = await self.db.execute(stmt)
        return result.scalar_one_or_none()
    
    async def get_document_by_hash(self, tenant_id: str, file_hash: str):
        stmt = select(Document).where(
            Document.tenant_id == tenant_id,
            Document.file_hash == file_hash,
            Document.is_deleted == False
        )

        options = [
            selectinload(Document.role_accesses)
            .selectinload(DocumentRoleAccess.role),
            selectinload(Document.user_accesses)
            .selectinload(DocumentUserAccess.user),
            selectinload(Document.department_accesses)
            .selectinload(DocumentDepartmentAccess.department)
        ]

        result = await self.db.execute(stmt.options(*options))
        return result.scalar_one_or_none()
    
    async def get_chunks_by_document_id(self, tenant_id: str, document_id: str):
        stmt = select(DocumentChunk).where(
            DocumentChunk.tenant_id == tenant_id,
            DocumentChunk.document_id == document_id
        )
        result = await self.db.execute(stmt)
        return result.scalars().all()

    async def bulk_update_chunks(self, chunks: list[DocumentChunk]) -> None:
        if not chunks:
            return

        try:
            update_data = [
                {
                    "b_id": chunk.id,
                    "b_meta_data": chunk.meta_data
                }
                for chunk in chunks
            ]
            stmt = (
                update(DocumentChunk)
                .where(DocumentChunk.id == bindparam("b_id"))
                .values(meta_data=bindparam("b_meta_data"))
            )

            await self.db.execute(stmt, update_data)
            
            await self.db.commit()

        except Exception as e:
            await self.db.rollback()
            raise e
        
    async def restore_document(self, document_id: str):
        try:
            stmt = (
                update(Document)
                .where(Document.id == document_id)
                .values(is_deleted=False)
            )
            await self.db.execute(stmt)
            await self.db.commit()
        except Exception as e:
            await self.db.rollback()
            raise e

    async def get_all_documents(
        self, tenant_id: str, query: str = None, 
        department_id: str = None, role_id: str = None,
        user_id: str = None, effective_date: datetime = None, 
        access_level: str = None, is_deleted: bool = False, 
        limit: int = 10, skip: int = 0,
        allowed_ids: Optional[Set[str]] = None
    ) -> tuple[list[Document], str]:
        stmt = select(Document).where(
            Document.tenant_id == tenant_id,
            Document.is_deleted == is_deleted
        )

        # PAR gate: chỉ trả về document mà user được phép truy cập
        if allowed_ids is not None:
            if len(allowed_ids) == 0:
                return [], 0
            stmt = stmt.where(Document.id.in_(allowed_ids))
                
        if query is not None and query != '':
            stmt = stmt.filter(
                or_(
                    Document.title.ilike(f"%{query}%"),
                    Document.category.ilike(f"%{query}%"),
                    Document.file_name.ilike(f"%{query}%"),
                    Document.file_type.like(f"%{query}%")
                )
            )
        if department_id is not None:
            stmt = (
                stmt.where(
                    Document.department_accesses.any(
                        DocumentDepartmentAccess.department_id == department_id
                    )
                )
            )
        if role_id is not None:
            stmt = (
                stmt.where(
                    Document.role_accesses.any(
                        DocumentRoleAccess.role_id == role_id
                    )
                )
            )
        if user_id is not None:
            stmt = (
                stmt.where(
                    Document.user_accesses.any(
                        DocumentUserAccess.user_id == user_id
                    )
                )
            )
        if effective_date is not None:
            stmt = stmt.where(Document.effective_date <= effective_date)
        if access_level is not None:
            stmt = stmt.where(Document.access_level == access_level)

        count_stmt = select(func.count()).select_from(stmt.subquery())
        total_records = await self.db.scalar(count_stmt)
        
        stmt = stmt.order_by(Document.created_at.desc())
        stmt = stmt.limit(limit)
        stmt = stmt.offset(skip)

        stmt = stmt.options(
            selectinload(Document.uploader),
            (
                selectinload(Document.department_accesses)
                .selectinload(DocumentDepartmentAccess.department)
            ),
            (
                selectinload(Document.role_accesses)
                .selectinload(DocumentRoleAccess.role)
            ),
            (
                selectinload(Document.user_accesses)
                .selectinload(DocumentUserAccess.user)
                .selectinload(User.department)
            ),
            (
                selectinload(Document.user_accesses)
                .selectinload(DocumentUserAccess.user)
                .selectinload(User.job_title)
            ),
        )
        

        result = await self.db.execute(stmt)
        documents = result.unique().scalars().all()

        return list(documents), total_records
    
    
    async def save_document(self, document: Document) -> Document:
        try:
            await self.db.commit()
            await self.db.refresh(document)
            return document
        except Exception as e:
            await self.db.rollback()
            raise e

    async def count_all_documents(self, tenant_id: str) -> int:
        result = await self.db.execute(
            select(func.count(Document.id)).where(
                Document.tenant_id == tenant_id,
                Document.is_deleted == False,
                Document.status == DocumentStatus.DONE
            )
        )
        return result.scalar_one()

    async def count_all_embeddings(self, tenant_id: str) -> int:
        result = await self.db.execute(
            select(func.count(DocumentChunk.id)).where(
                DocumentChunk.tenant_id == tenant_id,
                DocumentChunk.document_id.in_(
                    select(Document.id).where(
                        Document.tenant_id == tenant_id,
                        Document.status == DocumentStatus.DONE
                    )
                )
            )
        )
        return result.scalar_one() or 0

    
    async def get_total_storage(self, tenant_id: str) -> int:
        """
        Tính toán tổng dung lượng tệp tin vật lý đã tải lên của một Tenant.
        Đảm bảo cô lập tuyệt đối và loại bỏ các tài liệu đã bị xóa mềm
        """
        stmt = (
            select(func.sum(Document.file_size).label("total_size"))
            .where(
                Document.tenant_id == tenant_id,
                Document.is_deleted == False
            )
        )
        
        result = await self.db.execute(stmt)
        return result.scalar() or 0
        
    async def count_documents_by_access_level(self, tenant_id: str) -> int:
        stmt = (
            select(Document.access_level, func.count(Document.id))
            .where(
                Document.tenant_id == tenant_id,
                Document.is_deleted == False
            )
            .group_by(Document.access_level)
        )
        result = await self.db.execute(stmt)
        return result.all()
