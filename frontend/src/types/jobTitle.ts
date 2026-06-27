import type { ID, Timestamp, PaginatedResponse } from './common'

export interface JobTitleSimple {
    id: ID
    title_name: string
    code: string
}

export interface AddJobTitlePayload {
    title_name: string
    code: string
    description?: string
}

export interface UpdateJobTitlePayload {
    title_name?: string
    description?: string
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

export interface JobTitleState {
    isAddingJobTitle: boolean
    activeJobTitleId: ID | null
    query?: string | null
    page?: number | null
    limit?: number
}

export interface JobTitleClientActions {
    setIsAddingJobTitle: (isAddingJobTitle: boolean) => void
    setActiveJobTitleId: (id: ID | null) => void
    setQuery: (query: string | null) => void
    setPage: (page: number | null) => void
    setLimit: (limit: number | null) => void
    clearActiveJobTitle: () => void
}

export type JobTitleStore = JobTitleState & JobTitleClientActions
