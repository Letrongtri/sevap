import asyncio
from app.repositories import (
    UserRepository, RoleRepository, DepartmentRepository,
    JobTitleRepository, DocumentRepository, ConversationRepository,
    MessageRepository
)
from app.schemas import (
    AdminTenantOverviewResponse, AdminTenantChatStatisticsQuery,
    AdminTenantChatStatisticsItem, AdminTenantDocumentStatisticsResponse
)
from app.core.enum import AccessLevel
from app.core.logging import logger
from app.utils.datetime import get_statistics_date_range

class TenantAdminService:
    def __init__(
        self, user_repo: UserRepository, role_repo: RoleRepository, 
        department_repo: DepartmentRepository, job_title_repo: JobTitleRepository, 
        document_repo: DocumentRepository, conversation_repo: ConversationRepository,
        message_repo: MessageRepository
    ):
        self.user_repo = user_repo
        self.role_repo = role_repo
        self.department_repo = department_repo
        self.job_title_repo = job_title_repo
        self.document_repo = document_repo
        self.conversation_repo = conversation_repo
        self.message_repo = message_repo

    async def get_admin_tenant_overview(self, tenant_id: str) -> AdminTenantOverviewResponse:
        try:
            # Count total users
            total_users = await self.user_repo.count_all_users(tenant_id)
            total_custom_roles = await self.role_repo.count_all_roles(tenant_id)
            total_departments = await self.department_repo.count_all_departments(tenant_id)
            total_job_titles = await self.job_title_repo.count_all_job_titles(tenant_id)
            total_documents = await self.document_repo.count_all_documents(tenant_id)
            total_embeddings = await self.document_repo.count_all_embeddings(tenant_id)
            total_storage = await self.document_repo.get_total_storage(tenant_id)
            
            return AdminTenantOverviewResponse(
                total_users=total_users,
                total_custom_roles=total_custom_roles,
                total_departments=total_departments,
                total_job_titles=total_job_titles,
                total_documents=total_documents,
                total_embeddings=total_embeddings,
                total_storage=total_storage
            )
        except Exception as e:
            logger.error("get_tenant_summary_failed", error=str(e), exc_info=True)
            raise

    async def get_admin_tenant_chat_statistics(
        self, 
        tenant_id: str, 
        query: AdminTenantChatStatisticsQuery
    ) -> list[AdminTenantChatStatisticsItem]:
        try:
            group_by = query.group_by
            from_date, to_date = get_statistics_date_range(
                group_by,
                query.from_date,
                query.to_date
            )

            conversations_task = self.conversation_repo.count_all_conversations(
                tenant_id, group_by, from_date, to_date
            )
            messages_task = self.message_repo.count_all_messages(
                tenant_id, group_by, from_date, to_date
            )

            conversations_res, messages_res = await asyncio.gather(
                conversations_task, messages_task
            )

            merged_data: dict[str, AdminTenantChatStatisticsItem] = {}

            for time_bucket, conv_count in conversations_res:
                clean_key = time_bucket[:10] if time_bucket else "Unknown"
                merged_data[clean_key] = AdminTenantChatStatisticsItem(
                    label=clean_key,
                    total_conversations=conv_count,
                    total_messages=0
                )

            for time_bucket, msg_count in messages_res:
                clean_key = time_bucket[:10] if time_bucket else "Unknown"
                if clean_key in merged_data:
                    merged_data[clean_key].total_messages = msg_count
                else:
                    merged_data[clean_key] = AdminTenantChatStatisticsItem(
                        label=clean_key,
                        total_conversations=0,
                        total_messages=msg_count
                    )
            
            return list(merged_data.values())
        except Exception as e:
            logger.error("get_tenant_chat_statistics_failed", error=str(e), exc_info=True)
            raise

    async def get_admin_tenant_document_statistics(
        self, tenant_id: str
    ) -> AdminTenantDocumentStatisticsResponse:
        try:
            data = await self.document_repo.count_documents_by_access_level(
                tenant_id
            )

            stats = {
                AccessLevel.PUBLIC.value: 0,
                AccessLevel.PRIVATE.value: 0,
                AccessLevel.MANAGERIAL.value: 0
            }

            for access_level, count in data:
                stats[access_level] = count
            
            return AdminTenantDocumentStatisticsResponse(
                public_documents=stats.get(AccessLevel.PUBLIC.value, 0),
                private_documents=stats.get(AccessLevel.PRIVATE.value, 0),
                managerial_documents=stats.get(AccessLevel.MANAGERIAL.value, 0)
            )
        except Exception as e:
            logger.error("get_tenant_document_statistics_failed", error=str(e), exc_info=True)
            raise