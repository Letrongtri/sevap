import { useTenantLogStore } from '../../store/tenantLogStore'
import {
    AlertCircle,
    X,
    User,
    Mail,
    Globe,
    Monitor,
    MapPin,
    Hash,
    Activity,
    Database,
    Clock,
    Code,
    ShieldAlert,
    Building2,
    Info,
} from 'lucide-react'
import LoadingSpinner from '../ui/LoadingSpinner'
import Button from '../ui/Button'
import Badge from '../ui/Badge'
import { useTenantLogById } from '../../hooks/useTenantLog'
import { formatDateTimeToDDMMYYYYHHMMSS } from '../../../utils/formater'
import { stringToLabel } from '../../../utils/utils'

const LOG_LEVEL_BADGE_VARIANT: Record<string, 'info' | 'warning' | 'error' | 'default'> = {
    info: 'info',
    warning: 'warning',
    error: 'error',
}

/** A simple key-value row */
function InfoRow({
    icon,
    label,
    value,
    mono = false,
}: {
    icon: React.ReactNode
    label: string
    value: React.ReactNode
    mono?: boolean
}) {
    if (value === null || value === undefined || value === '') return null
    return (
        <div className="flex items-start gap-3 py-2.5 border-b border-[#D4D7DE]/30 last:border-0">
            <span className="mt-0.5 flex-shrink-0 text-text-placeholder">{icon}</span>
            <div className="flex flex-col min-w-0 flex-1">
                <span className="text-[10px] uppercase tracking-wider font-bold text-text-placeholder mb-0.5">
                    {label}
                </span>
                <span className={['text-sm text-text-primary break-all', mono ? 'font-mono text-xs' : 'font-medium'].join(' ')}>
                    {value}
                </span>
            </div>
        </div>
    )
}

/** Renders the metadata JSON object in a pretty, readable way */
function MetaDataBlock({ data }: { data: Record<string, any> }) {
    const entries = Object.entries(data)
    if (entries.length === 0) return <span className="text-xs text-text-placeholder italic">Empty</span>

    return (
        <div className="flex flex-col gap-1">
            {entries.map(([key, val]) => (
                <div key={key} className="flex gap-2 text-xs">
                    <span className="font-semibold text-text-secondary min-w-[80px] shrink-0">{key}:</span>
                    <span className="font-mono text-text-primary break-all">
                        {typeof val === 'object' ? JSON.stringify(val) : String(val ?? '—')}
                    </span>
                </div>
            ))}
        </div>
    )
}

const TenantLogDetail = () => {
    const activeTenantLogId = useTenantLogStore((s) => s.activeTenantLogId)
    const setActiveTenantLogId = useTenantLogStore((s) => s.setActiveTenantLogId)

    const { data, isLoading, error, refetch } = useTenantLogById(activeTenantLogId!)

    const handleCloseCard = () => {
        setActiveTenantLogId(null)
    }

    return (
        <div className="flex flex-col h-full relative">
            {/* Header */}
            <div className="px-6 py-4 border-b border-[#D4D7DE]/40 flex-shrink-0 relative">
                <button
                    onClick={handleCloseCard}
                    title="Close detail panel"
                    className="absolute top-3 right-3 p-1.5 rounded-lg text-text-placeholder hover:text-text-primary hover:bg-bg transition-all duration-150 z-20 cursor-pointer"
                >
                    <X className="w-5 h-5" />
                </button>

                <h2 className="text-lg font-bold text-text-primary">
                    Activity Log Detail
                </h2>
                {data && (
                    <p className="text-xs text-text-placeholder mt-0.5 font-mono truncate pr-8">
                        ID: {data.id}
                    </p>
                )}
            </div>

            {/* Scrollable content */}
            <div className="flex-1 overflow-y-auto p-6 pt-4 scrollbar-thin">
                {isLoading ? (
                    <div className="flex flex-col items-center justify-center min-h-[400px] space-y-3">
                        <LoadingSpinner />
                        <p className="text-sm text-text-placeholder">
                            Loading activity log...
                        </p>
                    </div>
                ) : error ? (
                    <div className="flex flex-col items-center justify-center min-h-[400px] text-center p-6 space-y-2">
                        <AlertCircle className="w-10 h-10 text-error" />
                        <h3 className="text-lg font-semibold text-text-primary">
                            Failed to load activity log
                        </h3>
                        <p className="text-sm text-text-placeholder max-w-sm">
                            {error.message || 'An error occurred'}
                        </p>
                        <Button
                            variant="secondary"
                            size="sm"
                            onClick={() => refetch()}
                        >
                            Retry
                        </Button>
                    </div>
                ) : data ? (
                    <div className="flex flex-col gap-5">

                        {/* ── Section: Event ── */}
                        <section>
                            <div className="flex items-center gap-2 mb-2">
                                <Activity className="w-3.5 h-3.5 text-primary" />
                                <span className="text-xs font-bold uppercase tracking-wider text-primary">
                                    Event
                                </span>
                            </div>
                            <div className="bg-bg/30 rounded-xl px-4 py-1 border border-[#D4D7DE]/30">
                                <InfoRow
                                    icon={<Code className="w-3.5 h-3.5" />}
                                    label="Action"
                                    value={data.action}
                                    mono
                                />
                                <InfoRow
                                    icon={<Database className="w-3.5 h-3.5" />}
                                    label="Resource"
                                    value={data.resource || '—'}
                                    mono
                                />
                                <InfoRow
                                    icon={<ShieldAlert className="w-3.5 h-3.5" />}
                                    label="Log Level"
                                    value={
                                        <Badge
                                            variant={LOG_LEVEL_BADGE_VARIANT[data.log_level] ?? 'default'}
                                            size="sm"
                                            dot
                                        >
                                            {stringToLabel(data.log_level)}
                                        </Badge>
                                    }
                                />
                                <InfoRow
                                    icon={<Clock className="w-3.5 h-3.5" />}
                                    label="Created At"
                                    value={formatDateTimeToDDMMYYYYHHMMSS(data.created_at)}
                                />
                            </div>
                        </section>

                        {/* ── Section: Actor ── */}
                        <section>
                            <div className="flex items-center gap-2 mb-2">
                                <User className="w-3.5 h-3.5 text-primary" />
                                <span className="text-xs font-bold uppercase tracking-wider text-primary">
                                    Actor
                                </span>
                            </div>
                            <div className="bg-bg/30 rounded-xl px-4 py-1 border border-[#D4D7DE]/30">
                                <InfoRow
                                    icon={<User className="w-3.5 h-3.5" />}
                                    label="Full Name"
                                    value={data.user_name || 'System / Unknown'}
                                />
                                <InfoRow
                                    icon={<Hash className="w-3.5 h-3.5" />}
                                    label="Employee Code"
                                    value={data.employee_code || '—'}
                                    mono
                                />
                                <InfoRow
                                    icon={<Mail className="w-3.5 h-3.5" />}
                                    label="Email"
                                    value={data.email || '—'}
                                    mono
                                />
                                <InfoRow
                                    icon={<Hash className="w-3.5 h-3.5" />}
                                    label="User ID"
                                    value={data.user_id || '—'}
                                    mono
                                />
                                <InfoRow
                                    icon={<Building2 className="w-3.5 h-3.5" />}
                                    label="Tenant ID"
                                    value={data.tenant_id || '—'}
                                    mono
                                />
                            </div>
                        </section>

                        {/* ── Section: Request Context ── */}
                        <section>
                            <div className="flex items-center gap-2 mb-2">
                                <Globe className="w-3.5 h-3.5 text-primary" />
                                <span className="text-xs font-bold uppercase tracking-wider text-primary">
                                    Request Context
                                </span>
                            </div>
                            <div className="bg-bg/30 rounded-xl px-4 py-1 border border-[#D4D7DE]/30">
                                <InfoRow
                                    icon={<Globe className="w-3.5 h-3.5" />}
                                    label="IP Address"
                                    value={data.ip_address || '—'}
                                    mono
                                />
                                <InfoRow
                                    icon={<MapPin className="w-3.5 h-3.5" />}
                                    label="Location"
                                    value={data.location || '—'}
                                />
                                <InfoRow
                                    icon={<Monitor className="w-3.5 h-3.5" />}
                                    label="Device"
                                    value={data.device || '—'}
                                />
                                <InfoRow
                                    icon={<Info className="w-3.5 h-3.5" />}
                                    label="User Agent"
                                    value={data.user_agent || '—'}
                                    mono
                                />
                            </div>
                        </section>

                        {/* ── Section: Metadata ── */}
                        {data.meta_data && Object.keys(data.meta_data).length > 0 && (
                            <section>
                                <div className="flex items-center gap-2 mb-2">
                                    <Code className="w-3.5 h-3.5 text-primary" />
                                    <span className="text-xs font-bold uppercase tracking-wider text-primary">
                                        Metadata
                                    </span>
                                </div>
                                <div className="bg-bg/40 rounded-xl p-4 border border-[#D4D7DE]/30">
                                    <MetaDataBlock data={data.meta_data} />
                                </div>
                            </section>
                        )}
                    </div>
                ) : null}
            </div>
        </div>
    )
}

export default TenantLogDetail
