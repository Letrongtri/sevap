import { create } from 'zustand'
import type {
    TenantLog,
    TenantLogFilters,
    TenantLogWSResponse,
} from '../types/tenantLog'
import type { PaginatedResponse, WSStatus } from '../types/common'

interface TenantLogWSState {
    socket: WebSocket | null
    status: WSStatus

    // Data
    logs: TenantLog[]
    pagination: PaginatedResponse | null
    error: string | null

    // Để phân biệt disconnect chủ động vs bị reject (auth error, v.v.)
    _permanentlyClosed: boolean

    // Filters (dùng để gửi xuống WS nếu backend hỗ trợ, hoặc để re-connect)
    filters: TenantLogFilters

    // Actions
    connect: (token: string, forceReconnect?: boolean) => void
    disconnect: () => void
    setFilters: (filters: Partial<TenantLogFilters>) => void
    clearLogs: () => void
}

const DEFAULT_FILTERS: TenantLogFilters = {
    page: 1,
    limit: 15,
    sort_order: 'desc',
}

/** Các WS close codes mà ta KHÔNG nên tự động reconnect */
const TERMINAL_CLOSE_CODES = new Set([
    1008, // Policy violation (auth failed, permission denied)
    1011, // Internal server error
    4001, // Custom: unauthorized
    4003, // Custom: forbidden
])

export const useTenantLogWSStore = create<TenantLogWSState>((set, get) => ({
    socket: null,
    status: 'CLOSED',
    logs: [],
    pagination: null,
    error: null,
    _permanentlyClosed: false,
    filters: DEFAULT_FILTERS,

    connect: (token: string, forceReconnect = false) => {
        const current = get().socket

        if (forceReconnect) {
            // Filter thay đổi → phải force-close socket cũ, reconnect với params mới
            if (current) {
                current.onclose = null // tắt handler cũ để không trigger state update
                current.close(1000, 'filter-change')
            }
        } else {
            // Lần đầu connect: nếu đang OPEN rồi thì bỏ qua
            if (current?.readyState === WebSocket.OPEN || current?.readyState === WebSocket.CONNECTING) return
            current?.close()
        }

        set({ status: 'CONNECTING', error: null, _permanentlyClosed: false })

        // Clear logs khi reconnect để tránh hiển thị data stale
        if (forceReconnect) {
            set({ logs: [], pagination: null })
        }

        const { filters } = get()
        const params = new URLSearchParams({ token })
        if (filters.page) params.set('page', String(filters.page))
        if (filters.limit) params.set('limit', String(filters.limit))
        if (filters.sort_order) params.set('sort_order', filters.sort_order)
        if (filters.log_level) params.set('log_level', filters.log_level)
        if (filters.action) params.set('action', filters.action)
        if (filters.resource) params.set('resource', filters.resource)
        if (filters.user_id) params.set('user_id', filters.user_id)
        if (filters.start_date) params.set('start_date', filters.start_date)
        if (filters.end_date) params.set('end_date', filters.end_date)

        const wsProtocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
        const wsHost = import.meta.env.VITE_WS_URL || `${wsProtocol}//${window.location.host}/api/v1`
        const ws = new WebSocket(
            `${wsHost}/ws/tenant-logs?${params.toString()}`
        )

        ws.onopen = () => set({ status: 'OPEN', socket: ws })

        ws.onclose = (event) => {
            // Nếu bị reject bởi server (auth/permission) → đánh dấu permanent close,
            // không để hook tự reconnect vô hạn
            const isPermanent = TERMINAL_CLOSE_CODES.has(event.code)
            set({
                status: 'CLOSED',
                socket: null,
                _permanentlyClosed: isPermanent,
                ...(isPermanent && {
                    error: `Connection rejected by server (code ${event.code})`,
                }),
            })
        }

        ws.onerror = () =>
            set({ error: 'WebSocket connection error', status: 'CLOSED' })

        ws.onmessage = (event) => {
            try {
                const response: TenantLogWSResponse = JSON.parse(event.data)

                if (response.event === 'HISTORY_LOADED') {
                    set({
                        logs: response.data.data,
                        pagination: response.data.pagination,
                        error: null,
                    })
                } else if (response.event === 'NEW_ACTIVITY_LOG') {
                    // Prepend log mới vào đầu danh sách, giới hạn theo limit
                    set((state) => {
                        const limit = state.filters.limit ?? 15
                        const updated = [response.data, ...state.logs].slice(
                            0,
                            limit
                        )
                        return { logs: updated }
                    })
                } else if (response.event === 'error') {
                    set({ error: response.detail })
                }
            } catch (e) {
                console.error('[TenantLogWS] Failed to parse message:', e)
            }
        }

        set({ socket: ws })
    },

    disconnect: () => {
        const current = get().socket
        if (current) {
            current.onclose = null // tắt handler để không trigger _permanentlyClosed
            current.close()
        }
        set({ socket: null, status: 'CLOSED', _permanentlyClosed: true })
    },

    setFilters: (partial) => {
        set((state) => ({
            filters: { ...state.filters, ...partial, page: 1 },
        }))
    },

    clearLogs: () => set({ logs: [], pagination: null }),
}))
