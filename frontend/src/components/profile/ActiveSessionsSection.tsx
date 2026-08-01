import { Monitor, MonitorSmartphone, Smartphone } from 'lucide-react'
import { SecurityIcon } from './SecurityIcon'
import type { UserSession } from '../../types/myProfile'
import LoadingSpinner from '../ui/LoadingSpinner'
import { toast } from 'sonner'
import { useMyUserSessions } from '../../hooks/useUsers'
import Pagination from '../ui/Pagination'
import { useMyProfileStore } from '../../store/myProfileStore'
import { useRevokeUserSession } from '../../hooks/useUserSession'
import ConfirmDialog from '../ui/ConfirmDialog'
import { useState } from 'react'
import type { ID } from '../../types/common'

/* ============================================================
   ActiveSessionsSection — Security card row that lists all
   active device sessions.

   Each session shows: device icon, device name + "Current" badge,
   location • status text, and a "Sign out" button for remote sessions.
   ============================================================ */

export default function UserSessionsSection() {
    const { data, isLoading, error } = useMyUserSessions()
    const revokeSessionMutation = useRevokeUserSession()

    const page = useMyProfileStore((s) => s.page) || 1
    const setPage = useMyProfileStore((s) => s.setPage)
    const limit = useMyProfileStore((s) => s.limit) || 10
    const setLimit = useMyProfileStore((s) => s.setLimit)

    const [showConfirm, setShowConfirm] = useState(false)
    const [selectedSessionId, setSelectedSessionId] = useState<ID | null>(null)

    const sessions = data?.sessions || []
    const pagination = data?.pagination

    if (isLoading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[400px] space-y-3">
                <LoadingSpinner />
                <p className="text-sm text-text-placeholder">
                    Đang tải danh sách phiên đăng nhập...
                </p>
            </div>
        )
    }

    if (error) {
        toast.error('Tải hồ sơ thất bại', {
            description: error.message,
        })
        return <></>
    }

    if (sessions.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[400px] text-center p-6 space-y-2">
                <MonitorSmartphone className="w-10 h-10 text-text-placeholder" />
                <h3 className="text-base font-semibold text-text-secondary">
                    Không tìm thấy phiên đăng nhập nào
                </h3>
                <p className="text-sm text-text-placeholder max-w-xs">
                    Không có phiên đăng nhập nào đang hoạt động.
                </p>
            </div>
        )
    }

    const handleRevoke = (sessionId: ID) => {
        revokeSessionMutation.mutate(sessionId)
    }

    const handleConfirm = () => {
        if (!selectedSessionId) return
        handleRevoke(selectedSessionId)
        setShowConfirm(false)
        setSelectedSessionId(null)
    }

    return (
        <>
            <div className="px-6 py-5">
                <div className="flex items-center gap-3 mb-4">
                    <SecurityIcon>
                        <MonitorSmartphone className="w-4 h-4" />
                    </SecurityIcon>
                    <p className="text-sm font-semibold text-text-primary">
                        Các phiên đăng nhập đang hoạt động
                    </p>
                </div>

                {/* Sessions sub-card */}
                <div className="rounded-xl border border-border overflow-hidden">
                    {sessions.map((session, idx) => (
                        <SessionItem
                            key={session.id}
                            session={session}
                            idx={idx}
                            onRevoke={(id) => {
                                setSelectedSessionId(id)
                                setShowConfirm(true)
                            }}
                        />
                    ))}

                    {pagination && (
                        <div className="flex-shrink-0 p-4">
                            <Pagination
                                page={page}
                                limit={limit}
                                totalPages={pagination.total_pages}
                                totalItems={pagination.total}
                                unit="phiên đăng nhập"
                                onPageChange={setPage}
                                onLimitChange={setLimit}
                            />
                        </div>
                    )}
                </div>
            </div>

            {/* ── Confirm dialog ────────────────────────────── */}
            <ConfirmDialog
                isOpen={showConfirm}
                onClose={() => setShowConfirm(false)}
                onConfirm={handleConfirm}
                title="Thu hồi phiên đăng nhập?"
                description="Hành động này sẽ thu hồi và đăng xuất khỏi phiên đã chọn ngay lập tức."
                confirmLabel="Thu hồi phiên"
                variant="danger"
                isLoading={revokeSessionMutation.isPending}
            />
        </>
    )
}

interface SessionItemProps {
    session: UserSession
    idx: number
    onRevoke: (sessionId: ID) => void
}

function SessionItem({ session, idx, onRevoke }: SessionItemProps) {
    const deviceIcon = () => {
        if (
            session.device.toLowerCase().includes('iphone') ||
            session.device.toLowerCase().includes('ios') ||
            session.device.toLowerCase().includes('android')
        ) {
            return <Smartphone className="w-4 h-4" />
        }
        if (
            session.device.toLowerCase().includes('pc') ||
            session.device.toLowerCase().includes('windows') ||
            session.device.toLowerCase().includes('mac') ||
            session.device.toLowerCase().includes('linux')
        ) {
            return <Monitor className="w-4 h-4" />
        }
        return <MonitorSmartphone className="w-4 h-4" />
    }

    return (
        <>
            {idx > 0 && <div className="h-px bg-border/60 mx-4" />}
            <div className="flex items-center gap-3 px-4 py-3.5">
                {/* Device icon */}
                <div className="w-9 h-9 rounded-lg bg-bg flex items-center justify-center flex-shrink-0">
                    {deviceIcon()}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                        <p className="text-sm font-semibold text-text-primary truncate">
                            {session.device}
                        </p>
                        {session.is_current && (
                            <span
                                className="flex-shrink-0 inline-flex items-center px-1.5 py-0.5 rounded-full text-[10px] font-bold"
                                style={{
                                    background: 'var(--color-success-bg)',
                                    color: 'var(--color-success)',
                                }}
                            >
                                Hiện tại
                            </span>
                        )}
                    </div>
                    <p className="text-xs text-text-muted mt-0.5">
                        {session.location}
                        <span className="mx-1.5 text-text-disabled">•</span>
                        <span
                            className={
                                session.is_current
                                    ? 'text-success font-medium'
                                    : ''
                            }
                        >
                            {session.status}
                        </span>
                    </p>
                </div>

                {/* Sign out (remote sessions only) */}
                {!session.is_current && !session.is_revoked && (
                    <button
                        id={`session-signout-${session.id}`}
                        onClick={() => onRevoke(session.id)}
                        className="flex-shrink-0 text-xs font-semibold text-error hover:text-error/70 transition-colors duration-150 px-2 py-1 rounded-lg hover:bg-error-bg"
                    >
                        Đăng xuất
                    </button>
                )}
            </div>
        </>
    )
}
