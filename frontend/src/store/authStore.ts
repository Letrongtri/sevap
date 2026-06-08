import { create } from 'zustand'
import type { AuthActions, AuthState, AuthUser } from '../types/auth'
import axiosClient from '../api/axios'

type AuthStore = AuthState & AuthActions

const normalizeAuthUser = (user): AuthUser => {
    if (!user) return null as any
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
        if (tokens.refreshToken) {
            localStorage.setItem('refresh_token', tokens.refreshToken)
        }
        if (tokens.expiresAt) {
            localStorage.setItem('expires_at', tokens.expiresAt)
        }

        set((state) => ({
            accessToken: tokens.accessToken,
            refreshToken: tokens.refreshToken || state.refreshToken,
            expiresAt: tokens.expiresAt || state.expiresAt,
            user:
                user !== undefined && user !== null
                    ? normalizeAuthUser(user)
                    : state.user,
            isAuthenticated: true,
            error: null,
        }))
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
            const response = await axiosClient.post('/auth/refresh', {
                refresh_token: refreshToken,
            })

            const data = response.data
            const newTokens = {
                accessToken: data.access_token,
                refreshToken: data.refresh_token || refreshToken,
                expiresAt: data.access_token_expires_at,
            }
            setAuth(newTokens, data.user)
            return true
        } catch (error) {
            console.error('Lỗi gia hạn token ngầm:', error)
        }
    }

    clearAuth()
    return false
}
