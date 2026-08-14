import { create } from 'zustand'
import type {
    UserSessionAdmin,
    UserSessionFilters,
    UserSessionWSResponse,
} from '../types/userSession'
import type { PaginatedResponse, WSStatus } from '../types/common'

interface UserSessionWSState {
    socket: WebSocket | null
    status: WSStatus

    // Data
    sessions: UserSessionAdmin[]
    pagination: PaginatedResponse | null
    error: string | null

    // Distinguish voluntary disconnect vs server rejection
    _permanentlyClosed: boolean

    // Filters
    filters: UserSessionFilters

    // Actions
    connect: (token: string, forceReconnect?: boolean) => void
    disconnect: () => void
    setFilters: (filters: Partial<UserSessionFilters>) => void
    clearSessions: () => void
}

const DEFAULT_FILTERS: UserSessionFilters = {
    page: 1,
    limit: 15,
}

/** Terminal WS close codes where we should NOT auto reconnect */
const TERMINAL_CLOSE_CODES = new Set([
    1008, // Policy violation
    1011, // Internal server error
    4001, // Custom: unauthorized
    4003, // Custom: forbidden
])

export const useUserSessionWSStore = create<UserSessionWSState>((set, get) => ({
    socket: null,
    status: 'CLOSED',
    sessions: [],
    pagination: null,
    error: null,
    _permanentlyClosed: false,
    filters: DEFAULT_FILTERS,

    connect: (token: string, forceReconnect = false) => {
        const current = get().socket

        if (forceReconnect) {
            if (current) {
                current.onclose = null
                current.close(1000, 'filter-change')
            }
        } else {
            if (
                current?.readyState === WebSocket.OPEN ||
                current?.readyState === WebSocket.CONNECTING
            )
                return
            current?.close()
        }

        set({ status: 'CONNECTING', error: null, _permanentlyClosed: false })

        if (forceReconnect) {
            set({ sessions: [], pagination: null })
        }

        const { filters } = get()
        const params = new URLSearchParams({ token })
        if (filters.page) params.set('page', String(filters.page))
        if (filters.limit) params.set('limit', String(filters.limit))
        if (filters.user_id) params.set('user_id', filters.user_id)
        if (filters.status) params.set('status', filters.status)

        const wsProtocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
        const wsHost = import.meta.env.VITE_WS_URL || `${wsProtocol}//${window.location.host}/api/v1`
        const ws = new WebSocket(
            `${wsHost}/ws/user-sessions?${params.toString()}`
        )

        ws.onopen = () => set({ status: 'OPEN', socket: ws })

        ws.onclose = (event) => {
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
                const response: UserSessionWSResponse = JSON.parse(event.data)

                if (response.event === 'HISTORY_LOADED') {
                    set({
                        sessions: response.data.sessions,
                        pagination: response.data.pagination,
                        error: null,
                    })
                } else if (response.event === 'error') {
                    set({ error: response.detail ?? 'Error loading user sessions' })
                }
            } catch (e) {
                console.error('[UserSessionWS] Failed to parse message:', e)
            }
        }

        set({ socket: ws })
    },

    disconnect: () => {
        const current = get().socket
        if (current) {
            current.onclose = null
            current.close()
        }
        set({ socket: null, status: 'CLOSED', _permanentlyClosed: true })
    },

    setFilters: (partial) => {
        set((state) => ({
            filters: { ...state.filters, ...partial, page: 1 },
        }))
    },

    clearSessions: () => set({ sessions: [], pagination: null }),
}))
