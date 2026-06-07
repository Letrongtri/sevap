import { create } from 'zustand'
import type { AuthActions, AuthState, AuthUser } from '../types/auth'

type AuthStore = AuthState & AuthActions

const normalizeAuthUser = (user): AuthUser => {
    return {
        id: user.id,
        fullName: user.full_name,
        employeeCode: user.employee_code,
        roles: user.roles,
        department: user.department,
        jobTitle: user.job_title,
        lastLogin: user.last_login,
    }
}

export const useAuthStore = create<AuthStore>((set) => ({
    user: null,
    isAuthenticated: !!localStorage.getItem('access_token'),
    isLoading: false,
    error: null,

    accessToken: localStorage.getItem('access_token') || undefined,
    refreshToken: localStorage.getItem('refresh_token') || undefined,
    expiresAt: localStorage.getItem('expires_at') || undefined,

    setAuth: (tokens, user) => {
        localStorage.setItem('access_token', tokens.accessToken)
        localStorage.setItem('refresh_token', tokens.refreshToken)
        localStorage.setItem('expires_at', tokens.expiresAt)

        set({
            accessToken: tokens.accessToken,
            refreshToken: tokens.refreshToken,
            expiresAt: tokens.expiresAt,
            user:
                user !== undefined
                    ? normalizeAuthUser(user)
                    : useAuthStore.getState().user,
            isAuthenticated: true,
            error: null,
        })
    },

    clearAuth: () => {
        localStorage.removeItem('access_token')
        localStorage.removeItem('refresh_token')
        localStorage.removeItem('expires_at')

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
}))

export const checkAuthOrRefresh = async (): Promise<boolean> => {
    const { accessToken, refreshToken, expiresAt, setAuth, clearAuth } =
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
            const response = await fetch('/api/v1/auth/refresh', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ refresh_token: refreshToken }),
            })

            if (response.ok) {
                const data = await response.json()
                const newTokens = {
                    accessToken: data.access_token,
                    refreshToken: data.refresh_token,
                    expiresAt: data.access_token_expires_at,
                }
                const user = normalizeAuthUser(data.user)
                setAuth(newTokens, user)
                return true
            }
        } catch (error) {
            console.error('Lỗi gia hạn token ngầm:', error)
        }
    }

    clearAuth()
    return false
}
