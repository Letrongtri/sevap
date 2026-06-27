import type { ReactNode } from 'react'
import type { ID, PaginatedResponse } from './common'

/* ── API payload types ──────────────────────────────────── */

export interface UpdateMyProfilePayload {
    full_name?: string | null
    email?: string | null
}

export interface ChangeMyPasswordPayload {
    old_password: string
    new_password: string
}

/* ── Local UI types ─────────────────────────────────────── */

/** A single read-only info field (label + icon + value). */
export interface InfoField {
    icon: ReactNode
    label: string
    value: string
}

/** Editable form values for Personal Information. */
export interface ProfileFormValues {
    fullName: string
    email: string
}

/** Validation errors for ProfileFormValues. */
export type ProfileFormErrors = Partial<Record<keyof ProfileFormValues, string>>

export interface UserSession {
    id: ID
    user_id: ID
    tenant_id: ID | null
    ip_address: string
    user_agent: string
    device: string
    location: string
    status: string
    is_current: boolean
    is_revoked: boolean
}

export interface UserSessionPaginatedResponse {
    sessions: UserSession[]
    pagination: PaginatedResponse
}

/* ── Zustand store types ────────────────────────────────── */

export interface MyProfileState {
    isUpdatingProfile: boolean
    isChangingPassword: boolean
    page: number
    limit: number
}

export interface MyProfileActions {
    setIsUpdatingProfile: (v: boolean) => void
    setIsChangingPassword: (v: boolean) => void
    setPage: (v: number) => void
    setLimit: (v: number) => void
}

export type MyProfileStore = MyProfileState & MyProfileActions
