/* ============================================================
   Common / shared TypeScript types
   ============================================================ */

export type ID = number

export type Nullable<T> = T | null

export type Timestamp = string // ISO-8601

export interface PaginatedResponse<T> {
    items: T[]
    total: number
    page: number
    pageSize: number
    hasNext: boolean
}

export interface ApiResponse<T = unknown> {
    success: boolean
    data?: T
    error?: string
    message?: string
}

/** Generic key-value option (for selects, dropdowns) */
export interface SelectOption<T = string> {
    label: string
    value: T
    disabled?: boolean
    description?: string
}

export type LoadingState = 'idle' | 'loading' | 'success' | 'error'

export type UserRole = 'Admin' | 'HR Manager' | 'Employee'

export type AccessLevel = 'Public' | 'Private' | 'Managerial'
