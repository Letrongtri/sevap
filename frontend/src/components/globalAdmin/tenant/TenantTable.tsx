import { useState, useEffect } from 'react'
import { useGlobalTenantStore } from '../../../store/globalTenantStore'
import { useGlobalTenants } from '../../../hooks/useGlobalTenants'
import type { Tenant } from '../../../types/tenant'
import { AlertCircle, Search, ShieldCheck, Filter } from 'lucide-react'
import LoadingSpinner from '../../ui/LoadingSpinner'
import Button from '../../ui/Button'
import Pagination from '../../ui/Pagination'
import { formatDateTimeToDDMMYYYY } from '../../../../utils/formater'

const getStatusBadge = (status: string) => {
    switch (status.toLowerCase()) {
        case 'active':
            return (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200/60">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    Hoạt động
                </span>
            )
        case 'suspended':
            return (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200/60">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                    Tạm dừng
                </span>
            )
        case 'inactive':
            return (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-200/60">
                    <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
                    Ngừng hoạt động
                </span>
            )
        case 'deleted':
            return (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200/60">
                    <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                    Đã xóa
                </span>
            )
        default:
            return (
                <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-gray-100 text-gray-700 border border-gray-200">
                    {status}
                </span>
            )
    }
}

export function TenantTable() {
    const query = useGlobalTenantStore((s) => s.query)
    const setQuery = useGlobalTenantStore((s) => s.setQuery)
    const statusFilter = useGlobalTenantStore((s) => s.statusFilter)
    const setStatusFilter = useGlobalTenantStore((s) => s.setStatusFilter)
    const activeTenantId = useGlobalTenantStore((s) => s.activeTenantId)
    const setActiveTenantId = useGlobalTenantStore((s) => s.setActiveTenantId)
    const setIsAddingTenant = useGlobalTenantStore((s) => s.setIsAddingTenant)

    const page = useGlobalTenantStore((s) => s.page) || 1
    const setPage = useGlobalTenantStore((s) => s.setPage)
    const limit = useGlobalTenantStore((s) => s.limit) || 10
    const setLimit = useGlobalTenantStore((s) => s.setLimit)

    const [localSearch, setLocalSearch] = useState(query || '')

    useEffect(() => {
        const handler = setTimeout(() => {
            setQuery(localSearch || null)
            setPage(1)
        }, 300)
        return () => clearTimeout(handler)
    }, [localSearch, setQuery, setPage])

    const { tenants, isLoading, error, refetch, pagination } = useGlobalTenants()

    const handleSelectTenant = (tenant: Tenant) => {
        setIsAddingTenant(false)
        setActiveTenantId(tenant.id)
    }

    return (
        <div className="bg-white rounded-2xl border border-[#D4D7DE]/60 shadow-sm overflow-hidden flex flex-col h-full">
            {/* Search & Status Filter bar */}
            <div className="p-4 border-b border-[#D4D7DE]/40 flex flex-col gap-4 bg-bg/20 flex-shrink-0">
                <div className="flex flex-col sm:flex-row gap-3 justify-between items-stretch sm:items-center">
                    {/* Search Input */}
                    <div className="relative flex-1 max-w-md">
                        <Search className="w-4 h-4 text-text-placeholder absolute left-3.5 top-1/2 -translate-y-1/2" />
                        <input
                            type="text"
                            placeholder="Tìm kiếm theo tên công ty hoặc domain..."
                            value={localSearch}
                            onChange={(e) => setLocalSearch(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 text-sm bg-surface-raised border border-border rounded-xl focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all placeholder:text-text-placeholder"
                        />
                    </div>

                    {/* Status Select Filter */}
                    <div className="flex items-center gap-2">
                        <Filter className="w-4 h-4 text-text-secondary" />
                        <select
                            value={statusFilter || 'all'}
                            onChange={(e) => {
                                setStatusFilter(e.target.value)
                                setPage(1)
                            }}
                            className="px-3 py-2 text-sm bg-surface-raised border border-border rounded-xl focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all text-text-primary"
                        >
                            <option value="all">Tất cả trạng thái</option>
                            <option value="active">Hoạt động</option>
                            <option value="suspended">Tạm dừng</option>
                            <option value="inactive">Ngừng hoạt động</option>
                        </select>
                    </div>
                </div>
            </div>

            {/* Table Container */}
            <div className="overflow-auto min-h-0 flex-1 scrollbar-thin">
                {isLoading ? (
                    <div className="flex flex-col items-center justify-center min-h-[400px] space-y-3">
                        <LoadingSpinner />
                        <p className="text-sm text-text-placeholder">
                            Đang tải danh sách tenant...
                        </p>
                    </div>
                ) : error ? (
                    <div className="flex flex-col items-center justify-center min-h-[400px] text-center p-6 space-y-2">
                        <AlertCircle className="w-10 h-10 text-error" />
                        <h3 className="text-lg font-semibold text-text-primary">
                            Tải danh sách tenant thất bại
                        </h3>
                        <p className="text-sm text-text-placeholder max-w-sm">
                            {error.message || 'Đã có lỗi xảy ra'}
                        </p>
                        <Button
                            variant="secondary"
                            size="sm"
                            onClick={() => refetch()}
                        >
                            Thử lại
                        </Button>
                    </div>
                ) : tenants.length === 0 ? (
                    <div className="flex flex-col items-center justify-center min-h-[400px] text-center p-6 space-y-2">
                        <ShieldCheck className="w-10 h-10 text-text-placeholder" />
                        <h3 className="text-base font-semibold text-text-secondary">
                            Không tìm thấy tenant nào
                        </h3>
                        <p className="text-xs text-text-placeholder">
                            Thử thay đổi từ khóa tìm kiếm hoặc bộ lọc trạng thái.
                        </p>
                    </div>
                ) : (
                    <table className="w-full border-separate border-spacing-0 text-left">
                        <thead>
                            <tr className="text-text-secondary text-xs uppercase font-bold tracking-wider">
                                <th className="sticky top-0 z-10 bg-white border-b border-[#D4D7DE]/40 px-5 py-4 font-bold">
                                    STT
                                </th>
                                <th className="sticky top-0 z-10 bg-white border-b border-[#D4D7DE]/40 px-5 py-4 font-bold">
                                    Tên công ty
                                </th>
                                <th className="sticky top-0 z-10 bg-white border-b border-[#D4D7DE]/40 px-5 py-4 font-bold">
                                    Domain
                                </th>
                                <th className="sticky top-0 z-10 bg-white border-b border-[#D4D7DE]/40 px-5 py-4 font-bold">
                                    Email liên hệ
                                </th>
                                <th className="sticky top-0 z-10 bg-white border-b border-[#D4D7DE]/40 px-5 py-4 font-bold">
                                    Số điện thoại
                                </th>
                                <th className="sticky top-0 z-10 bg-white border-b border-[#D4D7DE]/40 px-5 py-4 font-bold">
                                    Trạng thái
                                </th>
                                <th className="sticky top-0 z-10 bg-white border-b border-[#D4D7DE]/40 px-5 py-4 font-bold">
                                    Ngày khởi tạo
                                </th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-[#D4D7DE]/40">
                            {tenants.map((tenant, index) => {
                                const isSelected = activeTenantId === tenant.id

                                return (
                                    <tr
                                        key={tenant.id}
                                        onClick={() => handleSelectTenant(tenant)}
                                        className={[
                                            'group cursor-pointer transition-colors duration-150',
                                            isSelected
                                                ? 'bg-primary/5 hover:bg-primary/5 border-l-4 border-primary'
                                                : 'hover:bg-bg/20',
                                        ].join(' ')}
                                    >
                                        <td className="px-5 py-3.5 text-sm text-text-secondary font-medium">
                                            {(page - 1) * limit + index + 1}
                                        </td>
                                        <td className="px-5 py-3.5 text-sm font-semibold text-text-primary">
                                            {tenant.company_name}
                                        </td>
                                        <td className="px-5 py-3.5 text-sm text-primary font-mono font-medium">
                                            {tenant.tenant_domain}
                                        </td>
                                        <td className="px-5 py-3.5 text-sm text-text-secondary">
                                            {tenant.company_email || '--'}
                                        </td>
                                        <td className="px-5 py-3.5 text-sm text-text-secondary">
                                            {tenant.company_phone || '--'}
                                        </td>
                                        <td className="px-5 py-3.5 text-sm">
                                            {getStatusBadge(tenant.status)}
                                        </td>
                                        <td className="px-5 py-3.5 text-sm text-text-secondary">
                                            {formatDateTimeToDDMMYYYY(
                                                tenant.created_at
                                            )}
                                        </td>
                                    </tr>
                                )
                            })}
                        </tbody>
                    </table>
                )}
            </div>

            {/* Pagination Controls */}
            {!isLoading && !error && tenants.length > 0 && pagination && (
                <div className="flex-shrink-0">
                    <Pagination
                        page={page}
                        limit={limit}
                        totalPages={pagination.total_pages}
                        totalItems={pagination.total}
                        unit="tenant"
                        onPageChange={setPage}
                        onLimitChange={setLimit}
                    />
                </div>
            )}
        </div>
    )
}

export default TenantTable
