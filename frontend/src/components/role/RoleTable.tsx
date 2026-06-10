import { useState, useEffect } from 'react'
import { useRoleStore } from '../../store/roleStore'
import { useRoles } from '../../hooks/useRoles'
import type { Role } from '../../types/role'
import { AlertCircle, Search, ShieldCheck } from 'lucide-react'
import LoadingSpinner from '../ui/LoadingSpinner'
import Button from '../ui/Button'
import Badge from '../ui/Badge'
import Pagination from '../ui/Pagination'
import { formatDateTimeToDDMMYYYY } from '../../../utils/formater'

const RoleTable = () => {
    // Search and status state
    const query = useRoleStore((s) => s.query)
    const setQuery = useRoleStore((s) => s.setQuery)
    const status = useRoleStore((s) => s.status)
    const setStatus = useRoleStore((s) => s.setStatus)
    const activeRoleId = useRoleStore((s) => s.activeRoleId)
    const setActiveRoleId = useRoleStore((s) => s.setActiveRoleId)
    const setIsAddingRole = useRoleStore((s) => s.setIsAddingRole)

    // Pagination state
    const page = useRoleStore((s) => s.page) || 1
    const setPage = useRoleStore((s) => s.setPage)
    const limit = useRoleStore((s) => s.limit) || 10
    const setLimit = useRoleStore((s) => s.setLimit)

    // Debounced search state
    const [localSearch, setLocalSearch] = useState(query || '')

    useEffect(() => {
        const handler = setTimeout(() => {
            setQuery(localSearch || null)
            setPage(1) // Reset to first page on search
        }, 300)
        return () => clearTimeout(handler)
    }, [localSearch, setQuery, setPage])

    // Fetch roles (react-query triggers automatically when filters/page/limit change)
    const { roles, isLoading, error, refetch, pagination } = useRoles()

    const handleSelectRole = (role: Role) => {
        setIsAddingRole(false)
        setActiveRoleId(role.id)
    }

    const handleRoleTypeClick = (filter: 'all' | 'system' | 'custom') => {
        setStatus(filter === 'all' ? null : filter)
        setPage(1)
    }

    const isSystemTab = (filter: 'all' | 'system' | 'custom') => {
        if (filter === 'all') return status === null
        return status === filter
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
                            placeholder="Search by role name..."
                            value={localSearch}
                            onChange={(e) => setLocalSearch(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 text-sm bg-surface-raised border border-border rounded-xl focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all placeholder:text-text-placeholder"
                        />
                    </div>

                    {/* Status tabs */}
                    <div className="flex items-center gap-1.5 bg-surface-raised border border-border p-1 rounded-xl self-start sm:self-auto">
                        {(['all', 'system', 'custom'] as const).map(
                            (filter) => (
                                <button
                                    key={filter}
                                    onClick={() => handleRoleTypeClick(filter)}
                                    className={[
                                        'px-3.5 py-1.5 rounded-lg text-xs font-semibold capitalize transition-all cursor-pointer',
                                        isSystemTab(filter)
                                            ? 'bg-white text-text-primary shadow-sm'
                                            : 'text-text-placeholder hover:text-text-secondary',
                                    ].join(' ')}
                                >
                                    {filter}
                                </button>
                            )
                        )}
                    </div>
                </div>
            </div>

            {/* User list table container */}
            <div className="overflow-auto min-h-0 flex-1">
                {isLoading ? (
                    <div className="flex flex-col items-center justify-center min-h-[400px] space-y-3">
                        <LoadingSpinner />
                        <p className="text-sm text-text-placeholder">
                            Loading roles...
                        </p>
                    </div>
                ) : error ? (
                    <div className="flex flex-col items-center justify-center min-h-[400px] text-center p-6 space-y-2">
                        <AlertCircle className="w-10 h-10 text-error" />
                        <h3 className="text-lg font-semibold text-text-primary">
                            Failed to load roles
                        </h3>
                        <p className="text-sm text-text-placeholder max-w-sm">
                            {error.message || 'An error occurred'}
                        </p>
                        <Button
                            variant="secondary"
                            size="sm"
                            onClick={() => refetch()}
                        >
                            Retry
                        </Button>
                    </div>
                ) : roles.length === 0 ? (
                    <div className="flex flex-col items-center justify-center min-h-[400px] text-center p-6 space-y-2">
                        <ShieldCheck className="w-10 h-10 text-text-placeholder" />
                        <h3 className="text-base font-semibold text-text-secondary">
                            No roles found
                        </h3>
                    </div>
                ) : (
                    <table className="w-full border-separate border-spacing-0 text-left">
                        <thead>
                            <tr className="text-text-secondary text-xs uppercase font-bold tracking-wider">
                                {/* Đưa sticky và bg-white vào từng thẻ th để làm nền cứng chặn text cuộn phía dưới */}
                                <th className="sticky top-0 z-10 bg-white border-b border-[#D4D7DE]/40 px-5 py-4 font-bold">
                                    ID
                                </th>
                                <th className="sticky top-0 z-10 bg-white border-b border-[#D4D7DE]/40 px-5 py-4 font-bold">
                                    Name
                                </th>
                                <th className="sticky top-0 z-10 bg-white border-b border-[#D4D7DE]/40 px-5 py-4 font-bold">
                                    Description
                                </th>
                                <th className="sticky top-0 z-10 bg-white border-b border-[#D4D7DE]/40 px-5 py-4 font-bold">
                                    Access Level
                                </th>
                                <th className="sticky top-0 z-10 bg-white border-b border-[#D4D7DE]/40 px-5 py-4 font-bold">
                                    Type
                                </th>
                                <th className="sticky top-0 z-10 bg-white border-b border-[#D4D7DE]/40 px-5 py-4 font-bold">
                                    Created At
                                </th>
                                <th className="sticky top-0 z-10 bg-white border-b border-[#D4D7DE]/40 px-5 py-4 font-bold">
                                    Updated At
                                </th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-[#D4D7DE]/40">
                            {roles.map((role) => {
                                const isSelected = activeRoleId === role.id

                                return (
                                    <tr
                                        key={role.id}
                                        onClick={() => handleSelectRole(role)}
                                        className={[
                                            'group cursor-pointer transition-colors duration-150',
                                            isSelected
                                                ? 'bg-primary/5 hover:bg-primary/5 border-l-4 border-primary'
                                                : 'hover:bg-bg/20',
                                        ].join(' ')}
                                    >
                                        {/* ID */}
                                        <td className="px-5 py-3.5 text-sm text-text-secondary font-mono">
                                            {role.id}
                                        </td>
                                        {/* Name */}
                                        <td className="px-5 py-3.5 text-sm text-text-secondary font-mono">
                                            {role.name}
                                        </td>
                                        {/* Description */}
                                        <td className="px-5 py-3.5 text-sm text-text-secondary">
                                            {role.description || ''}
                                        </td>
                                        <td className="px-5 py-3.5 text-sm text-text-secondary">
                                            {role?.access_level
                                                ?.charAt(0)
                                                .toUpperCase() +
                                                role?.access_level?.slice(1) ||
                                                ''}
                                        </td>
                                        {/* Status badge */}
                                        <td className="px-5 py-3.5">
                                            <Badge
                                                variant={
                                                    role.is_system
                                                        ? 'success'
                                                        : 'warning'
                                                }
                                                size="sm"
                                                dot
                                            >
                                                {role.is_system
                                                    ? 'System'
                                                    : 'Custom'}
                                            </Badge>
                                        </td>

                                        <td className="px-5 py-3.5 text-sm text-text-secondary">
                                            {formatDateTimeToDDMMYYYY(
                                                role.created_at
                                            )}
                                        </td>

                                        <td className="px-5 py-3.5 text-sm text-text-secondary">
                                            {formatDateTimeToDDMMYYYY(
                                                role.updated_at
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
            {!isLoading && !error && roles.length > 0 && pagination && (
                <div className="flex-shrink-0">
                    <Pagination
                        page={page}
                        limit={limit}
                        totalPages={pagination.total_pages}
                        totalItems={pagination.total}
                        onPageChange={setPage}
                        onLimitChange={setLimit}
                    />
                </div>
            )}
        </div>
    )
}

export default RoleTable
