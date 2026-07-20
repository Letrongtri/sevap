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

export const ALLOWED_DOCUMENT_FILE_TYPES = [
    'pdf',
    'docx',
    'xlsx',
    'html',
    'md',
    'pptx',
    'txt',
] as const

export type AllowedDocumentFileType =
    (typeof ALLOWED_DOCUMENT_FILE_TYPES)[number]

export const LOG_LEVELS = ['info', 'warning', 'error'] as const
export type LogLevel = (typeof LOG_LEVELS)[number]

export const SORT_ORDERS = ['asc', 'desc'] as const
export type SortOrder = (typeof SORT_ORDERS)[number]

export type WSStatus = 'CONNECTING' | 'OPEN' | 'CLOSED'

export interface SocketState {
    socket: WebSocket | null
    status: WSStatus
    connect: (token: string, onMessageCallback: (data: any) => void) => void
    disconnect: () => void
}

export const ACTION_STYLES: Record<string, string> = {
    CREATE: 'text-emerald-400',
    UPDATE: 'text-blue-400',
    DELETE: 'text-red-400',
    LOGIN: 'text-violet-400',
    LOGOUT: 'text-slate-400',
    VIEW: 'text-sky-400',
    EXPORT: 'text-amber-400',
}

// ─── Helpers ────────────────────────────────────────────────────────────────
export const LOG_LEVEL_STYLES: Record<string, string> = {
    info: 'bg-blue-500/10 text-blue-400 border border-blue-500/20',
    warning: 'bg-amber-500/10 text-amber-400 border border-amber-500/20',
    error: 'bg-red-500/10 text-red-400 border border-red-500/20',
    success: 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20',
}
