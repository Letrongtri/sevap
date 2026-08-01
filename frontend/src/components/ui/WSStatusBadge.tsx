import { Loader2, Wifi, WifiOff } from 'lucide-react'

export default function WSStatusBadge({
    status,
}: {
    status: 'CONNECTING' | 'OPEN' | 'CLOSED'
}) {
    if (status === 'OPEN') {
        return (
            <div className="flex items-center gap-1.5 text-[10px] font-semibold text-emerald-400">
                <span className="relative flex h-2 w-2">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                    <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
                </span>
                <Wifi className="w-3 h-3" />
                Live
            </div>
        )
    }
    if (status === 'CONNECTING') {
        return (
            <div className="flex items-center gap-1.5 text-[10px] font-semibold text-amber-400">
                <Loader2 className="w-3 h-3 animate-spin" />
                Đang kết nối…
            </div>
        )
    }
    return (
        <div className="flex items-center gap-1.5 text-[10px] font-semibold text-text-muted">
            <WifiOff className="w-3 h-3" />
            Offline
        </div>
    )
}
