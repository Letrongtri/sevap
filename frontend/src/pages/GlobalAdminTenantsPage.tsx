import Header from '../components/ui/Header'
import TenantTable from '../components/globalAdmin/tenant/TenantTable'
import TenantDetail from '../components/globalAdmin/tenant/TenantDetail'
import TenantSummaryCards from '../components/globalAdmin/tenant/TenantSummaryCards'
import { useGlobalTenantStore } from '../store/globalTenantStore'
import { usePageTitle } from '../hooks/usePageTitle'
import { Building2 } from 'lucide-react'

export default function GlobalAdminTenantsPage() {
    usePageTitle('Quản lý Tenant - System Admin')

    const activeTenantId = useGlobalTenantStore((s) => s.activeTenantId)
    const isAddingTenant = useGlobalTenantStore((s) => s.isAddingTenant)
    const showDetail = activeTenantId !== null || isAddingTenant

    const setIsAddingTenant = useGlobalTenantStore((s) => s.setIsAddingTenant)
    const setActiveTenantId = useGlobalTenantStore((s) => s.setActiveTenantId)

    const handleStartAddTenant = () => {
        setActiveTenantId(null)
        setIsAddingTenant(true)
    }

    return (
        <div className="h-full flex flex-col gap-4 overflow-hidden">
            {/* Page Header */}
            <div className="flex-shrink-0">
                <Header
                    title="Quản lý Tenants"
                    icon={<Building2 className="w-5 h-5" />}
                    isAdding={isAddingTenant}
                    onAdd={handleStartAddTenant}
                    btnTitle="Thêm Tenant"
                />
            </div>

            {/* Summary KPI Cards */}
            <TenantSummaryCards />

            {/* Main Content Layout (Table + Side Drawer) */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-stretch flex-1 overflow-hidden">
                {/* Left side: Tenants Table List */}
                <div
                    className={[
                        'transition-all duration-300 ease-in-out h-full overflow-hidden flex flex-col',
                        showDetail
                            ? 'lg:col-span-7 xl:col-span-8'
                            : 'lg:col-span-12',
                    ].join(' ')}
                >
                    <TenantTable />
                </div>

                {/* Right side: Selected tenant details or Add tenant form */}
                {showDetail && (
                    <div className="lg:col-span-5 xl:col-span-4 bg-white rounded-2xl border border-[#D4D7DE]/60 shadow-lg relative animate-slide-in-right flex flex-col h-full overflow-hidden">
                        <TenantDetail key={activeTenantId || 'adding-tenant'} />
                    </div>
                )}
            </div>
        </div>
    )
}
