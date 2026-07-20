/* eslint-disable react-hooks/exhaustive-deps */
import { useEffect, useRef } from 'react'
import { useAuthStore } from '../store/authStore'
import { useTenantLogWSStore } from '../store/useTenantLogWSStore'

/**
 * Hook kết nối WebSocket audit log cho tenant admin.
 * - Tự động lấy accessToken từ authStore.
 * - Tự kết nối khi mount, tự ngắt khi unmount.
 * - Tự reconnect (force-close + reopen) khi filters thay đổi.
 *
 * FIX:
 *  - Bỏ `status` ra khỏi dependency array để tránh infinite reconnect loop.
 *  - Dùng `statusRef` để đọc status hiện tại mà không trigger re-render.
 *  - Kiểm tra `_permanentlyClosed` để không reconnect sau auth error.
 */
export function useTenantLogWS() {
    const accessToken = useAuthStore((s) => s.accessToken)
    const {
        connect,
        disconnect,
        status,
        logs,
        pagination,
        error,
        filters,
        setFilters,
        _permanentlyClosed,
    } = useTenantLogWSStore()

    // Dùng ref để đọc giá trị hiện tại mà không đưa vào dependency array
    const statusRef = useRef(status)
    const permanentlyClosedRef = useRef(_permanentlyClosed)
    useEffect(() => {
        statusRef.current = status
    }, [status])
    useEffect(() => {
        permanentlyClosedRef.current = _permanentlyClosed
    }, [_permanentlyClosed])

    // Track previous filters để detect thay đổi
    const filtersRef = useRef(filters)

    // Effect chính: kết nối lần đầu khi mount (không có `status` trong deps)
    useEffect(() => {
        if (!accessToken) return
        // Không kết nối nếu server đã reject trước đó (auth/permission error)
        if (permanentlyClosedRef.current) return

        const currentStatus = statusRef.current
        if (currentStatus === 'CLOSED') {
            connect(accessToken, false)
        }
    }, [accessToken])

    // Effect riêng: reconnect khi filters thay đổi (force-close socket cũ)
    useEffect(() => {
        if (!accessToken) return
        if (permanentlyClosedRef.current) return

        const filtersChanged =
            JSON.stringify(filtersRef.current) !== JSON.stringify(filters)

        if (filtersChanged) {
            filtersRef.current = filters
            // forceReconnect = true: đóng socket cũ + clear logs + mở lại với params mới
            connect(accessToken, true)
        }
    }, [filters])

    // Cleanup duy nhất: disconnect khi unmount component
    useEffect(() => {
        return () => {
            disconnect()
        }
    }, [])

    return {
        status,
        logs,
        pagination,
        error,
        filters,
        setFilters,
        isConnecting: status === 'CONNECTING',
        isOpen: status === 'OPEN',
    }
}
