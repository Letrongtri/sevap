import { ArrowDown, ArrowUp, ArrowUpDown } from 'lucide-react'
import { formatDateTimeToDDMMYYYYHHMMSS } from '../../../utils/formater'
import { stringToLabel } from '../../../utils/utils'
import { useTenantLogStore } from '../../store/tenantLogStore'
import type { TenantLog } from '../../types/tenantLog'
import { LOG_LEVELS } from '../../types/common'
import Badge from '../ui/Badge'

const SortIcon = ({ field }: { field: string }) => {
    const filters = useTenantLogStore((s) => s.filters)

    if (filters.sort_by !== field) {
        return (
            <ArrowUpDown className="w-3 h-3 text-text-placeholder opacity-0 group-hover/th:opacity-100 transition-opacity" />
        )
    }
    return filters.sort_order === 'asc' ? (
        <ArrowUp className="w-3 h-3 text-primary" />
    ) : (
        <ArrowDown className="w-3 h-3 text-primary" />
    )
}

const TenantLogTable = ({ tenantLogs }: { tenantLogs: TenantLog[] }) => {
    const filters = useTenantLogStore((s) => s.filters)
    const activeTenantLogId = useTenantLogStore((s) => s.activeTenantLogId)
    const setActiveTenantLogId = useTenantLogStore(
        (s) => s.setActiveTenantLogId
    )

    const setPage = useTenantLogStore((s) => s.setPage)
    const setSortBy = useTenantLogStore((s) => s.setSortBy)
    const setSortOrder = useTenantLogStore((s) => s.setSortOrder)

    // Pagination state
    const page = filters.page || 1
    const limit = filters.limit || 10

    // Sorting
    const handleSort = (field: string) => {
        if (filters.sort_by === field) {
            // Toggle sort order
            setSortOrder(filters.sort_order === 'asc' ? 'desc' : 'asc')
        } else {
            setSortBy(field)
            setSortOrder('desc')
        }
        setPage(1)
    }

    const sortableThClass = (field: string) =>
        [
            'sticky top-0 z-10 bg-white border-b border-[#D4D7DE]/40 px-5 py-4 font-bold group/th',
            'cursor-pointer select-none hover:bg-bg/20 transition-colors',
            filters.sort_by === field ? 'text-primary' : '',
        ].join(' ')

    return (
        <table className="w-full border-separate border-spacing-0 text-left">
            <thead>
                <tr className="text-text-secondary text-xs uppercase font-bold tracking-wider">
                    <th className="sticky top-0 z-10 bg-white border-b border-[#D4D7DE]/40 px-5 py-4 font-bold">
                        No.
                    </th>
                    <th
                        className={sortableThClass('action')}
                        onClick={() => handleSort('action')}
                    >
                        <div className="flex items-center gap-1.5">
                            Action
                            <SortIcon field="action" />
                        </div>
                    </th>
                    <th
                        className={sortableThClass('resource')}
                        onClick={() => handleSort('resource')}
                    >
                        <div className="flex items-center gap-1.5">
                            Resource
                            <SortIcon field="resource" />
                        </div>
                    </th>
                    <th
                        className={sortableThClass('log_level')}
                        onClick={() => handleSort('log_level')}
                    >
                        <div className="flex items-center gap-1.5">
                            Log Level
                            <SortIcon field="log_level" />
                        </div>
                    </th>
                    <th
                        className={sortableThClass('user_name')}
                        onClick={() => handleSort('user_name')}
                    >
                        <div className="flex items-center gap-1.5">
                            Actor
                            <SortIcon field="user_name" />
                        </div>
                    </th>
                    <th className="sticky top-0 z-10 bg-white border-b border-[#D4D7DE]/40 px-5 py-4 font-bold">
                        Emp. Code
                    </th>
                    <th className="sticky top-0 z-10 bg-white border-b border-[#D4D7DE]/40 px-5 py-4 font-bold">
                        IP Address
                    </th>
                    <th
                        className={sortableThClass('created_at')}
                        onClick={() => handleSort('created_at')}
                    >
                        <div className="flex items-center gap-1.5">
                            Created At
                            <SortIcon field="created_at" />
                        </div>
                    </th>
                </tr>
            </thead>
            <tbody className="divide-y divide-[#D4D7DE]/40">
                {tenantLogs.map((log, index) => {
                    const isSelected = activeTenantLogId === log.id

                    return (
                        <tr
                            key={log.id}
                            onClick={() => setActiveTenantLogId(log.id)}
                            className={[
                                'group cursor-pointer transition-colors duration-150',
                                isSelected
                                    ? 'bg-primary/5 hover:bg-primary/5 border-l-4 border-primary'
                                    : 'hover:bg-bg/20',
                            ].join(' ')}
                        >
                            {/* Index */}
                            <td className="px-5 py-3.5 text-text-secondary">
                                {(page - 1) * limit + index + 1}
                            </td>
                            {/* Action */}
                            <td className="px-5 py-3.5 text-text-secondary max-w-[160px] truncate">
                                {log.action}
                            </td>
                            {/* Resource */}
                            <td className="px-5 py-3.5 text-text-secondary max-w-[160px] truncate">
                                {log.resource || '—'}
                            </td>
                            {/* Log level */}
                            <td className="px-5 py-3.5">
                                <Badge
                                    variant={
                                        log.log_level === LOG_LEVELS[2]
                                            ? 'error'
                                            : log.log_level === LOG_LEVELS[1]
                                              ? 'warning'
                                              : 'default'
                                    }
                                    size="sm"
                                    dot
                                >
                                    {stringToLabel(log.log_level)}
                                </Badge>
                            </td>
                            {/* Actor name */}
                            <td className="px-5 py-3.5 text-text-secondary font-medium">
                                {log.user_name || 'System'}
                            </td>
                            {/* Employee code */}
                            <td className="px-5 py-3.5 text-text-placeholder">
                                {log.employee_code || '—'}
                            </td>
                            {/* IP */}
                            <td className="px-5 py-3.5 text-text-placeholder">
                                {log.ip_address || '—'}
                            </td>
                            {/* Created at */}
                            <td className="px-5 py-3.5 text-sm text-text-secondary whitespace-nowrap">
                                {formatDateTimeToDDMMYYYYHHMMSS(log.created_at)}
                            </td>
                        </tr>
                    )
                })}
            </tbody>
        </table>
    )
}
export default TenantLogTable
