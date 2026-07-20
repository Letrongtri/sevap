import {
    Chart as ChartJS,
    ArcElement,
    Tooltip,
    Legend,
    type ChartOptions,
} from 'chart.js'
import { Doughnut } from 'react-chartjs-2'
import { AlertCircle } from 'lucide-react'
import { useTenantDocsStats } from '../../hooks/useTenantAdminDashboard'
import LoadingSpinner from '../ui/LoadingSpinner'
import Button from '../ui/Button'

// Register Chart.js components
ChartJS.register(ArcElement, Tooltip, Legend)

export default function DocDistributionChart() {
    const { data, isLoading, isError, refetch } = useTenantDocsStats()

    if (isLoading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[400px] space-y-3">
                <LoadingSpinner />
                <p className="text-sm text-text-placeholder">
                    Loading document distribution...
                </p>
            </div>
        )
    }

    if (isError) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[400px] text-center p-6 space-y-2">
                <AlertCircle className="w-10 h-10 text-error" />
                <h3 className="text-lg font-semibold text-text-primary">
                    Failed to load document distribution
                </h3>
                <p className="text-sm text-text-placeholder max-w-sm">
                    An error occurred while loading document distribution
                </p>
                <Button variant="secondary" size="sm" onClick={() => refetch()}>
                    Retry
                </Button>
            </div>
        )
    }

    const publicDocuments = data?.public_documents || 0
    const privateDocuments = data?.private_documents || 0
    const managerialDocuments = data?.managerial_documents || 0
    const total = publicDocuments + privateDocuments + managerialDocuments

    const rawData = [
        {
            label: 'Public',
            value: publicDocuments,
            color: '#10b981',
            pct: Math.round((publicDocuments / (total || 1)) * 100),
        },
        {
            label: 'Private',
            value: privateDocuments,
            color: '#f59e0b',
            pct: Math.round((privateDocuments / (total || 1)) * 100),
        },
        {
            label: 'Managerial',
            value: managerialDocuments,
            color: '#0350ff',
            pct: Math.round((managerialDocuments / (total || 1)) * 100),
        },
    ]

    const chartData = {
        labels: rawData.map((d) => d.label),
        datasets: [
            {
                data: rawData.map((d) => d.value),
                backgroundColor: rawData.map((d) => d.color),
                borderColor: rawData.map((d) => d.color),
                borderWidth: 1,
                hoverOffset: 6,
            },
        ],
    }

    const options: ChartOptions<'doughnut'> = {
        responsive: true,
        maintainAspectRatio: true,
        cutout: '72%',
        plugins: {
            legend: {
                display: false, // custom legend below
            },
            tooltip: {
                backgroundColor: 'rgba(15,23,42,0.92)',
                titleColor: '#94a3b8',
                bodyColor: '#f1f5f9',
                borderColor: 'rgba(255,255,255,0.08)',
                borderWidth: 1,
                padding: 10,
                cornerRadius: 8,
                callbacks: {
                    label: (ctx) => {
                        const item = rawData[ctx.dataIndex]
                        return ` ${item.value} (${item.pct}%)`
                    },
                },
            },
        },
    }

    return (
        <div className="bg-surface rounded-2xl border border-border/50 shadow-sm p-5 flex flex-col h-full">
            {/* Header */}
            <div>
                <h3 className="text-sm font-bold text-text-primary">
                    PAR Gate Document Distribution
                </h3>
                <p className="text-xs text-text-muted mt-0.5">
                    Classification by access levels under PAR context
                </p>
            </div>

            {/* Donut + Legend */}
            <div className="flex-1 flex flex-col items-center justify-center gap-4 py-2">
                {/* Chart.js Doughnut with center label overlay */}
                <div className="relative w-40 h-40">
                    {/* Center label */}
                    <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                        <span className="text-xl font-bold text-text-primary">
                            {total}
                        </span>
                        <span className="text-xs font-semibold text-text-muted uppercase">
                            Total
                        </span>
                    </div>
                    <Doughnut data={chartData} options={options} />
                </div>

                {/* Legend */}
                <div className="w-full space-y-2">
                    {rawData.map((item, i) => (
                        <div
                            key={i}
                            className="flex items-center justify-between text-xs"
                        >
                            <div className="flex items-center gap-2">
                                <span
                                    className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                                    style={{ backgroundColor: item.color }}
                                />
                                <span className="text-text-secondary font-medium">
                                    {item.label}
                                </span>
                            </div>
                            <div className="flex items-center gap-2">
                                <span className="font-bold text-text-primary">
                                    {item.value}
                                </span>
                                <span className="text-text-muted text-xs">
                                    ({item.pct}%)
                                </span>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    )
}
