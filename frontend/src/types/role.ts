import type { ID, PaginatedResponse, Timestamp } from './common'
import type { Permission } from './permission'

export interface RoleSimple {
    id: ID
    name: string
}

export interface Role {
    id: ID
    name: string
    description: string
    access_level: string
    is_system: boolean
    created_at: Timestamp
    updated_at: Timestamp

    permissions?: Permission[]
}

export interface AddRolePayload {
    name: string
    description?: string | null
    access_level?: string | null
    permission_ids?: ID[] | null
}

export interface UpdateRolePayload {
    id: ID
    name?: string | null
    description?: string | null
    access_level?: string | null
    permission_ids?: ID[] | null
}

export interface RolePaginatedResponse {
    roles: Role[]
    pagination: PaginatedResponse
}

export interface RoleState {
    isAddingRole: boolean
    activeRoleId: number | null
    query?: string | null
    status?: string | null
    page?: number | null
    limit?: number
}

export interface RoleClientActions {
    setIsAddingRole: (isAddingRole: boolean) => void
    setActiveRoleId: (id: number | null) => void
    setQuery: (query: string | null) => void
    setStatus: (status: string | null) => void
    setPage: (page: number | null) => void
    setLimit: (limit: number | null) => void
    clearActiveRole: () => void
}

export type RoleStore = RoleState & RoleClientActions
