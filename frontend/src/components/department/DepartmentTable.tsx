import { useState, useEffect } from 'react'
import { useDepartmentStore } from '../../store/departmentStore'
import { useDepartments } from '../../hooks/useDepartments'
import type { Department } from '../../types/department'
import { AlertCircle, Search, ShieldCheck } from 'lucide-react'
import LoadingSpinner from '../ui/LoadingSpinner'
import Button from '../ui/Button'
import Pagination from '../ui/Pagination'
import { formatDateTimeToDDMMYYYY } from '../../../utils/formater'

const DepartmentTable = () => {
    // Search and status state
    const query = useDepartmentStore((s) => s.query)
    const setQuery = useDepartmentStore((s) => s.setQuery)
    const activeDepartmentId = useDepartmentStore((s) => s.activeDepartmentId)
    const setActiveDepartmentId = useDepartmentStore(
        (s) => s.setActiveDepartmentId
    )
    const setIsAddingDepartment = useDepartmentStore(
        (s) => s.setIsAddingDepartment
    )

    // Pagination state
    const page = useDepartmentStore((s) => s.page) || 1
    const setPage = useDepartmentStore((s) => s.setPage)
    const limit = useDepartmentStore((s) => s.limit) || 10
    const setLimit = useDepartmentStore((s) => s.setLimit)

    // Debounced search state
    const [localSearch, setLocalSearch] = useState(query || '')

    useEffect(() => {
        const handler = setTimeout(() => {
            setQuery(localSearch || null)
            setPage(1) // Reset to first page on search
        }, 300)
        return () => clearTimeout(handler)
    }, [localSearch, setQuery, setPage])

    // Fetch departments (react-query triggers automatically when filters/page/limit change)
    const { departments, isLoading, error, refetch, pagination } =
        useDepartments()

    const handleSelectDepartment = (department: Department) => {
        setIsAddingDepartment(false)
        setActiveDepartmentId(department.id)
    }

    return (
        <div className="bg-white rounded-2xl border border-[#D4D7DE]/60 shadow-sm overflow-hidden flex flex-col h-full">
            {/* Search & filters bar */}
            <div className="p-4 border-b border-[#D4D7DE]/40 flex flex-col gap-4 bg-bg/20 flex-shrink-0">
                {/* Search query & Status filter row */}
                <div className="flex flex-col sm:flex-row gap-3 justify-between items-stretch sm:items-center">
                    {/* Search bar */}
                    <div className="relative flex-1 max-w-md">
                        <Search className="w-4 h-4 text-text-placeholder absolute left-3.5 top-1/2 -translate-y-1/2" />
                        <input
                            type="text"
                            placeholder="Tìm kiếm theo tên hoặc mã phòng ban..."
                            value={localSearch}
                            onChange={(e) => setLocalSearch(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 text-sm bg-surface-raised border border-border rounded-xl focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all placeholder:text-text-placeholder"
                        />
                    </div>
                </div>
            </div>

            {/* User list table container */}
            <div className="overflow-auto min-h-0 flex-1">
                {isLoading ? (
                    <div className="flex flex-col items-center justify-center min-h-[400px] space-y-3">
                        <LoadingSpinner />
                        <p className="text-sm text-text-placeholder">
                            Đang tải danh sách phòng ban...
                        </p>
                    </div>
                ) : error ? (
                    <div className="flex flex-col items-center justify-center min-h-[400px] text-center p-6 space-y-2">
                        <AlertCircle className="w-10 h-10 text-error" />
                        <h3 className="text-lg font-semibold text-text-primary">
                            Tải danh sách phòng ban thất bại
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
                ) : departments.length === 0 ? (
                    <div className="flex flex-col items-center justify-center min-h-[400px] text-center p-6 space-y-2">
                        <ShieldCheck className="w-10 h-10 text-text-placeholder" />
                        <h3 className="text-base font-semibold text-text-secondary">
                            Không tìm thấy phòng ban nào
                        </h3>
                    </div>
                ) : (
                    <table className="w-full border-separate border-spacing-0 text-left">
                        <thead>
                            <tr className="text-text-secondary text-xs uppercase font-bold tracking-wider">
                                {/* Đưa sticky và bg-white vào từng thẻ th để làm nền cứng chặn text cuộn phía dưới */}
                                <th className="sticky top-0 z-10 bg-white border-b border-[#D4D7DE]/40 px-5 py-4 font-bold">
                                    STT
                                </th>
                                <th className="sticky top-0 z-10 bg-white border-b border-[#D4D7DE]/40 px-5 py-4 font-bold">
                                    Tên phòng ban
                                </th>
                                <th className="sticky top-0 z-10 bg-white border-b border-[#D4D7DE]/40 px-5 py-4 font-bold">
                                    Mã phòng ban
                                </th>
                                <th className="sticky top-0 z-10 bg-white border-b border-[#D4D7DE]/40 px-5 py-4 font-bold">
                                    Mô tả
                                </th>
                                <th className="sticky top-0 z-10 bg-white border-b border-[#D4D7DE]/40 px-5 py-4 font-bold">
                                    Ngày tạo
                                </th>
                                <th className="sticky top-0 z-10 bg-white border-b border-[#D4D7DE]/40 px-5 py-4 font-bold">
                                    Ngày cập nhật
                                </th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-[#D4D7DE]/40">
                            {departments.map((department, index) => {
                                const isSelected =
                                    activeDepartmentId === department.id

                                return (
                                    <tr
                                        key={department.id}
                                        onClick={() =>
                                            handleSelectDepartment(department)
                                        }
                                        className={[
                                            'group cursor-pointer transition-colors duration-150',
                                            isSelected
                                                ? 'bg-primary/5 hover:bg-primary/5 border-l-4 border-primary'
                                                : 'hover:bg-bg/20',
                                        ].join(' ')}
                                    >
                                        {/* Index */}
                                        <td className="px-5 py-3.5 text-sm text-text-secondary">
                                            {(page - 1) * limit + index + 1}
                                        </td>
                                        {/* Name */}
                                        <td className="px-5 py-3.5 text-sm text-text-secondary">
                                            {department.name}
                                        </td>
                                        <td className="px-5 py-3.5 text-sm text-text-secondary">
                                            {department.code}
                                        </td>
                                        {/* Description */}
                                        <td className="px-5 py-3.5 text-sm text-text-secondary">
                                            {department.description || ''}
                                        </td>

                                        <td className="px-5 py-3.5 text-sm text-text-secondary">
                                            {formatDateTimeToDDMMYYYY(
                                                department.created_at
                                            )}
                                        </td>

                                        <td className="px-5 py-3.5 text-sm text-text-secondary">
                                            {formatDateTimeToDDMMYYYY(
                                                department.updated_at
                                            )}
                                        </td>
                                    </tr>
                                )
                            })}
                        </tbody>
                    </table>
                )}
            </div>

            {/* Pagination controls at footer */}
            {!isLoading && !error && departments.length > 0 && pagination && (
                <div className="flex-shrink-0">
                    <Pagination
                        page={page}
                        limit={limit}
                        totalPages={pagination.total_pages}
                        totalItems={pagination.total}
                        unit="phòng ban"
                        onPageChange={setPage}
                        onLimitChange={setLimit}
                    />
                </div>
            )}
        </div>
    )
}

export default DepartmentTable
