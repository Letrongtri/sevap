import math

from app.models import PromptTemplate
from app.repositories import PromptTemplateRepository
from app.services.exceptions import NotFoundError
from app.schemas import (
    PromptTemplateCreate, PromptTemplateUpdate, PromptTemplateResponse,
    PromptTemplateQuery, PromptTemplatePaginatedResponse,
    PaginationQuery, PaginationResponse
)

class PromptTemplateService:
    def __init__(self, repo: PromptTemplateRepository):
        self.repo = repo
    
    async def get_all_prompt_templates(
        self,
        tenant_id: str,
        query: PromptTemplateQuery,
        pagination: PaginationQuery
    ) -> PromptTemplatePaginatedResponse:
        skip = (pagination.page - 1) * pagination.limit

        prompt_templates, total = await self.repo.get_all_prompt_templates(
            tenant_id,
            query=query.query,
            type=query.type,
            is_active=query.is_active,
            skip=skip,
            limit=pagination.limit
        )

        total_pages = math.ceil(total / pagination.limit) if total > 0 else 0
        return PromptTemplatePaginatedResponse(
            prompt_templates=[
                PromptTemplateResponse.model_validate(prompt_template)
                for prompt_template in prompt_templates
            ],
            pagination=PaginationResponse(
                total=total,
                page=pagination.page,
                limit=pagination.limit,
                total_pages=total_pages
            )
        )

    async def create_prompt_template(
        self, tenant_id: str, user_id: str, data: PromptTemplateCreate
    ) -> PromptTemplateResponse:
        prompt_template = PromptTemplate(
            tenant_id=tenant_id,
            user_id=user_id,
            name=data.name,
            type=data.type,
            content=data.content,
            description=data.description,
            is_active=True
        )

        created_prompt_template = await self.repo.create_prompt_template(prompt_template)
        return PromptTemplateResponse.model_validate(created_prompt_template)
    
    async def get_prompt_template_by_id(
        self, tenant_id: str, prompt_template_id: str
    ) -> PromptTemplateResponse:
        prompt_template = await self.repo.get_prompt_template_by_id(prompt_template_id)
        if prompt_template is None or prompt_template.tenant_id != tenant_id:
            raise NotFoundError()
        return PromptTemplateResponse.model_validate(prompt_template)

    async def update_prompt_template(
        self, tenant_id: str, prompt_template_id: str, data: PromptTemplateUpdate
    ) -> PromptTemplateResponse:
        existing = await self.repo.get_prompt_template_by_id(prompt_template_id)
        if existing is None or existing.tenant_id != tenant_id:
            raise NotFoundError()
        
        if data.name is not None:
            existing.name = data.name
        if data.description is not None:
            existing.description = data.description
        if data.content is not None:
            existing.content = data.content
        if data.type is not None:
            existing.type = data.type

        updated = await self.repo.save(existing)
        return PromptTemplateResponse.model_validate(updated)

    async def toggle_prompt_template_status(
        self, tenant_id: str, prompt_template_id: str
    ) -> PromptTemplateResponse:
        existing = await self.repo.get_prompt_template_by_id(prompt_template_id)
        if existing is None or existing.tenant_id != tenant_id:
            raise NotFoundError()
        
        existing.is_active = not existing.is_active
        updated = await self.repo.save(existing)
        return PromptTemplateResponse.model_validate(updated)
    
    async def delete_prompt_template(
        self, tenant_id: str, prompt_template_id: str
    ) -> PromptTemplateResponse:
        existing = await self.repo.get_prompt_template_by_id(prompt_template_id)
        if existing is None or existing.tenant_id != tenant_id:
            raise NotFoundError()
        
        response = PromptTemplateResponse.model_validate(existing)
        await self.repo.delete_prompt_template(existing)
        return response
