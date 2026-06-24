import type { LoginCredentials } from '../types/auth'
import { useAuthStore } from '../store/authStore'
import { useNavigate } from '@tanstack/react-router'
import axiosClient from '../api/axios'
import { DEFAULT_REDIRECT, GLOBAL_ADMIN_REDIRECT } from '../routes/paths'

export function useAuth() {
    const {
        setAuth,
        setLoading,
        setError,
        isLoading,
        error,
        refreshToken,
        clearAuth,
    } = useAuthStore()

    const navigate = useNavigate()

    /** Login for regular tenant users (requires tenant domain) */
    const login = async (credentials: LoginCredentials) => {
        setLoading(true)
        setError(null)

        try {
            const tenantDomain = credentials.tenantDomain
                .trim()
                .endsWith('.hrnexus.com')
                ? credentials.tenantDomain.trim()
                : `${credentials.tenantDomain.trim()}.hrnexus.com`

            const formData = new FormData()
            formData.append('tenant_domain', tenantDomain)
            formData.append('employee_code', credentials.employeeCode)
            formData.append('password', credentials.password)
            const response = await axiosClient.post('/auth/login', formData)

            const { access_token, refresh_token, access_token_expires_at } =
                response.data

            setAuth(
                {
                    accessToken: access_token,
                    refreshToken: refresh_token,
                    expiresAt: access_token_expires_at,
                },
                response.data.user
            )

            navigate({ to: DEFAULT_REDIRECT })
        } catch (err) {
            const error = err as { response?: { status?: number } }
            console.log('Lỗi đăng nhập: ', error)
            if (
                error.response?.status === 401 ||
                error.response?.status === 400
            ) {
                setError('Tên đăng nhập hoặc mật khẩu không chính xác!')
            } else {
                setError('Hệ thống đang gặp sự cố, vui lòng thử lại sau.')
            }
        } finally {
            setLoading(false)
        }
    }

    /**
     * Login for Global Admin (system.hrnexus.com domain).
     * No tenant domain input required — uses system domain automatically.
     */
    const loginGlobalAdmin = async ({
        employeeCode,
        password,
    }: {
        employeeCode: string
        password: string
    }) => {
        setLoading(true)
        setError(null)

        try {
            const formData = new FormData()
            formData.append('employee_code', employeeCode)
            formData.append('password', password)
            const response = await axiosClient.post('/auth/login', formData)

            const { access_token, refresh_token, access_token_expires_at } =
                response.data

            setAuth(
                {
                    accessToken: access_token,
                    refreshToken: refresh_token,
                    expiresAt: access_token_expires_at,
                },
                response.data.user
            )

            navigate({ to: GLOBAL_ADMIN_REDIRECT })
        } catch (err) {
            const error = err as { response?: { status?: number } }
            console.log('Lỗi đăng nhập Global Admin: ', error)
            if (
                error.response?.status === 401 ||
                error.response?.status === 400 ||
                error.response?.status === 403
            ) {
                setError(
                    'Thông tin đăng nhập không hợp lệ hoặc tài khoản không có quyền.'
                )
            } else {
                setError('Hệ thống đang gặp sự cố, vui lòng thử lại sau.')
            }
        } finally {
            setLoading(false)
        }
    }

    const logout = async () => {
        if (!refreshToken) {
            clearAuth()
            navigate({ to: '/login' })
            return
        }
        try {
            await axiosClient.post('/auth/logout', {
                refresh_token: refreshToken,
            })
        } catch (error) {
            console.log('Lỗi đăng xuất: ', error)
        } finally {
            clearAuth()
            navigate({ to: '/login' })
        }
    }

    return {
        isLoading,
        error,
        login,
        loginGlobalAdmin,
        logout,
    }
}
