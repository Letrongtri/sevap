from app.repositories import DirectoryRepository
from app.schemas import DirectoryOverviewResponse

class DirectoryService:
    def __init__(self, repo: DirectoryRepository):
        self.repo = repo
    
    async def get_directory_overview(self, tenant_id: str) -> DirectoryOverviewResponse:
        overview_data = await self.repo.get_directory_overview(tenant_id)
        return DirectoryOverviewResponse(
            users_count=overview_data["users_count"],
            departments_count=overview_data["departments_count"],
            job_titles_count=overview_data["job_titles_count"]
        )
