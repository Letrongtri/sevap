import axios from 'axios'
import { useAuthStore } from '../store/authStore'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api/v1'

const axiosClient = axios.create({
    baseURL: API_BASE_URL,
    headers: { 'Content-Type': 'application/json' },
})

// 1. Request Interceptor: Tự động đính kèm access_token hiện tại vào Header (trừ login và refresh)
axiosClient.interceptors.request.use(
    (config) => {
        const { accessToken } = useAuthStore.getState()
        const isPublic = config.url?.includes('/auth/login') || config.url?.includes('/auth/refresh')
        
        if (accessToken && config.headers && !isPublic) {
            config.headers.Authorization = `Bearer ${accessToken}`
        }
        return config
    },
    (error) => Promise.reject(error)
)

// 2. Response Interceptor: Đánh chặn lỗi 401 và tự phục hồi request lỗi
axiosClient.interceptors.response.use(
    (response) => response,
    async (error) => {
        const originalRequest = error.config

        // Nếu backend trả về 401 và request này chưa từng thử lại (tránh lặp vô hạn)
        if (error.response?.status === 401 && !originalRequest._retry) {
            originalRequest._retry = true
            const { refreshToken, setAuth, clearAuth } = useAuthStore.getState()

            if (refreshToken) {
                try {
                    // Gọi API refresh riêng biệt
                    const res = await axios.post(`${API_BASE_URL}/auth/refresh`, {
                        refresh_token: refreshToken,
                    })
                    const {
                        access_token,
                        refresh_token: new_refresh_token,
                        access_token_expires_at,
                    } = res.data

                    setAuth({
                        accessToken: access_token,
                        refreshToken: new_refresh_token || refreshToken,
                        expiresAt: access_token_expires_at,
                    })

                    // Cập nhật lại token mới cho request cũ và chạy lại nó
                    originalRequest.headers.Authorization = `Bearer ${access_token}`
                    return axiosClient(originalRequest)
                } catch (refreshError) {
                    // Nếu refresh token cũng hỏng/hết hạn -> Ép logout hoàn toàn
                    clearAuth()
                    window.location.href = '/login'
                    return Promise.reject(refreshError)
                }
            }
        }
        return Promise.reject(error)
    }
)

export default axiosClient
