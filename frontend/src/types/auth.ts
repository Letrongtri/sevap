import type { UserRole, AccessLevel, Timestamp, ID } from './common'

/* ============================================================
   Auth — Type definitions
   ============================================================ */

export interface LoginCredentials {
    username: string
    password: string
    rememberMe: boolean
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
    token?: string
}

export interface AuthTokens {
    accessToken: string
    refreshToken: string
    expiresAt: Timestamp
}
