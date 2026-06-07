import axios from 'axios'
import { useAuthStore } from '../store/authStore'

const axiosClient = axios.create({
    baseURL: 'http://localhost:8000/api/v1',
    headers: { 'Content-Type': 'application/json' },
})

// 1. Request Interceptor: Tự động đính kèm access_token hiện tại vào Header
axiosClient.interceptors.request.use(
    (config) => {
        const { accessToken } = useAuthStore.getState()
        if (accessToken && config.headers) {
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
                    const res = await axios.post('/api/auth/refresh', {
                        refresh_token: refreshToken,
                    })
                    const {
                        access_token,
                        refresh_token,
                        access_token_expires_at,
                    } = res.data

                    setAuth({
                        accessToken: access_token,
                        refreshToken: refresh_token,
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
