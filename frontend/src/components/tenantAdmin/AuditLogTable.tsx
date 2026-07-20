/* eslint-disable react-hooks/set-state-in-effect */
import { AlertCircle } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useTenantLogWS } from '../../hooks/useTenantLogWS'
import type { TenantLog } from '../../types/tenantLog'
import { getActionColor } from '../../../utils/color'
import WSStatusBadge from '../ui/WSStatusBadge'
import { LOG_LEVEL_STYLES } from '../../types/common'
import { formatDateTimeToDDMMYYYYHHMMSS } from '../../../utils/formater'

// ─── Helpers ─────────────────────────────────────────────────────────────────

function getNewRowAnimClass(level: string, isNew: boolean): string {
    if (!isNew) return ''
    const lvl = level.toLowerCase()
    if (lvl === 'warning') return 'animate-log-row-warning'
    if (lvl === 'error') return 'animate-log-row-error'
    return 'animate-log-row-in'
}

// ─── Log Row ─────────────────────────────────────────────────────────────────

function LogRow({ log, isNew }: { log: TenantLog; isNew: boolean }) {
    const animClass = getNewRowAnimClass(log.log_level, isNew)

    return (
        <tr
            className={`hover:bg-surface-raised/60 transition-colors group border-b border-border/20 last:border-0 ${animClass}`}
        >
            {/* Action */}
            <td className="py-2.5 pr-4 whitespace-nowrap">
                <span
                    className={`text-xs font-bold ${getActionColor(log.action)}`}
                >
                    {log.action}
                </span>
            </td>

            {/* Resource */}
            <td className="py-2.5 pr-4 text-xs text-text-secondary whitespace-nowrap">
                {log.resource}
            </td>

            {/* Actor */}
            <td className="py-2.5 pr-4 whitespace-nowrap">
                <div className="flex flex-col">
                    <span className="text-[11px] font-medium text-text-primary">
                        {log.user_name ?? '—'}
                    </span>
                    {log.employee_code && (
                        <span className="text-[10px] text-text-muted">
                            {log.employee_code}
                        </span>
                    )}
                </div>
            </td>

            {/* Level */}
            <td className="py-2.5 pr-4 whitespace-nowrap">
                <span
                    className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold uppercase tracking-wide ${
                        LOG_LEVEL_STYLES[log.log_level.toLowerCase()] ??
                        LOG_LEVEL_STYLES['info']
                    }`}
                >
                    {log.log_level}
                </span>
            </td>

            {/* IP Address */}
            <td className="py-2.5 pr-4 text-[11px] text-text-muted whitespace-nowrap">
                {log.ip_address ?? '—'}
            </td>

            {/* Timestamp */}
            <td className="py-2.5 text-[11px] text-text-muted whitespace-nowrap">
                {formatDateTimeToDDMMYYYYHHMMSS(log.created_at)}
            </td>
        </tr>
    )
}

// ─── Skeleton Row ─────────────────────────────────────────────────────────────

function SkeletonRow() {
    return (
        <tr className="border-b border-border/20">
            {[...Array(6)].map((_, i) => {
                const width = 60 + ((i * 15) % 40)
                return (
                    <td key={i} className="py-2.5 pr-4">
                        <div
                            className="h-3 bg-surface-raised/80 rounded animate-pulse"
                            style={{ width: `${width}%` }}
                        />
                    </td>
                )
            })}
        </tr>
    )
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function AuditLogTable() {
    const { status, logs, pagination, error } = useTenantLogWS()

    // Track IDs that have already been seen (rendered at least once)
    // Using useState (not useRef) so it's safe to read during render
    const [seenIds, setSeenIds] = useState<Set<string>>(new Set())

    // IDs present now but not yet in seenIds are brand-new this cycle
    const newIds = new Set(
        logs.map((l) => l.id).filter((id) => !seenIds.has(id))
    )

    // After each render, mark all visible IDs as seen
    useEffect(() => {
        if (logs.length === 0) return
        setSeenIds((prev) => {
            const next = new Set(prev)
            logs.forEach((l) => next.add(l.id))
            return next
        })
    }, [logs])

    // When WS reconnects and logs is cleared, reset the seen set
    useEffect(() => {
        if (logs.length === 0) setSeenIds(new Set())
    }, [logs.length])

    const isLoading = status === 'CONNECTING' && logs.length === 0
    const totalItems = pagination?.total ?? 0

    return (
        <div className="bg-surface rounded-2xl border border-border/50 shadow-sm p-5 flex flex-col h-full">
            {/* Header */}
            <div className="flex items-start justify-between mb-4">
                <div>
                    <h3 className="text-sm font-bold text-text-primary">
                        Tenant Activity Audit Logs
                    </h3>
                    <p className="text-[11px] text-text-muted mt-0.5">
                        Strictly isolated auditing trails for active tenant
                        {totalItems > 0 && (
                            <span className="ml-1 text-text-placeholder">
                                · {totalItems.toLocaleString()} records
                            </span>
                        )}
                    </p>
                </div>
                <WSStatusBadge status={status} />
            </div>

            {/* Error Banner */}
            {error && (
                <div className="flex items-center gap-2 p-2.5 mb-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-[11px]">
                    <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
                    {error}
                </div>
            )}

            {/* Table */}
            <div className="flex-1 overflow-x-auto min-h-0">
                <table className="w-full text-xs border-collapse">
                    <thead>
                        <tr className="border-b border-border/60">
                            {[
                                'Action',
                                'Resource',
                                'Actor',
                                'Level',
                                'IP Address',
                                'Timestamp',
                            ].map((col) => (
                                <th
                                    key={col}
                                    className="text-left text-xs font-bold text-text-muted uppercase tracking-wider pb-2.5 pr-4 whitespace-nowrap"
                                >
                                    {col}
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {isLoading ? (
                            [...Array(8)].map((_, i) => <SkeletonRow key={i} />)
                        ) : logs.length === 0 ? (
                            <tr>
                                <td
                                    colSpan={6}
                                    className="py-10 text-center text-text-muted text-xs"
                                >
                                    {status === 'CLOSED'
                                        ? 'WebSocket disconnected. Waiting for connection…'
                                        : 'No audit logs found.'}
                                </td>
                            </tr>
                        ) : (
                            logs.map((log) => (
                                <LogRow
                                    key={log.id}
                                    log={log}
                                    isNew={newIds.has(log.id)}
                                />
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    )
}
