import { useState } from 'react'
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Filler,
    Tooltip,
    Legend,
    type ChartOptions,
} from 'chart.js'
import { Line } from 'react-chartjs-2'
import { AlertCircle, ChevronDown } from 'lucide-react'
import type {
    TenantChatStatsItem,
    ChatStatsGroupBy,
} from '../../types/tenantAdminDashboard'
import { useTenantChatStats } from '../../hooks/useTenantAdminDashboard'
import { useTenantAdminDashboardStore } from '../../store/tenantAdminDashboardStore'
import LoadingSpinner from '../ui/LoadingSpinner'
import Button from '../ui/Button'
import DatePicker from '../ui/DatePicker'

// Register Chart.js components
ChartJS.register(
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Filler,
    Tooltip,
    Legend
)

// ─── Group-by option config ────────────────────────────────────────────────
const GROUP_BY_OPTIONS: { value: ChatStatsGroupBy; label: string }[] = [
    { value: 'date', label: 'Theo ngày' },
    { value: 'week', label: 'Theo tuần' },
    { value: 'month', label: 'Theo tháng' },
    { value: 'year', label: 'Theo năm' },
]

// ─── Loading / Error shell ─────────────────────────────────────────────────
export default function QueryFrequencyChart() {
    const { data, isLoading, isError, refetch } = useTenantChatStats()

    if (isLoading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[400px] space-y-3">
                <LoadingSpinner />
                <p className="text-sm text-text-placeholder">
                    Đang tải thống kê chat...
                </p>
            </div>
        )
    }

    if (isError) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[400px] text-center p-6 space-y-2">
                <AlertCircle className="w-10 h-10 text-error" />
                <h3 className="text-lg font-semibold text-text-primary">
                    Không tải được dữ liệu
                </h3>
                <p className="text-sm text-text-placeholder max-w-sm">
                    Đã xảy ra lỗi khi tải thống kê chat.
                </p>
                <Button variant="secondary" size="sm" onClick={() => refetch()}>
                    Thử lại
                </Button>
            </div>
        )
    }

    return <QueryFrequencyChartMain data={data ?? []} />
}

// ─── Chart body ────────────────────────────────────────────────────────────
const QueryFrequencyChartMain = ({ data }: { data: TenantChatStatsItem[] }) => {
    const [dropdownOpen, setDropdownOpen] = useState(false)

    const groupBy    = useTenantAdminDashboardStore((s) => s.chatStatsGroupBy)
    const fromDate   = useTenantAdminDashboardStore((s) => s.chatStatsFromDate)
    const toDate     = useTenantAdminDashboardStore((s) => s.chatStatsToDate)
    const setGroupBy = useTenantAdminDashboardStore((s) => s.setChatStatsGroupBy)
    const setFrom    = useTenantAdminDashboardStore((s) => s.setChatStatsFromDate)
    const setTo      = useTenantAdminDashboardStore((s) => s.setChatStatsToDate)

    const selectedLabel =
        GROUP_BY_OPTIONS.find((o) => o.value === groupBy)?.label ?? 'Theo ngày'

    const labels = data.map((d) => d.label)

    const chartData = {
        labels,
        datasets: [
            {
                label: 'Cuộc hội thoại',
                data: data.map((d) => d.total_conversations),
                borderColor: '#0350ff',
                backgroundColor: 'rgba(3, 80, 255, 0.12)',
                borderWidth: 2,
                pointRadius: 3,
                pointBackgroundColor: '#0350ff',
                fill: true,
                tension: 0.35,
            },
            {
                label: 'Tin nhắn',
                data: data.map((d) => d.total_messages),
                borderColor: '#06b6d4',
                backgroundColor: 'rgba(6, 182, 212, 0.06)',
                borderWidth: 1.5,
                borderDash: [4, 3],
                pointRadius: 2.5,
                pointBackgroundColor: '#06b6d4',
                fill: false,
                tension: 0.35,
            },
        ],
    }

    const options: ChartOptions<'line'> = {
        responsive: true,
        maintainAspectRatio: false,
        interaction: {
            mode: 'index',
            intersect: false,
        },
        plugins: {
            legend: {
                display: false, // we render custom legend below
            },
            tooltip: {
                backgroundColor: 'rgba(15,23,42,0.92)',
                titleColor: '#94a3b8',
                bodyColor: '#f1f5f9',
                borderColor: 'rgba(255,255,255,0.08)',
                borderWidth: 1,
                padding: 10,
                cornerRadius: 8,
                titleFont: { size: 11 },
                bodyFont: { size: 12, weight: 'bold' },
            },
        },
        scales: {
            x: {
                grid: {
                    color: 'rgba(148,163,184,0.12)',
                    lineWidth: 0.5,
                },
                ticks: {
                    color: '#94a3b8',
                    font: { size: 9 },
                    maxRotation: 0,
                },
            },
            y: {
                grid: {
                    color: 'rgba(148,163,184,0.12)',
                    lineWidth: 0.5,
                },
                ticks: {
                    color: '#94a3b8',
                    font: { size: 10 },
                    maxTicksLimit: 5,
                },
                beginAtZero: true,
            },
        },
    }

    return (
        <div className="bg-surface rounded-2xl border border-border/50 shadow-sm p-5 flex flex-col gap-3 h-full">
            {/* ── Header row 1: title + group-by ─────────────── */}
            <div className="flex items-start justify-between gap-3">
                <div>
                    <h3 className="text-sm font-bold text-text-primary">
                        Interaction frequency
                    </h3>
                    <p className="text-xs text-text-muted mt-0.5">
                        Number of conversations and messages over time periods
                    </p>
                </div>

                {/* ── Group-by dropdown ───────────────────────── */}
                <div className="relative flex-shrink-0">
                    <button
                        id="qfc-groupby-btn"
                        onClick={() => setDropdownOpen((prev) => !prev)}
                        className="flex items-center gap-1.5 text-xs font-semibold
                                   bg-primary/10 text-primary border border-primary/25
                                   px-2.5 py-1.5 rounded-lg hover:bg-primary/20
                                   transition-colors duration-150 select-none"
                    >
                        {selectedLabel}
                        <ChevronDown
                            className={`w-3 h-3 transition-transform duration-200 ${
                                dropdownOpen ? 'rotate-180' : ''
                            }`}
                        />
                    </button>

                    {dropdownOpen && (
                        <>
                            <div
                                className="fixed inset-0 z-10"
                                onClick={() => setDropdownOpen(false)}
                            />
                            <div
                                className="absolute right-0 top-full mt-1.5 z-20
                                           bg-surface border border-border/60 rounded-xl
                                           shadow-lg overflow-hidden min-w-[110px]"
                            >
                                {GROUP_BY_OPTIONS.map((opt) => (
                                    <button
                                        key={opt.value}
                                        id={`qfc-groupby-${opt.value}`}
                                        onClick={() => {
                                            setGroupBy(opt.value)
                                            setDropdownOpen(false)
                                        }}
                                        className={`w-full text-left px-3 py-2 text-xs font-medium
                                                    hover:bg-primary/10 transition-colors duration-100
                                                    ${
                                                        groupBy === opt.value
                                                            ? 'text-primary bg-primary/5 font-semibold'
                                                            : 'text-text-muted'
                                                    }`}
                                    >
                                        {opt.label}
                                    </button>
                                ))}
                            </div>
                        </>
                    )}
                </div>
            </div>

            {/* ── Header row 2: date range pickers ───────────── */}
            <div className="flex items-center gap-2">
                <DatePicker
                    value={fromDate ?? null}
                    onChange={(v) => setFrom(v ?? undefined)}
                    placeholder="Từ ngày"
                    size="sm"
                    className="flex-1"
                />
                <span className="text-xs text-text-muted flex-shrink-0">—</span>
                <DatePicker
                    value={toDate ?? null}
                    onChange={(v) => setTo(v ?? undefined)}
                    placeholder="Đến ngày"
                    size="sm"
                    className="flex-1"
                />
            </div>

            {/* ── Chart.js Line chart ─────────────────────────── */}
            <div className="flex-1 min-h-0 relative" style={{ minHeight: 180 }}>
                {data.length === 0 ? (
                    <div className="flex items-center justify-center h-full">
                        <p className="text-xs text-text-muted">Không có dữ liệu.</p>
                    </div>
                ) : (
                    <Line data={chartData} options={options} />
                )}
            </div>

            {/* ── Custom Legend ───────────────────────────────── */}
            <div className="flex items-center gap-4 text-xs">
                <div className="flex items-center gap-1.5">
                    <span className="w-5 h-0.5 bg-primary inline-block rounded-full" />
                    <span className="text-text-muted font-medium">Cuộc hội thoại</span>
                </div>
                <div className="flex items-center gap-1.5">
                    <svg width="20" height="6">
                        <line
                            x1="0"
                            y1="3"
                            x2="20"
                            y2="3"
                            stroke="#06b6d4"
                            strokeWidth="1.5"
                            strokeDasharray="4,3"
                        />
                    </svg>
                    <span className="text-text-muted font-medium">Tin nhắn</span>
                </div>
            </div>

            {/* ── Footer KPIs ─────────────────────────────────── */}
            <div className="border-t border-border/50 pt-3 grid grid-cols-2 gap-4">
                <div>
                    <div className="text-xs font-semibold text-text-muted uppercase tracking-wider">
                        Tổng hội thoại
                    </div>
                    <div className="text-2xl font-bold text-text-primary mt-0.5">
                        {data
                            .reduce((s, d) => s + d.total_conversations, 0)
                            .toLocaleString()}
                    </div>
                </div>
                <div>
                    <div className="text-xs font-semibold text-text-muted uppercase tracking-wider">
                        Tổng tin nhắn
                    </div>
                    <div className="text-2xl font-bold text-primary mt-0.5">
                        {data
                            .reduce((s, d) => s + d.total_messages, 0)
                            .toLocaleString()}
                    </div>
                </div>
            </div>
        </div>
    )
}
