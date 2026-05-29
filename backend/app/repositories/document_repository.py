from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy import update
from sqlalchemy.orm import selectinload

from app.models.document import Document
from app.models.document_chunks import DocumentChunk

class DocumentRepository:
    def __init__(self, db: AsyncSession):
        self.db = db
    
    async def create_document(self, document: Document):
        try:
            self.db.add(document)
            await self.db.commit()
            return await self.get_document_by_id(document.id)
        except Exception as e:
            await self.db.rollback()
            raise e
        
    async def update_document_status(self, document_id: int, status: str):
        try:
            stmt = update(Document).where(Document.id == document_id).values(status=status)
            await self.db.execute(stmt)
            await self.db.commit()
        except Exception as e:
            await self.db.rollback()
            raise e
        
    async def save_chunks(self, document_id: int, document_chunks: list[DocumentChunk]):
        try:
            for chunk in document_chunks:
                chunk.document_id = document_id
                
            self.db.add_all(document_chunks)
            await self.db.commit()
        except Exception as e:
            await self.db.rollback()
            raise e
        
    async def get_document_by_id(self, document_id: int):
        stmt = select(Document).where(Document.id == document_id).options(selectinload(Document.document_chunks))
        result = await self.db.execute(stmt)
        return result.scalar_one_or_none()
    
    async def get_document_by_hash(self, file_hash: str):
        stmt = select(Document).where(Document.file_hash == file_hash)

        result = await self.db.execute(stmt)
        return result.scalar_one_or_none()
    
    async def delete_document(self, document_id: int):
        try:
            stmt = update(Document).where(Document.id == document_id).values(is_deleted=True)
            await self.db.execute(stmt)
            await self.db.commit()
        except Exception as e:
            await self.db.rollback()
            raise e
        
    async def restore_document(self, document_id: int):
        try:
            stmt = update(Document).where(Document.id == document_id).values(is_deleted=False)
            await self.db.execute(stmt)
            await self.db.commit()
        except Exception as e:
            await self.db.rollback()
            raise e
   