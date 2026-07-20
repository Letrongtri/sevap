export interface TenantOverview {
    total_users: number
    total_custom_roles: number
    total_departments: number
    total_job_titles: number
    total_documents: number
    total_embeddings: number
    total_storage: number
}

export interface TenantChatStatsItem {
    label: string
    total_conversations: number
    total_messages: number
}

export type ChatStatsGroupBy = 'date' | 'week' | 'month' | 'year'

export interface TenantDocsStats {
    public_documents: number
    private_documents: number
    managerial_documents: number
}

export interface TenantAdminDashboardState {
    isEditingTenant: boolean
    chatStatsGroupBy: ChatStatsGroupBy
    chatStatsFromDate?: string
    chatStatsToDate?: string
}

export interface TenantAdminDashboardActions {
    setIsEditingTenant: (isEditingTenant: boolean) => void
    setChatStatsGroupBy: (chatStatsGroupBy: ChatStatsGroupBy) => void
    setChatStatsFromDate: (chatStatsFromDate?: string) => void
    setChatStatsToDate: (chatStatsToDate?: string) => void
}

export type TenantAdminDashboardStore = TenantAdminDashboardState &
    TenantAdminDashboardActions
