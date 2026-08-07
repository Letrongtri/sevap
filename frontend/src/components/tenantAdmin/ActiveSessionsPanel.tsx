import {
    AlertCircle,
    Clock,
    LogOut,
    MapPin,
    MonitorX,
    WifiOff,
} from 'lucide-react'
import { useUserSessionWS } from '../../hooks/useUserSessionWS'
import WSStatusBadge from '../ui/WSStatusBadge'
import type { UserSessionAdmin } from '../../types/userSession'

const ROLE_COLORS: Record<string, string> = {
    Admin: 'bg-primary/10 text-primary border-primary/20',
    admin: 'bg-primary/10 text-primary border-primary/20',
    knowledge_manager: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    Employee: 'bg-bg text-text-secondary border-border',
    employee: 'bg-bg text-text-secondary border-border',
}

function SessionRow({
    session,
    onRevoke,
}: {
    session: UserSessionAdmin
    onRevoke?: (sessionId: string) => void
}) {
    const isRevoked = session.is_revoked || session.status === 'inactive'
    const primaryRole = session.roles?.[0] ?? 'employee'

    return (
        <div
            className={`flex items-center justify-between gap-3 p-3 rounded-xl border transition-colors ${
                isRevoked
                    ? 'border-border/30 bg-bg/50 opacity-60'
                    : 'border-border/40 bg-surface-raised/60 hover:bg-surface-raised'
            }`}
        >
            {/* Left: name + meta */}
            <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-bold text-text-primary truncate">
                        {session.full_name || session.email}
                    </span>
                    <span
                        className={`text-[10px] font-semibold border px-1.5 py-0.5 rounded-md flex-shrink-0 capitalize ${
                            ROLE_COLORS[primaryRole] ?? ROLE_COLORS['employee']
                        }`}
                    >
                        {primaryRole.replace('_', ' ')}
                    </span>
                </div>
                <div className="flex items-center gap-3 text-[10px] text-text-muted flex-wrap">
                    <span className="flex items-center gap-1">
                        <MapPin className="w-2.5 h-2.5 flex-shrink-0" />
                        {session.ip_address}
                        {session.location && session.location !== 'Unknown' && (
                            <span className="ml-0.5 text-text-placeholder">
                                ({session.location})
                            </span>
                        )}
                    </span>
                    {session.device && (
                        <span className="flex items-center gap-1">
                            <Clock className="w-2.5 h-2.5 flex-shrink-0" />
                            {session.device}
                        </span>
                    )}
                </div>
            </div>

            {/* Right: action */}
            {isRevoked ? (
                <div className="flex-shrink-0 flex items-center gap-1 text-[10px] text-text-muted">
                    <WifiOff className="w-3 h-3" />
                </div>
            ) : (
                <button
                    onClick={() => onRevoke?.(session.id)}
                    className="flex-shrink-0 flex items-center gap-1 text-[10px] font-semibold text-error border border-error/25 bg-error/5 hover:bg-error/15 px-2.5 py-1 rounded-lg transition-colors cursor-pointer"
                >
                    <LogOut className="w-3 h-3" />
                    Thu hồi
                </button>
            )}
        </div>
    )
}

function SkeletonSessionRow() {
    return (
        <div className="p-3 rounded-xl border border-border/30 bg-surface-raised/40 animate-pulse flex items-center justify-between">
            <div className="space-y-2 flex-1">
                <div className="h-3.5 bg-surface-raised/80 rounded w-1/3" />
                <div className="h-2.5 bg-surface-raised/80 rounded w-1/2" />
            </div>
            <div className="h-6 bg-surface-raised/80 rounded w-16" />
        </div>
    )
}

export default function ActiveSessionsPanel() {
    const { status, sessions, error } = useUserSessionWS()

    const isLoading = status === 'CONNECTING' && sessions.length === 0
    const activeCount = sessions.filter(
        (s) => s.status === 'active' && !s.is_revoked
    ).length

    return (
        <div className="bg-surface rounded-2xl border border-border/50 shadow-sm p-5 flex flex-col h-full">
            {/* Header */}
            <div className="flex items-start justify-between mb-3">
                <div>
                    <h3 className="text-sm font-bold text-text-primary">
                        Phiên người dùng đang hoạt động
                    </h3>
                    <p className="text-[11px] text-text-muted mt-0.5">
                        Theo dõi phiên làm việc thời gian thực của công ty
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <div className="flex items-center gap-1.5 text-[10px] font-bold text-success bg-success/10 border border-success/20 px-2.5 py-1 rounded-xl">
                        <span className="w-1.5 h-1.5 rounded-full bg-success animate-pulse inline-block" />
                        {activeCount} Đang hoạt động
                    </div>
                    <WSStatusBadge status={status} />
                </div>
            </div>

            {/* Error Banner */}
            {error && (
                <div className="flex items-center gap-2 p-2.5 mb-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-[11px]">
                    <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
                    {error}
                </div>
            )}

            {/* Session list */}
            <div className="flex-1 overflow-y-auto space-y-2 min-h-0">
                {isLoading ? (
                    [...Array(4)].map((_, i) => <SkeletonSessionRow key={i} />)
                ) : sessions.length === 0 ? (
                    <div className="py-10 text-center text-text-muted text-xs">
                        {status === 'CLOSED'
                            ? 'Đã ngắt kết nối WebSocket. Đang chờ kết nối lại…'
                            : 'Không tìm thấy phiên làm việc nào đang hoạt động.'}
                    </div>
                ) : (
                    sessions.map((session) => (
                        <SessionRow
                            key={session.id}
                            session={session}
                            onRevoke={() => {}}
                        />
                    ))
                )}
            </div>

            {/* Footer hint */}
            <div className="mt-3 pt-3 border-t border-border/40 flex items-center gap-1.5 text-[10px] text-text-muted">
                <MonitorX className="w-3 h-3" />
                <span>
                    Thu hồi phiên làm việc sẽ vô hiệu hóa tất cả token đang hoạt
                    động ngay lập tức.
                </span>
            </div>
        </div>
    )
}
