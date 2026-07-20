import {
    Users,
    Shield,
    Layers,
    Briefcase,
    FileText,
    Database,
    HardDrive,
    AlertCircle,
} from 'lucide-react'
import { useTenantOverviewCards } from '../../hooks/useTenantAdminDashboard'
import LoadingSpinner from '../ui/LoadingSpinner'
import Button from '../ui/Button'
import { formatBytes } from '../../../utils/formater'

interface StatCardItem {
    label: string
    value: string | number
    subValue?: string
    subLabel?: string
    icon: React.ReactNode
    iconBg: string
    iconColor: string
    badge?: React.ReactNode
}

export default function StatCardsRow() {
    const { data, isLoading, isError, refetch } = useTenantOverviewCards()

    if (isLoading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[400px] space-y-3">
                <LoadingSpinner />
                <p className="text-sm text-text-placeholder">
                    Loading company information...
                </p>
            </div>
        )
    }

    if (isError) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[400px] text-center p-6 space-y-2">
                <AlertCircle className="w-10 h-10 text-error" />
                <h3 className="text-lg font-semibold text-text-primary">
                    Failed to load company information
                </h3>
                <p className="text-sm text-text-placeholder max-w-sm">
                    {'An error occurred while loading company information'}
                </p>
                <Button variant="secondary" size="sm" onClick={() => refetch()}>
                    Retry
                </Button>
            </div>
        )
    }

    const cards: StatCardItem[] = [
        {
            label: 'Users Active',
            value: data?.total_users.toLocaleString() ?? '',
            subLabel: 'Active accounts',
            icon: <Users className="w-3.5 h-3.5" />,
            iconBg: 'bg-primary/10',
            iconColor: 'text-primary',
        },
        {
            label: 'Custom Roles',
            value: data?.total_custom_roles.toLocaleString() ?? '',
            subLabel: 'RBAC permissions',
            icon: <Shield className="w-3.5 h-3.5" />,
            iconBg: 'bg-purple-50',
            iconColor: 'text-purple-600',
        },
        {
            label: 'Departments',
            value: data?.total_departments.toLocaleString() ?? '',
            icon: <Layers className="w-3.5 h-3.5" />,
            subLabel: 'Org structure',
            iconBg: 'bg-amber-50',
            iconColor: 'text-amber-600',
        },
        {
            label: 'Job Titles',
            value: data?.total_job_titles.toLocaleString() ?? '',
            subLabel: 'Designations mapped',
            icon: <Briefcase className="w-3.5 h-3.5" />,
            iconBg: 'bg-rose-50',
            iconColor: 'text-rose-600',
        },
        {
            label: 'Knowledge Docs',
            value: data?.total_documents.toLocaleString() ?? '',
            icon: <FileText className="w-3.5 h-3.5" />,
            iconBg: 'bg-emerald-50',
            iconColor: 'text-emerald-600',
            badge: (
                <div className="mt-2 text-[11px] font-semibold text-success flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-success inline-block" />
                    100% Embedded
                </div>
            ),
        },
        {
            label: 'Embedding Chunks',
            value: data?.total_embeddings.toLocaleString() ?? '',
            subLabel: 'BGE-M3 (1024-dim)',
            icon: <Database className="w-3.5 h-3.5" />,
            iconBg: 'bg-cyan-50',
            iconColor: 'text-cyan-600',
        },
        {
            label: 'Tenant Storage',
            value: formatBytes(data?.total_storage ?? 0),
            subLabel: 'Total disk usage',
            icon: <HardDrive className="w-3.5 h-3.5" />,
            iconBg: 'bg-sky-50',
            iconColor: 'text-sky-600',
        },
    ]

    return (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-7 gap-3">
            {cards.map((card, idx) => (
                <StatCard key={idx} card={card} />
            ))}
        </div>
    )
}

function StatCard({ card }: { card: StatCardItem }) {
    return (
        <div className="bg-surface p-4 rounded-2xl border border-border/50 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 flex flex-col justify-between min-h-[108px]">
            <div className="flex items-start justify-between mb-2 gap-1">
                <div
                    className={`p-1.5 rounded-xl flex-shrink-0 ${card.iconBg} ${card.iconColor}`}
                >
                    {card.icon}
                </div>
                <p className="text-xs font-bold text-text-muted uppercase tracking-wider leading-tight line-clamp-2 text-right">
                    {card.label}
                </p>
            </div>
            <p className="text-2xl font-bold text-text-primary">{card.value}</p>
            {card.badge ??
                (card.subLabel && (
                    <div className="mt-1.5 text-[11px] text-text-muted font-medium">
                        {card.subLabel}
                    </div>
                ))}
        </div>
    )
}
