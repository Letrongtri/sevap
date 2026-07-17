from sqlalchemy.ext.asyncio import AsyncSession
from fastapi import Depends

from app.dependencies.db import get_db
from app.repositories import (
    ConversationRepository, DepartmentRepository, DocumentRepository,
    JobTitleRepository, MessageRepository, RoleRepository,
    UserRepository,
)
from app.services import TenantAdminService


def get_tenant_admin_service(
        db: AsyncSession = Depends(get_db)
) -> TenantAdminService:
    user_repo = UserRepository(db)
    role_repo = RoleRepository(db)
    job_title_repo = JobTitleRepository(db)
    document_repo = DocumentRepository(db)
    department_repo = DepartmentRepository(db)
    conversation_repo = ConversationRepository(db)
    message_repo = MessageRepository(db)
    return TenantAdminService(
        user_repo=user_repo,
        role_repo=role_repo,
        department_repo=department_repo,
        job_title_repo=job_title_repo, 
        document_repo=document_repo,
        conversation_repo=conversation_repo,
        message_repo=message_repo
    )
