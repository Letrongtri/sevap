import type { PaginatedResponse } from './common'

export interface UserSessionAdmin {
    id: string
    user_id: string
    full_name: string
    email: string
    roles: string[]
    tenant_id: string | null
    ip_address: string
    user_agent: string
    device: string
    location: string
    status: 'active' | 'inactive'
    is_revoked: boolean
}

export interface UserSessionFilters {
    page?: number
    limit?: number
    user_id?: string
    status?: 'active' | 'inactive'
}

export interface UserSessionWSResponse {
    status: string
    event: 'HISTORY_LOADED' | 'error'
    data: {
        sessions: UserSessionAdmin[]
        pagination: PaginatedResponse
    }
    detail?: string
}

export interface RevokeUserSessionResponse {
    is_current_session: boolean
}
