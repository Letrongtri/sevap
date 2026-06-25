import type { ID, Timestamp, PaginatedResponse } from './common'

export interface DepartmentSimple {
    id: ID
    name: string
    code: string
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
