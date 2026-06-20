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
    department_ids?: ID[] | null
    title?: string | null
    category?: string | null
    effective_date?: Timestamp | null
    role_access?: ID[] | null
    target_user_ids?: ID[] | null
}

export interface DocumentUpdatePayload {
    access_level?: string | null
    department_ids?: ID[] | null
    title?: string | null
    category?: string | null
    effective_date?: Timestamp | null
    role_access?: ID[] | null
    target_user_ids?: ID[] | null
}

export interface DocumentPaginatedResponse {
    documents: Document[]
    pagination: PaginatedResponse
}

export interface DocumentQuery {
    query?: string | null
    department_id?: ID | null
    access_level?: string | null
    effective_date?: Timestamp | null
    role_id?: ID | null
    user_id?: ID | null
    page?: number | null
    limit?: number
}

export interface DocumentState {
    isAddingDocument: boolean
    activeDocumentId: ID | null
    query?: string | null
    departmentId?: ID | null
    accessLevel?: AccessLevel | null
    effectiveDate?: Timestamp | null
    roleAccess?: ID | null
    targetUserId?: ID | null
    page?: number | null
    limit?: number
}

export interface DocumentClientActions {
    setIsAddingDocument: (isAddingDocument: boolean) => void
    setActiveDocumentId: (id: ID | null) => void
    setQuery: (query: string | null) => void
    setDepartmentId: (id: ID | null) => void
    setAccessLevel: (accessLevel: AccessLevel | null) => void
    setEffectiveDate: (effectiveDate: Timestamp | null) => void
    setRoleAccess: (roleAccess: ID | null) => void
    setTargetUserId: (targetUserId: ID | null) => void
    setPage: (page: number | null) => void
    setLimit: (limit: number | null) => void
    clearActiveDocument: () => void
}

export type DocumentStore = DocumentState & DocumentClientActions
