/* ============================================================
   Common / shared TypeScript types
   ============================================================ */

export type ID = string

export type Nullable<T> = T | null

export type Timestamp = string // ISO-8601

export interface PaginatedResponse {
    total: number
    page: number
    limit: number
    total_pages: number
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

export const ACCESS_LEVELS = ['Public', 'Private', 'Managerial'] as const

export type AccessLevel = (typeof ACCESS_LEVELS)[number]

export type SelectSize = 'sm' | 'md' | 'lg'
