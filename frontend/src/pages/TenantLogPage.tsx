import Header from '../components/ui/Header'
import TenantLogList from '../components/tenantLog/TenantLogList'
import { useTenantLogStore } from '../store/tenantLogStore'
import TenantLogDetail from '../components/tenantLog/TenantLogDetail'
import { usePageTitle } from '../hooks/usePageTitle'

export default function TenantLogPage() {
    usePageTitle('Nhật ký kiểm toán')
    const activeTenantLogId = useTenantLogStore((s) => s.activeTenantLogId)
    const showDetail = activeTenantLogId !== null

    return (
        <div className="h-full flex flex-col gap-4 overflow-hidden">
            {/* Header section */}
            <div className="flex-shrink-0">
                <Header title="Nhật ký kiểm toán" />
            </div>

            {/* Filter and Content layout */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-stretch flex-1 overflow-hidden">
                {/* Left side: roles table list */}
                <div
                    className={[
                        'transition-all duration-300 ease-in-out h-full overflow-hidden flex flex-col',
                        showDetail
                            ? 'lg:col-span-7 xl:col-span-8'
                            : 'lg:col-span-12',
                    ].join(' ')}
                >
                    <TenantLogList />
                </div>

                {/* Right side: Selected department details or add department card */}
                {showDetail && (
                    <div className="lg:col-span-5 xl:col-span-4 bg-white rounded-2xl border border-[#D4D7DE]/60 shadow-lg relative animate-slide-in-right flex flex-col h-full overflow-hidden">
                        <TenantLogDetail key={activeTenantLogId} />
                    </div>
                )}
            </div>
        </div>
    )
}
