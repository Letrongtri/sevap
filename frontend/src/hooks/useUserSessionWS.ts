/* eslint-disable react-hooks/exhaustive-deps */
import { useEffect, useRef } from 'react'
import { useAuthStore } from '../store/authStore'
import { useUserSessionWSStore } from '../store/useUserSessionWSStore'

/**
 * Hook connecting to WebSocket user sessions for tenant admin.
 * - Automatically fetches accessToken from authStore.
 * - Auto connects on mount, disconnects on unmount.
 * - Auto reconnects when filters change.
 */
export function useUserSessionWS() {
    const accessToken = useAuthStore((s) => s.accessToken)
    const {
        connect,
        disconnect,
        status,
        sessions,
        pagination,
        error,
        filters,
        setFilters,
        _permanentlyClosed,
    } = useUserSessionWSStore()

    const statusRef = useRef(status)
    const permanentlyClosedRef = useRef(_permanentlyClosed)

    useEffect(() => {
        statusRef.current = status
    }, [status])

    useEffect(() => {
        permanentlyClosedRef.current = _permanentlyClosed
    }, [_permanentlyClosed])

    const filtersRef = useRef(filters)

    useEffect(() => {
        if (!accessToken) return
        if (permanentlyClosedRef.current) return

        const currentStatus = statusRef.current
        if (currentStatus === 'CLOSED') {
            connect(accessToken, false)
        }
    }, [accessToken])

    useEffect(() => {
        if (!accessToken) return
        if (permanentlyClosedRef.current) return

        const filtersChanged =
            JSON.stringify(filtersRef.current) !== JSON.stringify(filters)

        if (filtersChanged) {
            filtersRef.current = filters
            connect(accessToken, true)
        }
    }, [filters])

    useEffect(() => {
        return () => {
            disconnect()
        }
    }, [])

    return {
        status,
        sessions,
        pagination,
        error,
        filters,
        setFilters,
        isConnecting: status === 'CONNECTING',
        isOpen: status === 'OPEN',
    }
}
