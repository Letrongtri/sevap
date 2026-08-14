import { useTenantSummary } from '../../../hooks/useGlobalTenants'
import { Building2, CheckCircle2, PauseCircle, TrendingUp } from 'lucide-react'

export function TenantSummaryCards() {
    const { data: summary, isLoading, error } = useTenantSummary()

    const cards = [
        {
            title: 'Tổng số Tenants',
            value: summary?.total_tenants ?? 0,
            subtitle: 'Tất cả tổ chức trên hệ thống',
            icon: Building2,
            bgColor: 'bg-blue-50 text-blue-600',
            borderColor: 'border-blue-100',
        },
        {
            title: 'Đang hoạt động',
            value: summary?.active_tenants ?? 0,
            subtitle: 'Các doanh nghiệp active',
            icon: CheckCircle2,
            bgColor: 'bg-emerald-50 text-emerald-600',
            borderColor: 'border-emerald-100',
        },
        {
            title: 'Tạm dừng (Suspended)',
            value: summary?.suspended_tenants ?? 0,
            subtitle: 'Tài khoản đang bị tạm ngưng',
            icon: PauseCircle,
            bgColor: 'bg-amber-50 text-amber-600',
            borderColor: 'border-amber-100',
        },
        {
            title: 'Mới trong tháng này',
            value: summary?.new_tenants_this_month ?? 0,
            subtitle: 'Tăng trưởng tháng hiện tại',
            icon: TrendingUp,
            bgColor: 'bg-indigo-50 text-indigo-600',
            borderColor: 'border-indigo-100',
        },
    ]

    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 flex-shrink-0">
            {cards.map((card, idx) => {
                const Icon = card.icon
                return (
                    <div
                        key={idx}
                        className={`bg-white p-4 rounded-2xl border ${card.borderColor} shadow-sm hover:shadow-md transition-all duration-200 flex flex-col justify-between`}
                    >
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-xs font-bold text-text-secondary uppercase tracking-wider">
                                {card.title}
                            </span>
                            <div className={`p-2 rounded-xl ${card.bgColor}`}>
                                <Icon className="w-5 h-5" />
                            </div>
                        </div>

                        <div>
                            {isLoading ? (
                                <div className="h-8 w-16 bg-gray-100 animate-pulse rounded-lg mb-1" />
                            ) : error ? (
                                <span className="text-sm text-text-placeholder font-medium">
                                    --
                                </span>
                            ) : (
                                <div className="text-2xl font-bold text-text-primary tracking-tight">
                                    {card.value.toLocaleString()}
                                </div>
                            )}
                            <p className="text-xs text-text-placeholder mt-0.5">
                                {card.subtitle}
                            </p>
                        </div>
                    </div>
                )
            })}
        </div>
    )
}

export default TenantSummaryCards
