import type { ID, Timestamp, PaginatedResponse } from './common'

export interface DepartmentSimple {
    id: ID
    name: string
    code: string
}

export interface AddDepartmentPayload {
    name: string
    code: string
    description?: string
}

export interface UpdateDepartmentPayload {
    name?: string
    description?: string
}

export interface Department {
    id: ID
    name: string
    code: string
    description?: string
    created_at: Timestamp
    updated_at: Timestamp
}

export interface DepartmentQuery {
    query?: string | null
    page?: number | null
    limit?: number
}

export interface DepartmentPaginatedResponse {
    departments: Department[]
    pagination: PaginatedResponse
}

export interface DepartmentState {
    isAddingDepartment: boolean
    activeDepartmentId: ID | null
    query?: string | null
    page?: number | null
    limit?: number
}

export interface DepartmentClientActions {
    setIsAddingDepartment: (isAddingDepartment: boolean) => void
    setActiveDepartmentId: (id: ID | null) => void
    setQuery: (query: string | null) => void
    setPage: (page: number | null) => void
    setLimit: (limit: number | null) => void
    clearActiveDepartment: () => void
}

export type DepartmentStore = DepartmentState & DepartmentClientActions
