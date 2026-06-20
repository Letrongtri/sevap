import type { ID, PaginatedResponse, Timestamp } from './common'
import type { DepartmentSimple } from './department'
import type { JobTitleSimple } from './jobTitle'
import type { RoleSimple } from './role'

export interface UserSimple {
    id: ID
    employee_code: string
    full_name: string
    email: string | null
}

export interface User {
    id: ID
    employee_code: string
    full_name: string
    email: string | null
    job_title_id: ID
    department_id: ID
    is_active: boolean
    is_deleted: boolean
    last_login: Timestamp | null
    created_at: Timestamp
    updated_at: Timestamp
    department?: DepartmentSimple
    job_title?: JobTitleSimple
    roles?: RoleSimple[]
}

export interface AddUserPayload {
    employee_code: string
    full_name: string
    email: string | null
    password: string
    job_title_id?: ID | null
    department_id?: ID | null
    role_ids?: ID[]
}

export interface UpdateUserPayload {
    id: ID
    full_name?: string | null
    email?: string | null
    job_title_id?: ID | null
    department_id?: ID | null
    role_ids?: ID[]
}

export interface UserPaginatedResponse {
    users: User[]
    pagination: PaginatedResponse
}

export interface UserSimplePaginatedResponse {
    users: UserSimple[]
    pagination: PaginatedResponse
}

export interface UserState {
    isAddingUser: boolean
    activeUserId: ID | null
    query?: string | null
    departmentId?: ID | null
    jobTitleId?: ID | null
    roleId?: ID | null
    status?: string | null
    page?: number | null
    limit?: number
}

export interface UserClientActions {
    setIsAddingUser: (isAddingUser: boolean) => void
    setActiveUserId: (id: ID | null) => void
    setQuery: (query: string | null) => void
    setDepartmentId: (id: ID | null) => void
    setJobTitleId: (id: ID | null) => void
    setRoleId: (id: ID | null) => void
    setStatus: (status: string | null) => void
    setPage: (page: number | null) => void
    setLimit: (limit: number | null) => void
    clearActiveUser: () => void
}

export type UserStore = UserState & UserClientActions
