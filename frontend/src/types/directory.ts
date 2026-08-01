export const DirectoryTab = {
    Users: 'users',
    Departments: 'departments',
    JobTitles: 'job_titles',
    Documents: 'documents',
} as const

export type DirectoryTab = (typeof DirectoryTab)[keyof typeof DirectoryTab]

export interface DirectoryOverview {
    users_count: number
    documents_count: number
    departments_count: number
    job_titles_count: number
}

export interface DirectoryState {
    activeTab: DirectoryTab
    query: string
    page: number
    limit: number
    departmentId: string | null
    jobTitleId: string | null
}

export interface DirectoryClientActions {
    setActiveTab: (activeTab: DirectoryTab) => void
    setQuery: (query: string) => void
    setPage: (page: number) => void
    setLimit: (limit: number) => void
    setDepartmentId: (departmentId: string | null) => void
    setJobTitleId: (jobTitleId: string | null) => void
}

export type DirectoryStore = DirectoryState & DirectoryClientActions
