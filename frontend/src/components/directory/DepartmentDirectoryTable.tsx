import { AlertCircle, Building2 } from 'lucide-react'
import { useDirectoryStore } from '../../store/directoryStore'
import { useDirectoryDepartments } from '../../hooks/useDirectory'
import LoadingSpinner from '../ui/LoadingSpinner'
import Button from '../ui/Button'
import Pagination from '../ui/Pagination'
import { DirectoryTab } from '../../types/directory'

const DepartmentDirectoryTable = () => {
    const activeTab = useDirectoryStore((s) => s.activeTab)
    const page = useDirectoryStore((s) => s.page) || 1
    const setPage = useDirectoryStore((s) => s.setPage)
    const limit = useDirectoryStore((s) => s.limit) || 10
    const setLimit = useDirectoryStore((s) => s.setLimit)

    const { data, isLoading, error, refetch } = useDirectoryDepartments({
        enabled: activeTab === DirectoryTab.Departments,
    })

    const departments = data?.departments || []
    const pagination = data?.pagination

    if (isLoading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[400px] space-y-3">
                <LoadingSpinner />
                <p className="text-sm text-text-placeholder">
                    Đang tải danh sách phòng ban...
                </p>
            </div>
        )
    }

    if (error) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[400px] text-center p-6 space-y-2">
                <AlertCircle className="w-10 h-10 text-error" />
                <h3 className="text-lg font-semibold text-text-primary">
                    Tải danh sách phòng ban thất bại
                </h3>
                <p className="text-sm text-text-placeholder max-w-sm">
                    {error instanceof Error
                        ? error.message
                        : 'Đã có lỗi xảy ra'}
                </p>
                <Button variant="secondary" size="sm" onClick={() => refetch()}>
                    Thử lại
                </Button>
            </div>
        )
    }

    if (departments.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[400px] text-center p-6 space-y-2">
                <Building2 className="w-10 h-10 text-text-placeholder" />
                <h3 className="text-base font-semibold text-text-secondary">
                    Không tìm thấy phòng ban nào
                </h3>
                <p className="text-sm text-text-placeholder max-w-xs">
                    Thử điều chỉnh từ khóa tìm kiếm.
                </p>
            </div>
        )
    }

    return (
        <div className="flex flex-col h-full overflow-hidden">
            {/* Table container */}
            <div className="overflow-auto min-h-0 flex-1">
                <table className="w-full border-separate border-spacing-0 text-left">
                    <thead>
                        <tr className="text-text-secondary text-xs uppercase font-bold tracking-wider">
                            <th className="sticky top-0 z-10 bg-white border-b border-[#D4D7DE]/40 px-5 py-4 font-bold">
                                STT
                            </th>
                            <th className="sticky top-0 z-10 bg-white border-b border-[#D4D7DE]/40 px-5 py-4 font-bold">
                                Mã phòng ban
                            </th>
                            <th className="sticky top-0 z-10 bg-white border-b border-[#D4D7DE]/40 px-5 py-4 font-bold">
                                Tên phòng ban
                            </th>
                            <th className="sticky top-0 z-10 bg-white border-b border-[#D4D7DE]/40 px-5 py-4 font-bold">
                                Mô tả
                            </th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-[#D4D7DE]/40">
                        {departments.map((dept, index) => (
                            <tr
                                key={dept.id}
                                className="group hover:bg-bg/20 transition-colors duration-150"
                            >
                                <td className="px-5 py-3.5 text-sm text-text-secondary">
                                    {(page - 1) * limit + index + 1}
                                </td>
                                <td className="px-5 py-3.5 text-sm text-text-secondary">
                                    {dept.code}
                                </td>
                                <td className="px-5 py-3.5 text-sm font-semibold text-text-primary group-hover:text-primary transition-colors">
                                    {dept.name}
                                </td>
                                <td className="px-5 py-3.5 text-sm text-text-secondary max-w-[300px] truncate">
                                    {dept.description || (
                                        <span className="italic text-text-placeholder">
                                            Không có mô tả
                                        </span>
                                    )}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Pagination footer */}
            {pagination && (
                <div className="flex-shrink-0 border-t border-[#D4D7DE]/40 bg-white p-4">
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

export default DepartmentDirectoryTable
