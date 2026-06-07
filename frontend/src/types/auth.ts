import type { UserRole, AccessLevel, Timestamp, ID } from './common'

/* ============================================================
   Auth — Type definitions
   ============================================================ */

export interface LoginCredentials {
    employeeCode: string
    password: string
}

export interface AuthUser {
    id: ID
    name: string
    email: string
    role: UserRole
    avatar?: string
    department?: string
    accessLevels: AccessLevel[]
    lastLogin?: Timestamp
}

export interface AuthState {
    user: AuthUser | null
    isAuthenticated: boolean
    isLoading: boolean
    error: string | null
    accessToken?: string
    refreshToken?: string
    expiresAt?: string
}

export interface AuthActions {
    setAuth: (
        tokens: {
            accessToken: string
            refreshToken: string
            expiresAt: string
        },
        user?: AuthUser
    ) => void
    clearAuth: () => void
    setLoading: (status: boolean) => void
    setError: (msg: string | null) => void
}
