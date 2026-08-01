import { useState, useEffect } from 'react'
import {
    Users,
    Layers,
    Zap,
    HardDrive,
    Scroll,
    RefreshCw,
    AlertTriangle,
    ShieldCheck,
    Bell,
    Server,
    Cpu,
    CheckCircle2,
} from 'lucide-react'
import axiosClient from '../api/axios'
import { useAuthStore } from '../store/authStore'
import { usePageTitle } from '../hooks/usePageTitle'

// Interfaces for Types
interface DashboardStats {
    tenants_matrix: {
        total: number
        suspended: number
        active_this_month: number
    }
    total_active_users: { total: number; live_ccu: number }
    vector_chunks: { total: string; hnsw_cached_pct: number }
    avg_retrieval_latency: { avg_ms: number; status: string }
    total_storage: { used_tb: number; capacity_pct: number }
    docs_status: { done: string; failed: number; error_rate_pct: number }
    growth_velocity: Array<{
        month: string
        new_tenants: number
        new_users: number
    }>
    pipeline_error_distribution: Record<string, number>
    tenant_density: Array<{
        company_name: string
        storage_gb: number
        tokens_24h: number
        users_count: number
    }>
    ollama_allocation: Array<{
        node_name: string
        vram_allocated_pct: number
        system_ram_used_pct: number
    }>
}

interface RealtimeData {
    ccu: number
    active_sessions: number[]
    gateway_performance: { throughput_req_s: number; latency_ms: number }
    index_accuracy: number
    anomalies: Array<{
        node: string
        type: string
        timestamp: string
        message: string
        level: string
    }>
    stdout_stream: Array<{
        time: string
        module: string
        message: string
        color: string
    }>
    isolation_breach: {
        attempts: number
        status: string
        logs: Array<{ time: string; guard: string; status: string }>
    }
}

export default function GlobalAdminDashboard() {
    usePageTitle('Tổng quan hệ thống')
    const accessToken = useAuthStore((s) => s.accessToken)

    // Core states
    const [stats, setStats] = useState<DashboardStats | null>(null)
    const [realtime, setRealtime] = useState<RealtimeData | null>(null)
    const [isLoading, setIsLoading] = useState(true)
    const [isLive, setIsLive] = useState(false)
    const [error, setError] = useState<string | null>(null)

    // Running streams
    const [liveSessionsSeries, setLiveSessionsSeries] = useState<number[]>([
        1450, 1580, 1510, 1640, 1720, 1810,
    ])
    const [gatewayLatencySeries, setGatewayLatencySeries] = useState<number[]>([
        320, 360, 420, 390, 450, 340,
    ])
    const [gatewayThroughputSeries, setGatewayThroughputSeries] = useState<
        number[]
    >([5.2, 6.1, 4.8, 5.5, 6.8, 7.2])
    const [accuracySeries, setAccuracySeries] = useState<number[]>([
        98.2, 98.6, 98.4, 98.9, 99.1, 98.7,
    ])
    const [logLines, setLogLines] = useState<
        Array<{ time: string; module: string; message: string; color: string }>
    >([
        {
            time: '22:30:15',
            module: 'Security Master',
            message:
                'Hệ thống tường lửa đa tầng kiểm tra tính cách ly tệp tin an toàn.',
            color: 'green',
        },
        {
            time: '22:35:40',
            module: 'Ollama Client',
            message:
                'Kết nối thử nghiệm bộ mã hóa cục bộ bge-m3 hoạt động ổn định.',
            color: 'blue',
        },
    ])

    // Load static data
    const fetchStats = async () => {
        try {
            const res = await axiosClient.get('/global-admin/dashboard/stats')
            setStats(res.data)
            setError(null)
        } catch (err: any) {
            console.error('Failed to fetch dashboard stats:', err)
            setError(
                'Không thể kết nối đến máy chủ backend để tải số liệu dashboard.'
            )
        } finally {
            setIsLoading(false)
        }
    }

    useEffect(() => {
        fetchStats()
    }, [])

    // SSE connection
    useEffect(() => {
        if (!accessToken) return

        let eventSource: EventSource | null = null

        const connectSSE = () => {
            // Encode token to query parameter for EventSource authorization compatibility
            const sseUrl = `http://localhost:8000/api/v1/global-admin/dashboard/realtime?token=${accessToken}`
            eventSource = new EventSource(sseUrl)

            eventSource.onopen = () => {
                setIsLive(true)
            }

            eventSource.onmessage = (event) => {
                try {
                    const data: RealtimeData = JSON.parse(event.data)
                    setRealtime(data)

                    // Update rolling series arrays
                    setLiveSessionsSeries((prev) => {
                        const next = [...prev.slice(1), data.ccu]
                        return next
                    })
                    setGatewayLatencySeries((prev) => {
                        const next = [
                            ...prev.slice(1),
                            data.gateway_performance.latency_ms,
                        ]
                        return next
                    })
                    setGatewayThroughputSeries((prev) => {
                        const next = [
                            ...prev.slice(1),
                            data.gateway_performance.throughput_req_s,
                        ]
                        return next
                    })
                    setAccuracySeries((prev) => {
                        const next = [...prev.slice(1), data.index_accuracy]
                        return next
                    })

                    // Append logs to stream (prevent growing indefinitely)
                    setLogLines((prev) => {
                        const newLogs = [...data.stdout_stream, ...prev]
                        return newLogs.slice(0, 30) // keep last 30 logs
                    })
                } catch (e) {
                    console.error('Failed to parse SSE JSON:', e)
                }
            }

            eventSource.onerror = (err) => {
                console.error(
                    'SSE connection error. Retrying in 5 seconds...',
                    err
                )
                setIsLive(false)
                if (eventSource) {
                    eventSource.close()
                }
                setTimeout(connectSSE, 5000)
            }
        }

        connectSSE()

        return () => {
            if (eventSource) {
                eventSource.close()
            }
        }
    }, [accessToken])

    if (isLoading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[70vh]">
                <RefreshCw className="w-10 h-10 text-primary animate-spin mb-4" />
                <p className="text-text-secondary font-medium">
                    Đang tải số liệu giám sát toàn cục...
                </p>
            </div>
        )
    }

    if (error) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[70vh] text-center px-4">
                <AlertTriangle className="w-12 h-12 text-error mb-4" />
                <h2 className="text-xl font-bold text-text-primary mb-2">
                    Đã xảy ra lỗi
                </h2>
                <p className="text-text-secondary max-w-md mb-6">{error}</p>
                <button
                    onClick={() => {
                        setIsLoading(true)
                        fetchStats()
                    }}
                    className="px-4 py-2 bg-primary text-surface rounded-xl hover:bg-primary-hover transition-colors font-medium flex items-center gap-2"
                >
                    <RefreshCw className="w-4 h-4" /> Thử lại
                </button>
            </div>
        )
    }

    // Default fallbacks if backend returns empty or is offline
    const dataStats = stats || {
        tenants_matrix: { total: 142, suspended: 3, active_this_month: 112 },
        total_active_users: { total: 28491, live_ccu: 1840 },
        vector_chunks: { total: '42.8M', hnsw_cached_pct: 100 },
        avg_retrieval_latency: {
            avg_ms: 324,
            status: 'Healthy (<500ms Target)',
        },
        total_storage: { used_tb: 1.42, capacity_pct: 35.5 },
        docs_status: { done: '98.2K', failed: 142, error_rate_pct: 0.14 },
        growth_velocity: [
            { month: 'Tháng 1', new_tenants: 12, new_users: 8 },
            { month: 'Tháng 2', new_tenants: 18, new_users: 11 },
            { month: 'Tháng 3', new_tenants: 15, new_users: 10 },
            { month: 'Tháng 4', new_tenants: 25, new_users: 18 },
            { month: 'Tháng 5', new_tenants: 20, new_users: 15 },
            { month: 'Tháng 6', new_tenants: 30, new_users: 25 },
        ],
        pipeline_error_distribution: {
            Chunking: 12,
            Embedding: 78,
            Parsing: 10,
        },
        tenant_density: [
            {
                company_name: 'FPT Software',
                storage_gb: 820.0,
                tokens_24h: 42000000,
                users_count: 8500,
            },
            {
                company_name: 'Viettel Telecom',
                storage_gb: 450.0,
                tokens_24h: 18000000,
                users_count: 3200,
            },
            {
                company_name: 'Vingroup JSC',
                storage_gb: 380.0,
                tokens_24h: 15000000,
                users_count: 4100,
            },
            {
                company_name: 'Techcombank',
                storage_gb: 410.0,
                tokens_24h: 12000000,
                users_count: 2900,
            },
        ],
        ollama_allocation: [
            {
                node_name: 'Node 01',
                vram_allocated_pct: 63,
                system_ram_used_pct: 82,
            },
            {
                node_name: 'Node 02',
                vram_allocated_pct: 85,
                system_ram_used_pct: 90,
            },
            {
                node_name: 'Node 03',
                vram_allocated_pct: 92,
                system_ram_used_pct: 88,
            },
            {
                node_name: 'Node 04',
                vram_allocated_pct: 45,
                system_ram_used_pct: 75,
            },
        ],
    }

    const currentCCU = realtime
        ? realtime.ccu
        : dataStats.total_active_users.live_ccu
    const latestAnomalies = realtime
        ? realtime.anomalies
        : [
              {
                  node: 'HW-NODE-03',
                  type: 'INFERENCE SPIKE',
                  timestamp: '22:45:10',
                  message:
                      'Node-03 VRAM sử dụng đột ngột tăng vượt ngưỡng 92% khi xử lý mô hình tri thức lớn.',
                  level: 'WARNING',
              },
              {
                  node: 'LLM-GATEWAY',
                  type: 'TIMEOUT ALARM',
                  timestamp: '22:12:04',
                  message:
                      'Phát hiện 3 cuộc gọi hoàn tác sinh tử (inference call) bị quá hạn phản hồi qua test API từ Ollama cluster.',
                  level: 'CRITICAL',
              },
          ]

    const isolationBreach = realtime
        ? realtime.isolation_breach
        : {
              attempts: 0,
              status: 'Zero Cross-Tenant Leakage Active',
              logs: [
                  {
                      time: '22:54:02',
                      guard: 'API Gateway Check',
                      status: 'Isolator Passed',
                  },
                  {
                      time: '22:51:14',
                      guard: 'Tenant Router Guard',
                      status: 'Isolator Passed',
                  },
              ],
          }

    return (
        <div className="space-y-6 max-w-[1600px] mx-auto pb-12">
            {/* ── HEADER SECTION ────────────────────────────────────────── */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-surface p-6 rounded-2xl border border-border/50 shadow-sm">
                <div>
                    <div className="text-xs text-text-muted font-medium uppercase tracking-widest flex items-center gap-1.5 mb-1">
                        <span>Platform Admin</span>
                        <span>/</span>
                        <span className="text-primary">Dashboard Overview</span>
                    </div>
                    <h1 className="text-2xl font-bold text-text-primary tracking-tight">
                        Platform Operations Command
                    </h1>
                </div>
                <div className="flex items-center gap-3">
                    {/* Live indicator badge */}
                    <div
                        className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs font-semibold shadow-sm transition-all duration-300 ${
                            isLive
                                ? 'bg-success/10 border-success/30 text-success'
                                : 'bg-warning/10 border-warning/30 text-warning'
                        }`}
                    >
                        <span
                            className={`w-2.5 h-2.5 rounded-full ${isLive ? 'bg-success animate-pulse' : 'bg-warning'}`}
                        ></span>
                        {isLive
                            ? 'Real-time Streaming Live'
                            : 'Polling Backend Updates'}
                    </div>

                    <div className="flex items-center gap-2 bg-success/10 border border-success/30 text-success text-xs font-semibold px-3 py-1.5 rounded-xl shadow-sm">
                        <CheckCircle2 className="w-4 h-4" />
                        All Clusters Online
                    </div>

                    <button className="relative p-2 rounded-xl bg-surface border border-border hover:bg-surface-raised transition-colors">
                        <Bell className="w-5 h-5 text-text-secondary" />
                        <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-error border border-surface"></span>
                    </button>
                </div>
            </div>

            {/* ── TOP STAT CARDS (6) ────────────────────────────────────── */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
                {/* 1. Tenants Matrix */}
                <div className="bg-surface p-5 rounded-2xl border border-border/50 shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow">
                    <div className="flex items-center justify-between mb-3">
                        <span className="text-xs font-semibold text-text-muted uppercase tracking-wider">
                            Tenants Matrix
                        </span>
                        <div className="p-2 bg-blue-50 text-blue-600 rounded-xl">
                            <Server className="w-5 h-5" />
                        </div>
                    </div>
                    <div>
                        <div className="flex items-baseline gap-2">
                            <span className="text-2xl font-bold text-text-primary">
                                {dataStats.tenants_matrix.total}
                            </span>
                            <span className="text-sm font-semibold text-text-secondary">
                                / {dataStats.tenants_matrix.suspended} Susp
                            </span>
                        </div>
                        <div className="mt-2 text-xs font-medium text-success flex items-center gap-1">
                            <span className="font-bold">↑</span>
                            <span>
                                {dataStats.tenants_matrix.active_this_month}{' '}
                                active this month
                            </span>
                        </div>
                    </div>
                </div>

                {/* 2. Total Active Users */}
                <div className="bg-surface p-5 rounded-2xl border border-border/50 shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow">
                    <div className="flex items-center justify-between mb-3">
                        <span className="text-xs font-semibold text-text-muted uppercase tracking-wider">
                            Total Active Users
                        </span>
                        <div className="p-2 bg-purple-50 text-purple-600 rounded-xl">
                            <Users className="w-5 h-5" />
                        </div>
                    </div>
                    <div>
                        <div className="text-2xl font-bold text-text-primary">
                            {dataStats.total_active_users.total.toLocaleString()}
                        </div>
                        <div className="mt-2 text-xs font-semibold text-primary flex items-center gap-1.5">
                            <span className="relative flex h-2 w-2">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
                            </span>
                            <span>Live CCU: {currentCCU} sessions</span>
                        </div>
                    </div>
                </div>

                {/* 3. Vector Chunks */}
                <div className="bg-surface p-5 rounded-2xl border border-border/50 shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow">
                    <div className="flex items-center justify-between mb-3">
                        <span className="text-xs font-semibold text-text-muted uppercase tracking-wider">
                            Vector Chunks
                        </span>
                        <div className="p-2 bg-emerald-50 text-emerald-600 rounded-xl">
                            <Layers className="w-5 h-5" />
                        </div>
                    </div>
                    <div>
                        <div className="text-2xl font-bold text-text-primary">
                            {dataStats.vector_chunks.total}
                        </div>
                        <div className="mt-2 text-xs font-medium text-success flex items-center gap-1">
                            <span>
                                ✓ HNSW index cached{' '}
                                {dataStats.vector_chunks.hnsw_cached_pct}%
                            </span>
                        </div>
                    </div>
                </div>

                {/* 4. Avg Retrieval Latency */}
                <div className="bg-surface p-5 rounded-2xl border border-border/50 shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow">
                    <div className="flex items-center justify-between mb-3">
                        <span className="text-xs font-semibold text-text-muted uppercase tracking-wider">
                            Avg Latency
                        </span>
                        <div className="p-2 bg-amber-50 text-amber-600 rounded-xl">
                            <Zap className="w-5 h-5" />
                        </div>
                    </div>
                    <div>
                        <div className="text-2xl font-bold text-text-primary">
                            {dataStats.avg_retrieval_latency.avg_ms} ms
                        </div>
                        <div className="mt-2 text-xs font-medium text-success">
                            {dataStats.avg_retrieval_latency.status}
                        </div>
                    </div>
                </div>

                {/* 5. Total Storage Used */}
                <div className="bg-surface p-5 rounded-2xl border border-border/50 shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow">
                    <div className="flex items-center justify-between mb-3">
                        <span className="text-xs font-semibold text-text-muted uppercase tracking-wider">
                            Total Storage
                        </span>
                        <div className="p-2 bg-cyan-50 text-cyan-600 rounded-xl">
                            <HardDrive className="w-5 h-5" />
                        </div>
                    </div>
                    <div>
                        <div className="text-2xl font-bold text-text-primary">
                            {dataStats.total_storage.used_tb} TB
                        </div>
                        <div className="mt-2 text-xs font-medium text-text-secondary flex items-center gap-2">
                            <div className="flex-1 bg-border rounded-full h-1.5 overflow-hidden">
                                <div
                                    className="bg-cyan-600 h-full rounded-full"
                                    style={{
                                        width: `${dataStats.total_storage.capacity_pct}%`,
                                    }}
                                ></div>
                            </div>
                            <span>{dataStats.total_storage.capacity_pct}%</span>
                        </div>
                    </div>
                </div>

                {/* 6. Docs OK vs Failed */}
                <div className="bg-surface p-5 rounded-2xl border border-border/50 shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow">
                    <div className="flex items-center justify-between mb-3">
                        <span className="text-xs font-semibold text-text-muted uppercase tracking-wider">
                            Docs OK vs Failed
                        </span>
                        <div className="p-2 bg-rose-50 text-rose-600 rounded-xl">
                            <Scroll className="w-5 h-5" />
                        </div>
                    </div>
                    <div>
                        <div className="flex items-baseline gap-2">
                            <span className="text-2xl font-bold text-text-primary">
                                {dataStats.docs_status.done}
                            </span>
                            <span className="text-sm font-semibold text-error">
                                / {dataStats.docs_status.failed} F
                            </span>
                        </div>
                        <div className="mt-2 text-xs font-medium text-error">
                            Tỷ lệ lỗi xử lý file:{' '}
                            {dataStats.docs_status.error_rate_pct}%
                        </div>
                    </div>
                </div>
            </div>

            {/* ── MIDDLE ROW CHARTS (3) ─────────────────────────────────── */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* 1. Growth Velocity Tracking */}
                <div className="bg-surface p-6 rounded-2xl border border-border/50 shadow-sm flex flex-col justify-between">
                    <div className="mb-4">
                        <h3 className="text-sm font-bold text-text-primary">
                            Growth Velocity Tracking
                        </h3>
                        <p className="text-xs text-text-secondary">
                            Tenants Mới vs Users Mới (x100) per month
                        </p>
                    </div>
                    <div className="h-64 flex items-end justify-between relative mt-4 px-2">
                        {/* Grid lines */}
                        <div className="absolute inset-x-0 top-0 border-b border-border/30 h-0 w-full"></div>
                        <div className="absolute inset-x-0 top-1/4 border-b border-border/30 h-0 w-full"></div>
                        <div className="absolute inset-x-0 top-2/4 border-b border-border/30 h-0 w-full"></div>
                        <div className="absolute inset-x-0 top-3/4 border-b border-border/30 h-0 w-full"></div>

                        {dataStats.growth_velocity.map((item, index) => {
                            // Max user scale is 30. Max tenant scale is 30.
                            const tenantHeight = (item.new_tenants / 35) * 100
                            const userHeight = (item.new_users / 35) * 100
                            return (
                                <div
                                    key={index}
                                    className="flex flex-col items-center flex-1 gap-2 z-10"
                                >
                                    <div className="flex items-end gap-1.5 h-44 w-full justify-center">
                                        {/* Tenant Bar */}
                                        <div
                                            className="w-4 bg-primary rounded-t-sm hover:opacity-80 transition-opacity relative group"
                                            style={{
                                                height: `${tenantHeight}%`,
                                            }}
                                        >
                                            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 hidden group-hover:block bg-text-primary text-surface text-[10px] px-1.5 py-0.5 rounded shadow-lg whitespace-nowrap z-50">
                                                {item.new_tenants} Tenants
                                            </div>
                                        </div>
                                        {/* User Bar */}
                                        <div
                                            className="w-4 bg-amber-500 rounded-t-sm hover:opacity-80 transition-opacity relative group"
                                            style={{ height: `${userHeight}%` }}
                                        >
                                            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 hidden group-hover:block bg-text-primary text-surface text-[10px] px-1.5 py-0.5 rounded shadow-lg whitespace-nowrap z-50">
                                                {item.new_users * 100} Users
                                            </div>
                                        </div>
                                    </div>
                                    <span className="text-[10px] text-text-muted mt-1 font-semibold">
                                        {item.month}
                                    </span>
                                </div>
                            )
                        })}
                    </div>
                    {/* Legend */}
                    <div className="flex items-center gap-4 mt-4 justify-center text-xs">
                        <div className="flex items-center gap-1.5">
                            <span className="w-3 h-3 bg-primary rounded-sm"></span>
                            <span className="text-text-secondary font-medium">
                                Tenants Mới
                            </span>
                        </div>
                        <div className="flex items-center gap-1.5">
                            <span className="w-3 h-3 bg-amber-500 rounded-sm"></span>
                            <span className="text-text-secondary font-medium">
                                Users Mới (x100)
                            </span>
                        </div>
                    </div>
                </div>

                {/* 2. Real-time Index Accuracy */}
                <div className="bg-surface p-6 rounded-2xl border border-border/50 shadow-sm flex flex-col justify-between">
                    <div className="mb-4 flex justify-between items-center">
                        <div>
                            <h3 className="text-sm font-bold text-text-primary">
                                Real-time Index Accuracy
                            </h3>
                            <p className="text-xs text-text-secondary">
                                Index Precision (%) over time
                            </p>
                        </div>
                        <span className="text-xs font-bold text-success bg-success/15 px-2 py-0.5 rounded-full">
                            {accuracySeries[accuracySeries.length - 1]}%
                        </span>
                    </div>
                    <div className="h-64 relative mt-4">
                        <svg
                            className="w-full h-full"
                            viewBox="0 0 300 200"
                            preserveAspectRatio="none"
                        >
                            <defs>
                                <linearGradient
                                    id="accuracy-gradient"
                                    x1="0"
                                    y1="0"
                                    x2="0"
                                    y2="1"
                                >
                                    <stop
                                        offset="0%"
                                        stopColor="#10b981"
                                        stopOpacity="0.25"
                                    />
                                    <stop
                                        offset="100%"
                                        stopColor="#10b981"
                                        stopOpacity="0.0"
                                    />
                                </linearGradient>
                            </defs>
                            {/* Gridlines */}
                            <line
                                x1="0"
                                y1="50"
                                x2="300"
                                y2="50"
                                stroke="var(--color-border)"
                                strokeWidth="0.5"
                                strokeDasharray="3,3"
                                opacity="0.4"
                            />
                            <line
                                x1="0"
                                y1="100"
                                x2="300"
                                y2="100"
                                stroke="var(--color-border)"
                                strokeWidth="0.5"
                                strokeDasharray="3,3"
                                opacity="0.4"
                            />
                            <line
                                x1="0"
                                y1="150"
                                x2="300"
                                y2="150"
                                stroke="var(--color-border)"
                                strokeWidth="0.5"
                                strokeDasharray="3,3"
                                opacity="0.4"
                            />

                            {/* Gradient Area under curve */}
                            <path
                                d={`M 0 200 
                                    L 0 ${200 - (accuracySeries[0] - 97.5) * 70} 
                                    C 60 ${200 - (accuracySeries[1] - 97.5) * 70}, 100 ${200 - (accuracySeries[2] - 97.5) * 70}, 150 ${200 - (accuracySeries[3] - 97.5) * 70} 
                                    C 200 ${200 - (accuracySeries[4] - 97.5) * 70}, 240 ${200 - (accuracySeries[5] - 97.5) * 70}, 300 ${200 - (accuracySeries[accuracySeries.length - 1] - 97.5) * 70} 
                                    L 300 200 Z`}
                                fill="url(#accuracy-gradient)"
                            />

                            {/* Wavy line path */}
                            <path
                                d={`M 0 ${200 - (accuracySeries[0] - 97.5) * 70} 
                                    C 60 ${200 - (accuracySeries[1] - 97.5) * 70}, 100 ${200 - (accuracySeries[2] - 97.5) * 70}, 150 ${200 - (accuracySeries[3] - 97.5) * 70} 
                                    C 200 ${200 - (accuracySeries[4] - 97.5) * 70}, 240 ${200 - (accuracySeries[5] - 97.5) * 70}, 300 ${200 - (accuracySeries[accuracySeries.length - 1] - 97.5) * 70}`}
                                fill="none"
                                stroke="#10b981"
                                strokeWidth="3"
                                strokeLinecap="round"
                            />

                            {/* Data points */}
                            {accuracySeries.map((val, i) => {
                                const cx = (i / 5) * 300
                                const cy = 200 - (val - 97.5) * 70
                                return (
                                    <circle
                                        key={i}
                                        cx={cx}
                                        cy={cy}
                                        r="4"
                                        fill="#ffffff"
                                        stroke="#10b981"
                                        strokeWidth="2"
                                    />
                                )
                            })}
                        </svg>
                        <div className="flex justify-between text-[10px] text-text-muted mt-2 font-semibold px-1">
                            <span>10h trước</span>
                            <span>6h trước</span>
                            <span>Bây giờ</span>
                        </div>
                    </div>
                </div>

                {/* 3. Pipeline Error Distribution */}
                <div className="bg-surface p-6 rounded-2xl border border-border/50 shadow-sm flex flex-col justify-between">
                    <div className="mb-4">
                        <h3 className="text-sm font-bold text-text-primary">
                            Pipeline Error Distribution
                        </h3>
                        <p className="text-xs text-text-secondary">
                            Chunking, Embedding, Parsing percentages
                        </p>
                    </div>

                    <div className="h-56 flex items-center justify-center relative mt-4">
                        {/* Custom SVG Donut */}
                        <svg className="w-44 h-44" viewBox="0 0 36 36">
                            {/* Track circle */}
                            <circle
                                cx="18"
                                cy="18"
                                r="15.915"
                                fill="none"
                                stroke="var(--color-border)"
                                strokeWidth="3"
                                opacity="0.3"
                            />

                            {/* Embedding: 78% (green) */}
                            <circle
                                cx="18"
                                cy="18"
                                r="15.915"
                                fill="none"
                                stroke="var(--color-primary)"
                                strokeWidth="3.2"
                                strokeDasharray="78 22"
                                strokeDashoffset="25"
                            />

                            {/* Chunking: 12% (amber) */}
                            <circle
                                cx="18"
                                cy="18"
                                r="15.915"
                                fill="none"
                                stroke="#f59e0b"
                                strokeWidth="3.2"
                                strokeDasharray="12 88"
                                strokeDashoffset="-53"
                            />

                            {/* Parsing: 10% (rose) */}
                            <circle
                                cx="18"
                                cy="18"
                                r="15.915"
                                fill="none"
                                stroke="#f43f5e"
                                strokeWidth="3.2"
                                strokeDasharray="10 90"
                                strokeDashoffset="-65"
                            />

                            {/* Text inside */}
                            <g className="text-[6px] font-bold fill-current text-text-primary">
                                <text
                                    x="50%"
                                    y="46%"
                                    textAnchor="middle"
                                    alignmentBaseline="middle"
                                >
                                    Error
                                </text>
                                <text
                                    x="50%"
                                    y="62%"
                                    textAnchor="middle"
                                    alignmentBaseline="middle"
                                    className="text-[7px]"
                                >
                                    Log Rate
                                </text>
                            </g>
                        </svg>
                    </div>

                    {/* Legend */}
                    <div className="grid grid-cols-3 gap-2 text-center text-xs mt-2 border-t border-border/40 pt-4">
                        <div>
                            <span className="text-amber-500 font-bold block text-sm">
                                12%
                            </span>
                            <span className="text-text-muted text-[10px]">
                                Chunking
                            </span>
                        </div>
                        <div className="border-x border-border/40">
                            <span className="text-primary font-bold block text-sm">
                                78%
                            </span>
                            <span className="text-text-muted text-[10px]">
                                Embedding
                            </span>
                        </div>
                        <div>
                            <span className="text-rose-500 font-bold block text-sm">
                                10%
                            </span>
                            <span className="text-text-muted text-[10px]">
                                Parsing
                            </span>
                        </div>
                    </div>
                </div>
            </div>

            {/* ── WIDE CHARTS (2) ───────────────────────────────────────── */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* 1. Gateway Performance & Latency Metrics */}
                <div className="bg-surface p-6 rounded-2xl border border-border/50 shadow-sm flex flex-col justify-between">
                    <div className="mb-4">
                        <h3 className="text-sm font-bold text-text-primary">
                            Gateway Performance & Latency Metrics
                        </h3>
                        <p className="text-xs text-text-secondary">
                            Latency (ms) and Throughput (req/s) over time
                        </p>
                    </div>
                    <div className="h-64 relative mt-6">
                        <svg
                            className="w-full h-full"
                            viewBox="0 0 500 200"
                            preserveAspectRatio="none"
                        >
                            <defs>
                                <linearGradient
                                    id="latency-grad"
                                    x1="0"
                                    y1="0"
                                    x2="0"
                                    y2="1"
                                >
                                    <stop
                                        offset="0%"
                                        stopColor="#3b82f6"
                                        stopOpacity="0.2"
                                    />
                                    <stop
                                        offset="100%"
                                        stopColor="#3b82f6"
                                        stopOpacity="0"
                                    />
                                </linearGradient>
                                <linearGradient
                                    id="throughput-grad"
                                    x1="0"
                                    y1="0"
                                    x2="0"
                                    y2="1"
                                >
                                    <stop
                                        offset="0%"
                                        stopColor="#a855f7"
                                        stopOpacity="0.2"
                                    />
                                    <stop
                                        offset="100%"
                                        stopColor="#a855f7"
                                        stopOpacity="0"
                                    />
                                </linearGradient>
                            </defs>
                            {/* Gridlines */}
                            <line
                                x1="0"
                                y1="50"
                                x2="500"
                                y2="50"
                                stroke="var(--color-border)"
                                strokeWidth="0.5"
                                opacity="0.4"
                            />
                            <line
                                x1="0"
                                y1="100"
                                x2="500"
                                y2="100"
                                stroke="var(--color-border)"
                                strokeWidth="0.5"
                                opacity="0.4"
                            />
                            <line
                                x1="0"
                                y1="150"
                                x2="500"
                                y2="150"
                                stroke="var(--color-border)"
                                strokeWidth="0.5"
                                opacity="0.4"
                            />

                            {/* Latency line (blue) */}
                            <path
                                d={`M 0 ${200 - (gatewayLatencySeries[0] / 500) * 150} 
                                    L 100 ${200 - (gatewayLatencySeries[1] / 500) * 150} 
                                    L 200 ${200 - (gatewayLatencySeries[2] / 500) * 150} 
                                    L 300 ${200 - (gatewayLatencySeries[3] / 500) * 150} 
                                    L 400 ${200 - (gatewayLatencySeries[4] / 500) * 150} 
                                    L 500 ${200 - (gatewayLatencySeries[5] / 500) * 150}`}
                                fill="none"
                                stroke="#3b82f6"
                                strokeWidth="2.5"
                            />
                            {/* Throughput line (purple) */}
                            <path
                                d={`M 0 ${200 - (gatewayThroughputSeries[0] / 10) * 150} 
                                    L 100 ${200 - (gatewayThroughputSeries[1] / 10) * 150} 
                                    L 200 ${200 - (gatewayThroughputSeries[2] / 10) * 150} 
                                    L 300 ${200 - (gatewayThroughputSeries[3] / 10) * 150} 
                                    L 400 ${200 - (gatewayThroughputSeries[4] / 10) * 150} 
                                    L 500 ${200 - (gatewayThroughputSeries[5] / 10) * 150}`}
                                fill="none"
                                stroke="#a855f7"
                                strokeWidth="2.5"
                                strokeDasharray="4,2"
                            />
                        </svg>
                        <div className="flex justify-between text-[10px] text-text-muted mt-2 font-semibold">
                            <span>16:00</span>
                            <span>18:00</span>
                            <span>20:00</span>
                            <span>22:00</span>
                        </div>
                    </div>
                    {/* Legend */}
                    <div className="flex items-center gap-6 mt-4 justify-center text-xs">
                        <div className="flex items-center gap-1.5">
                            <span className="w-3 h-0.5 bg-[#3b82f6] inline-block border-t-2 border-[#3b82f6]"></span>
                            <span className="text-text-secondary font-medium">
                                Latency (ms) - Left Scale
                            </span>
                        </div>
                        <div className="flex items-center gap-1.5">
                            <span className="w-3 h-0.5 bg-[#a855f7] inline-block border-t-2 border-dashed border-[#a855f7]"></span>
                            <span className="text-text-secondary font-medium">
                                Throughput (req/s) - Right Scale
                            </span>
                        </div>
                    </div>
                </div>

                {/* 2. Ollama Cluster Hardware Allocation */}
                <div className="bg-surface p-6 rounded-2xl border border-border/50 shadow-sm flex flex-col justify-between">
                    <div className="mb-4">
                        <h3 className="text-sm font-bold text-text-primary">
                            Ollama Cluster Hardware Allocation
                        </h3>
                        <p className="text-xs text-text-secondary">
                            VRAM AI Allocated (%) vs System RAM Used (%) for
                            Nodes 1-4
                        </p>
                    </div>

                    <div className="space-y-4 py-2 mt-4">
                        {dataStats.ollama_allocation.map((node, i) => (
                            <div key={i} className="space-y-1.5">
                                <div className="flex justify-between text-xs font-bold text-text-primary">
                                    <span className="flex items-center gap-1">
                                        <Cpu className="w-4 h-4 text-text-secondary" />{' '}
                                        {node.node_name}
                                    </span>
                                    <span className="text-text-muted text-[10px]">
                                        VRAM: {node.vram_allocated_pct}% | RAM:{' '}
                                        {node.system_ram_used_pct}%
                                    </span>
                                </div>
                                <div className="space-y-1">
                                    {/* VRAM bar */}
                                    <div className="h-2 bg-border/40 rounded-full overflow-hidden flex">
                                        <div
                                            className={`h-full rounded-full transition-all duration-500 ${
                                                node.vram_allocated_pct > 90
                                                    ? 'bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.4)]'
                                                    : 'bg-amber-500'
                                            }`}
                                            style={{
                                                width: `${node.vram_allocated_pct}%`,
                                            }}
                                        ></div>
                                    </div>
                                    {/* RAM bar */}
                                    <div className="h-1 bg-border/20 rounded-full overflow-hidden flex">
                                        <div
                                            className="h-full bg-cyan-600 rounded-full"
                                            style={{
                                                width: `${node.system_ram_used_pct}%`,
                                            }}
                                        ></div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* ── FOURTH ROW CHARTS (2) ─────────────────────────────────── */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* 1. Tenant Density Matrix (Top 10 Clients) */}
                <div className="bg-surface p-6 rounded-2xl border border-border/50 shadow-sm flex flex-col justify-between">
                    <div className="mb-4">
                        <h3 className="text-sm font-bold text-text-primary">
                            Tenant Density Matrix (Top 10 Clients)
                        </h3>
                        <p className="text-xs text-text-secondary">
                            Bubble position represents Storage (GB) on X,
                            Tokens/24h on Y, and Circle Size represents Users
                            count.
                        </p>
                    </div>

                    <div className="h-64 relative border border-border/40 bg-slate-50/50 rounded-xl overflow-hidden mt-4">
                        {/* Bubble grid axes */}
                        <div className="absolute left-6 inset-y-0 border-r border-border/30"></div>
                        <div className="absolute bottom-6 inset-x-0 border-t border-border/30"></div>

                        {dataStats.tenant_density.map((client, index) => {
                            // Map storage_gb (0 - 1000) to left% (15% - 85%)
                            const left = 15 + (client.storage_gb / 1000) * 70
                            // Map tokens_24h (0 - 50M) to bottom% (15% - 85%)
                            const tokensM = client.tokens_24h / 1000000
                            const bottom = 15 + (tokensM / 50) * 70
                            // Map users_count (0 - 10000) to size (16px - 44px)
                            const size = 16 + (client.users_count / 10000) * 28

                            // Distinct bubble colors
                            const bubbleColors = [
                                'bg-primary/20 border-primary text-primary',
                                'bg-amber-500/20 border-amber-500 text-amber-700',
                                'bg-rose-500/20 border-rose-500 text-rose-700',
                                'bg-cyan-600/20 border-cyan-600 text-cyan-700',
                                'bg-emerald-500/20 border-emerald-500 text-emerald-700',
                            ]
                            const colorClass =
                                bubbleColors[index % bubbleColors.length]

                            return (
                                <div
                                    key={index}
                                    className={`absolute rounded-full border flex items-center justify-center font-bold text-[9px] text-center hover:scale-110 transition-transform cursor-pointer group shadow-sm ${colorClass}`}
                                    style={{
                                        left: `${left}%`,
                                        bottom: `${bottom}%`,
                                        width: `${size}px`,
                                        height: `${size}px`,
                                        marginLeft: `-${size / 2}px`,
                                        marginBottom: `-${size / 2}px`,
                                    }}
                                >
                                    <span>
                                        {client.company_name.split(' ')[0]}
                                    </span>
                                    {/* Tooltip */}
                                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block bg-text-primary text-surface text-[10px] p-2 rounded-lg shadow-xl whitespace-nowrap z-50 pointer-events-none">
                                        <div className="font-bold border-b border-surface/20 pb-0.5 mb-1">
                                            {client.company_name}
                                        </div>
                                        <div>
                                            Storage: {client.storage_gb} GB
                                        </div>
                                        <div>
                                            Users:{' '}
                                            {client.users_count.toLocaleString()}
                                        </div>
                                        <div>
                                            Tokens/24h: {tokensM.toFixed(1)}M
                                        </div>
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                </div>

                {/* 2. Real-time Active Conversational Sessions */}
                <div className="bg-surface p-6 rounded-2xl border border-border/50 shadow-sm flex flex-col justify-between">
                    <div className="mb-4">
                        <h3 className="text-sm font-bold text-text-primary">
                            Real-time Active Conversational Sessions
                        </h3>
                        <p className="text-xs text-text-secondary">
                            Total active agent sessions (10m ago to Now)
                        </p>
                    </div>

                    <div className="h-64 relative mt-4">
                        <svg
                            className="w-full h-full"
                            viewBox="0 0 400 200"
                            preserveAspectRatio="none"
                        >
                            <defs>
                                <linearGradient
                                    id="live-sessions-grad"
                                    x1="0"
                                    y1="0"
                                    x2="0"
                                    y2="1"
                                >
                                    <stop
                                        offset="0%"
                                        stopColor="var(--color-primary)"
                                        stopOpacity="0.2"
                                    />
                                    <stop
                                        offset="100%"
                                        stopColor="var(--color-primary)"
                                        stopOpacity="0"
                                    />
                                </linearGradient>
                            </defs>
                            <line
                                x1="0"
                                y1="50"
                                x2="400"
                                y2="50"
                                stroke="var(--color-border)"
                                strokeWidth="0.5"
                                opacity="0.4"
                            />
                            <line
                                x1="0"
                                y1="100"
                                x2="400"
                                y2="100"
                                stroke="var(--color-border)"
                                strokeWidth="0.5"
                                opacity="0.4"
                            />
                            <line
                                x1="0"
                                y1="150"
                                x2="400"
                                y2="150"
                                stroke="var(--color-border)"
                                strokeWidth="0.5"
                                opacity="0.4"
                            />

                            <path
                                d={`M 0 200 
                                    L 0 ${200 - ((liveSessionsSeries[0] - 1300) / 600) * 150} 
                                    L 80 ${200 - ((liveSessionsSeries[1] - 1300) / 600) * 150} 
                                    L 160 ${200 - ((liveSessionsSeries[2] - 1300) / 600) * 150} 
                                    L 240 ${200 - ((liveSessionsSeries[3] - 1300) / 600) * 150} 
                                    L 320 ${200 - ((liveSessionsSeries[4] - 1300) / 600) * 150} 
                                    L 400 ${200 - ((liveSessionsSeries[5] - 1300) / 600) * 150} 
                                    L 400 200 Z`}
                                fill="url(#live-sessions-grad)"
                            />

                            <path
                                d={`M 0 ${200 - ((liveSessionsSeries[0] - 1300) / 600) * 150} 
                                    L 80 ${200 - ((liveSessionsSeries[1] - 1300) / 600) * 150} 
                                    L 160 ${200 - ((liveSessionsSeries[2] - 1300) / 600) * 150} 
                                    L 240 ${200 - ((liveSessionsSeries[3] - 1300) / 600) * 150} 
                                    L 320 ${200 - ((liveSessionsSeries[4] - 1300) / 600) * 150} 
                                    L 400 ${200 - ((liveSessionsSeries[5] - 1300) / 600) * 150}`}
                                fill="none"
                                stroke="var(--color-primary)"
                                strokeWidth="3"
                                strokeLinecap="round"
                            />

                            <circle
                                cx="400"
                                cy={
                                    200 -
                                    ((liveSessionsSeries[5] - 1300) / 600) * 150
                                }
                                r="6"
                                fill="var(--color-primary)"
                                className="animate-ping"
                            />
                            <circle
                                cx="400"
                                cy={
                                    200 -
                                    ((liveSessionsSeries[5] - 1300) / 600) * 150
                                }
                                r="4"
                                fill="var(--color-primary)"
                                stroke="#ffffff"
                                strokeWidth="2"
                            />
                        </svg>
                        <div className="flex justify-between text-[10px] text-text-muted mt-2 font-semibold">
                            <span>10 phút trước</span>
                            <span>5 phút trước</span>
                            <span>
                                Bây giờ (
                                {
                                    liveSessionsSeries[
                                        liveSessionsSeries.length - 1
                                    ]
                                }{' '}
                                sessions)
                            </span>
                        </div>
                    </div>
                </div>
            </div>

            {/* ── FIFTH ROW (LOGS, WARNINGS & SECURITY ISOLATION LOGS) ───── */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* 1. Cross-Tenant Isolation Breach Logs */}
                <div className="bg-surface p-6 rounded-2xl border border-border/50 shadow-sm flex flex-col justify-between h-[360px]">
                    <div>
                        <div className="flex items-center justify-between mb-2">
                            <h3 className="text-sm font-bold text-text-primary">
                                Cross-Tenant Isolation Breach
                            </h3>
                            <span className="text-[10px] font-bold bg-rose-500 text-surface px-2 py-0.5 rounded-full">
                                ATTEMPTS: {isolationBreach.attempts}
                            </span>
                        </div>
                        <div className="bg-emerald-500/10 border border-emerald-500/30 text-emerald-700 text-xs font-semibold p-3 rounded-xl flex items-center gap-2 mb-4">
                            <ShieldCheck className="w-5 h-5 text-emerald-600 flex-shrink-0" />
                            <span>{isolationBreach.status}</span>
                        </div>
                    </div>

                    <div className="flex-1 overflow-y-auto space-y-2 pr-1">
                        {isolationBreach.logs.map((log, i) => (
                            <div
                                key={i}
                                className="p-2.5 rounded-lg border border-border/40 bg-slate-50/50 flex justify-between items-center text-xs"
                            >
                                <div>
                                    <span className="text-text-muted mr-2 font-medium">
                                        {log.time}
                                    </span>
                                    <span className="font-semibold text-text-primary">
                                        {log.guard}
                                    </span>
                                </div>
                                <span className="text-[10px] font-bold text-success bg-success/15 px-2 py-0.5 rounded-full">
                                    {log.status}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* 2. Runtime System Anomalies */}
                <div className="bg-surface p-6 rounded-2xl border border-border/50 shadow-sm flex flex-col justify-between h-[360px]">
                    <div>
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-sm font-bold text-text-primary">
                                Runtime System Anomalies
                            </h3>
                            <span className="text-[10px] font-bold bg-amber-500 text-surface px-2 py-0.5 rounded-full">
                                {latestAnomalies.length} Warnings
                            </span>
                        </div>
                    </div>

                    <div className="flex-1 overflow-y-auto space-y-3 pr-1">
                        {latestAnomalies.map((anom, i) => (
                            <div
                                key={i}
                                className={`p-3 rounded-xl border flex gap-3 text-xs leading-relaxed ${
                                    anom.level === 'CRITICAL'
                                        ? 'bg-rose-50 border-rose-200 text-rose-800'
                                        : 'bg-amber-50 border-amber-200 text-amber-800'
                                }`}
                            >
                                <AlertTriangle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                                <div>
                                    <div className="font-bold flex items-center gap-1.5">
                                        <span>
                                            [{anom.node}] {anom.type}
                                        </span>
                                        <span>•</span>
                                        <span className="font-medium text-[10px] opacity-75">
                                            {anom.timestamp}
                                        </span>
                                    </div>
                                    <p className="mt-1 font-medium">
                                        {anom.message}
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* 3. Global Stdout Security Stream */}
                <div className="bg-surface p-6 rounded-2xl border border-border/50 shadow-sm flex flex-col justify-between h-[360px]">
                    <div>
                        <h3 className="text-sm font-bold text-text-primary mb-4">
                            Global Stdout Security Stream
                        </h3>
                    </div>

                    <div className="flex-1 bg-slate-900 text-slate-200 font-mono text-[11px] p-4 rounded-xl overflow-y-auto space-y-2 shadow-inner border border-slate-950">
                        {logLines.map((log, i) => {
                            let colorClass = 'text-sky-400'
                            if (log.color === 'green')
                                colorClass = 'text-emerald-400'
                            if (log.color === 'orange')
                                colorClass = 'text-amber-400'

                            return (
                                <div
                                    key={i}
                                    className="hover:bg-slate-800/50 py-0.5 rounded px-1 transition-colors"
                                >
                                    <span className="text-slate-500 mr-1.5">
                                        {log.time}
                                    </span>
                                    <span
                                        className={`font-semibold mr-1.5 ${colorClass}`}
                                    >
                                        [{log.module}]
                                    </span>
                                    <span>{log.message}</span>
                                </div>
                            )
                        })}
                    </div>
                </div>
            </div>
        </div>
    )
}
