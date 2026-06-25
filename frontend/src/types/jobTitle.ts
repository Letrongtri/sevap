import type { ID, Timestamp, PaginatedResponse } from './common'

export interface JobTitleSimple {
    id: ID
    title_name: string
    code: string
}

export interface JobTitle {
    id: ID
    title_name: string
    code: string
    description?: string
    created_at: Timestamp
    updated_at: Timestamp
}

export interface JobTitleQuery {
    query?: string | null
    page?: number | null
    limit?: number
}

export interface JobTitlePaginatedResponse {
    job_titles: JobTitle[]
    pagination: PaginatedResponse
}
