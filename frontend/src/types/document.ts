import type { AccessLevel, ID, PaginatedResponse, Timestamp } from './common'
import type { DepartmentSimple } from './department'
import type { RoleSimple } from './role'
import type { UserSimple } from './user'

export interface Document {
    id: ID
    uploader_id: ID
    title: string
    access_level: string
    file_name: string
    file_type: string | null
    file_path: string
    file_size: number | null
    status: string | null
    category: string | null
    effective_date: Timestamp | null
    meta_data: Record<string, unknown> | null
    is_deleted: boolean
    created_at: Timestamp
    updated_at: Timestamp

    uploader: UserSimple | null
    departments: DepartmentSimple[]
    target_users: UserSimple[]
    roles: RoleSimple[]
}

export interface DocumentUploadPayload {
    file: File
    access_level: string
    department_ids?: number[] | null
    title?: string | null
    category?: string | null
    effective_date?: Timestamp | null
    role_access?: number[] | null
    target_user_ids?: number[] | null
}

export interface DocumentUpdatePayload {
    access_level?: string | null
    department_ids?: number[] | null
    title?: string | null
    category?: string | null
    effective_date?: Timestamp | null
    role_access?: number[] | null
    target_user_ids?: number[] | null
}

export interface DocumentPaginatedResponse {
    documents: Document[]
    pagination: PaginatedResponse
}

export interface DocumentQuery {
    query?: string | null
    department_id?: number | null
    access_level?: string | null
    effective_date?: Timestamp | null
    role_id?: number | null
    user_id?: number | null
    page?: number | null
    limit?: number
}

export interface DocumentState {
    isAddingDocument: boolean
    activeDocumentId: number | null
    query?: string | null
    departmentId?: number | null
    accessLevel?: AccessLevel | null
    effectiveDate?: Timestamp | null
    roleAccess?: number | null
    targetUserId?: number | null
    page?: number | null
    limit?: number
}

export interface DocumentClientActions {
    setIsAddingDocument: (isAddingDocument: boolean) => void
    setActiveDocumentId: (id: number | null) => void
    setQuery: (query: string | null) => void
    setDepartmentId: (id: number | null) => void
    setAccessLevel: (accessLevel: AccessLevel | null) => void
    setEffectiveDate: (effectiveDate: Timestamp | null) => void
    setRoleAccess: (roleAccess: number | null) => void
    setTargetUserId: (targetUserId: number | null) => void
    setPage: (page: number | null) => void
    setLimit: (limit: number | null) => void
    clearActiveDocument: () => void
}

export type DocumentStore = DocumentState & DocumentClientActions
