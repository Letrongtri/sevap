import { useGlobalTenantStore } from '../../../store/globalTenantStore'
import { X } from 'lucide-react'
import { useGlobalTenants } from '../../../hooks/useGlobalTenants'
import DetailTenantForm from './DetailTenantForm'

export function TenantDetail() {
    const activeTenantId = useGlobalTenantStore((s) => s.activeTenantId)
    const setActiveTenantId = useGlobalTenantStore((s) => s.setActiveTenantId)
    const isAddingTenant = useGlobalTenantStore((s) => s.isAddingTenant)
    const setIsAddingTenant = useGlobalTenantStore((s) => s.setIsAddingTenant)

    const { tenants } = useGlobalTenants()
    const selectedTenant = tenants.find((t) => t.id === activeTenantId) || null

    const handleCloseCard = () => {
        setActiveTenantId(null)
        setIsAddingTenant(false)
    }

    return (
        <div className="flex flex-col h-full relative">
            {/* Drawer Header */}
            <div className="px-6 py-4 border-b border-[#D4D7DE]/40 flex-shrink-0 relative">
                <button
                    onClick={handleCloseCard}
                    title="Đóng bảng chi tiết"
                    className="absolute top-3 right-3 p-1.5 rounded-lg text-text-placeholder hover:text-text-primary hover:bg-bg transition-all duration-150 z-20 cursor-pointer"
                >
                    <X className="w-5 h-5" />
                </button>

                <h2 className="text-lg font-bold text-text-primary">
                    {isAddingTenant
                        ? 'Thêm Tenant mới'
                        : selectedTenant
                          ? 'Thông tin Tenant'
                          : ''}
                </h2>
            </div>

            {/* Drawer Content */}
            <div className="flex-1 overflow-y-auto p-6 pt-4 scrollbar-thin">
                {(isAddingTenant || selectedTenant) && (
                    <DetailTenantForm
                        key={selectedTenant?.id ?? 'new-tenant'}
                        selectedTenant={selectedTenant}
                        onCloseCard={handleCloseCard}
                    />
                )}
            </div>
        </div>
    )
}

export default TenantDetail
