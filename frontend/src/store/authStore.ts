import { create } from 'zustand'
import type { AuthActions, AuthState, AuthUser } from '../types/auth'
import axiosClient from '../api/axios'

type AuthStore = AuthState & AuthActions

const normalizeAuthUser = (
    user: Record<string, unknown> | null | undefined
): AuthUser | null => {
    if (!user) return null
    return {
        id: user.id as string,
        fullName: ((user.fullName || user.full_name) as string) ?? '',
        employeeCode:
            ((user.employeeCode || user.employee_code) as string) ?? '',
        roles: (user.roles as string[]) ?? [],
        permissions: (user.permissions as string[]) ?? [],
        isGlobalAdmin: Boolean(
            user.isGlobalAdmin ?? user.is_global_admin ?? false
        ),
        department: user.department as string | undefined,
        jobTitle: ((user.jobTitle || user.job_title) as string) ?? undefined,
        companyName:
            ((user.companyName || user.company_name) as string) ?? undefined,
        tenantId: ((user.tenantId || user.tenant_id) as string) ?? undefined,
        tenantDomain:
            ((user.tenantDomain || user.tenant_domain) as string) ?? undefined,
        lastLogin: ((user.lastLogin || user.last_login) as string) ?? undefined,
    }
}

export const useAuthStore = create<AuthStore>((set) => ({
    user: (() => {
        const storedUser = localStorage.getItem('auth_user')
        try {
            return storedUser ? JSON.parse(storedUser) : null
        } catch {
            return null
        }
    })(),
    isAuthenticated: !!localStorage.getItem('access_token'),
    isLoading: false,
    error: null,

    accessToken: localStorage.getItem('access_token') || undefined,
    refreshToken: localStorage.getItem('refresh_token') || undefined,
    expiresAt: localStorage.getItem('expires_at') || undefined,

    setAuth: (tokens, user) => {
        localStorage.setItem('access_token', tokens.accessToken)
        if (tokens.refreshToken) {
            localStorage.setItem('refresh_token', tokens.refreshToken)
        }
        if (tokens.expiresAt) {
            localStorage.setItem('expires_at', tokens.expiresAt)
        }

        const normalized =
            user !== undefined && user !== null
                ? normalizeAuthUser(user as unknown as Record<string, unknown>)
                : null
        if (normalized) {
            localStorage.setItem('auth_user', JSON.stringify(normalized))
        }

        set((state) => {
            const newUser = normalized || state.user
            return {
                accessToken: tokens.accessToken,
                refreshToken: tokens.refreshToken || state.refreshToken,
                expiresAt: tokens.expiresAt || state.expiresAt,
                user: newUser,
                isAuthenticated: true,
                error: null,
            }
        })
    },

    clearAuth: () => {
        localStorage.removeItem('access_token')
        localStorage.removeItem('refresh_token')
        localStorage.removeItem('expires_at')
        localStorage.removeItem('auth_user')

        set({
            accessToken: undefined,
            refreshToken: undefined,
            expiresAt: undefined,
            user: null,
            isAuthenticated: false,
        })
    },

    setLoading: (status) => set({ isLoading: status }),
    setError: (msg) => set({ error: msg }),
    updateUser: (patch) =>
        set((state) => {
            if (!state.user) return state
            
            const updated = { ...state.user, ...patch }
            localStorage.setItem('auth_user', JSON.stringify(updated))
            return { user: updated }
        }),
}))

export const checkAuthOrRefresh = async (): Promise<boolean> => {
    const { accessToken, refreshToken, expiresAt, setAuth, clearAuth, user } =
        useAuthStore.getState()

    // not login
    if (!accessToken) return false

    const isExpired = expiresAt
        ? new Date(expiresAt).getTime() <= Date.now()
        : true

    // access token is valid
    if (!isExpired) return true

    if (refreshToken) {
        try {
            const response = await axiosClient.post('/auth/refresh', {
                refresh_token: refreshToken,
            })

            const data = response.data
            const newTokens = {
                accessToken: data.access_token,
                refreshToken: data.refresh_token || refreshToken,
                expiresAt: data.access_token_expires_at,
            }
            setAuth(newTokens, user ?? undefined)
            return true
        } catch (error) {
            console.error('Lỗi gia hạn token ngầm:', error)
        }
    }

    clearAuth()
    return false
}
