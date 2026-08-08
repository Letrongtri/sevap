import type { AccessLevel, ID, PaginatedResponse, Timestamp } from './common'
import type { DepartmentSimple } from './department'
import type { JobTitleSimple } from './jobTitle'
import type { RoleSimple } from './role'
import type { UserSimple } from './user'

// ── Policy condition types (mirrors backend enum) ──────────────────────────
export type ConditionType = 'roles' | 'departments' | 'job_titles'

export interface AccessPolicyConditionCreate {
    condition_type: ConditionType
    condition_value_id: ID
}

export interface DocumentAccessPolicyCreate {
    conditions: AccessPolicyConditionCreate[]
}

// ── API response types ──────────────────────────────────────────────────────
export interface AccessPolicyConditionResponse {
    id: ID
    policy_id: ID
    condition_type: ConditionType
    condition_value_id: ID
}

export interface DocumentAccessPolicyResponse {
    id: ID
    document_id: ID
    tenant_id: ID
    created_by: ID | null
    created_at: Timestamp
    conditions: AccessPolicyConditionResponse[]
}

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
    target_users: UserSimple[]
    document_access_policies: DocumentAccessPolicyResponse[]

    // Flattened helpers populated by backend _to_document_response
    roles: RoleSimple[]
    departments: DepartmentSimple[]
    job_titles: JobTitleSimple[]
}

export interface DocumentUploadPayload {
    file: File
    access_level: string
    policies?: DocumentAccessPolicyCreate[] | null
    title?: string | null
    category?: string | null
    effective_date?: Timestamp | null
    target_user_ids?: ID[] | null
}

export interface DocumentUpdatePayload {
    access_level?: string | null
    policies?: DocumentAccessPolicyCreate[] | null
    title?: string | null
    category?: string | null
    effective_date?: Timestamp | null
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
    job_title_id?: ID | null
    user_id?: ID | null
    page?: number | null
    limit?: number
}

export interface DocumentState {
    isAddingDocument: boolean
    activeDocumentId: ID | null
    query?: string | null
    departmentId?: ID | null
    jobTitleId?: ID | null
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
    setJobTitleId: (id: ID | null) => void
    setAccessLevel: (accessLevel: AccessLevel | null) => void
    setEffectiveDate: (effectiveDate: Timestamp | null) => void
    setRoleAccess: (roleAccess: ID | null) => void
    setTargetUserId: (targetUserId: ID | null) => void
    setPage: (page: number | null) => void
    setLimit: (limit: number | null) => void
    clearActiveDocument: () => void
}

export type DocumentStore = DocumentState & DocumentClientActions

// ── Policy Group types (local UI state) ──────────────────────────────────────
export interface PolicyGroupState {
    id: string // local key chỉ để React render
    roleIds: ID[]
    departmentIds: ID[]
    jobTitleIds: ID[]
    expanded: boolean
}
