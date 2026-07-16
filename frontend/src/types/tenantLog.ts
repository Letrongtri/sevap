import type { ID, PaginatedResponse, Timestamp } from './common'

export interface TenantLog {
    id: ID
    tenant_id: ID
    user_id: ID
    user_name: string | null
    employee_code: string | null
    action: string
    resource: string
    ip_address: string | null
    log_level: string
    created_at: Timestamp
}

export interface TenantLogDetail extends TenantLog {
    email: string | null
    meta_data: Record<string, any> | null
    user_agent: string | null
    location: string | null
    device: string | null
}

export interface TenantLogFilters {
    user_id?: string | null
    action?: string | null
    resource?: string | null
    log_level?: string | null
    start_date?: string | null
    end_date?: string | null
    page?: number | null
    limit?: number | null
    sort_by?: string | null
    sort_order?: 'asc' | 'desc'
}

export interface TenantLogPaginatedResponse {
    data: TenantLog[]
    pagination: PaginatedResponse
}

export interface TenantLogState {
    activeTenantLogId: ID | null
    filters: TenantLogFilters
}

export interface TenantLogActions {
    setActiveTenantLogId: (tenantLogId: ID | null) => void
    setUserId: (userId: ID | null) => void
    setAction: (action: string | null) => void
    setResource: (resource: string | null) => void
    setLogLevel: (logLevel: string | null) => void
    setStartDate: (startDate: string | null) => void
    setEndDate: (endDate: string | null) => void
    setPage: (page: number | null) => void
    setLimit: (limit: number | null) => void
    setSortBy: (sortBy: string | null) => void
    setSortOrder: (sortOrder: 'asc' | 'desc' | null) => void
    clearFilters: () => void
}

export type TenantLogStore = TenantLogState & TenantLogActions
