from typing import Optional, List
from app.repositories import DirectoryRepository
from app.schemas import DirectoryOverviewResponse
from app.ai_brain.retrieval.repository import PARRepository
from app.ai_brain.schemas import UserSecurityContext
from app.services.exceptions import AccessDeniedError

class DirectoryService:
    def __init__(self, repo: DirectoryRepository, par_repo: Optional[PARRepository] = None):
        self.repo = repo
        self.par_repo = par_repo
    
    async def get_directory_overview(
        self, 
        tenant_id: str, 
        user_id: Optional[str] = None,
        permissions: Optional[List[str]] = None
    ) -> DirectoryOverviewResponse:
        perms = permissions or []
        
        can_view_users = "users:read" in perms
        can_view_departments = "departments:read" in perms
        can_view_job_titles = "job_titles:read" in perms
        can_view_documents = "documents:read" in perms

        if not (can_view_users or can_view_departments or can_view_job_titles or can_view_documents):
            raise AccessDeniedError()

        overview_data = await self.repo.get_directory_overview(
            tenant_id=tenant_id,
            include_users=can_view_users,
            include_departments=can_view_departments,
            include_job_titles=can_view_job_titles
        )

        documents_count = 0
        if can_view_documents and user_id and self.par_repo:
            try:
                security_ctx = UserSecurityContext(user_id=user_id, tenant_id=tenant_id)
                ctx = await self.par_repo.build_par_context(security_ctx)
                allowed_ids = await self.par_repo.get_allowed_document_ids(ctx)
                documents_count = len(allowed_ids)
            except Exception:
                documents_count = 0

        return DirectoryOverviewResponse(
            users_count=overview_data["users_count"],
            documents_count=documents_count,
            departments_count=overview_data["departments_count"],
            job_titles_count=overview_data["job_titles_count"]
        )
