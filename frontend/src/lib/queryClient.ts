import { QueryClient } from '@tanstack/react-query'

export const queryClient = new QueryClient({
    defaultOptions: {
        queries: {
            // Dữ liệu được coi là "cũ" sau 30 giây
            staleTime: 30 * 1000,
            // Thử lại tối đa 1 lần khi gặp lỗi
            retry: 1,
            // Không refetch khi window focus lại (tránh request thừa)
            refetchOnWindowFocus: false,
        },
        mutations: {
            retry: 0,
        },
    },
})
