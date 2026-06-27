import { useState, useEffect } from 'react'
import { Search, User as UserIcon, AlertCircle } from 'lucide-react'
import { useUserStore } from '../../store/usersStore'
import { useUsers } from '../../hooks/useUsers'
import { useSimpleDepartments } from '../../hooks/useSimpleDepartments'
import { useSimpleJobTitles } from '../../hooks/useSimpleJobTitles'
import { useSimpleRoles } from '../../hooks/useSimpleRoles'
import Button from '../ui/Button'
import Badge from '../ui/Badge'
import LoadingSpinner from '../ui/LoadingSpinner'
import SearchableSelect from '../ui/SearchableSelect'
import Pagination from '../ui/Pagination'
import type { User } from '../../types/user'
import { stringToLabel } from '../../../utils/utils'

const UserTable = () => {
    // Search and status state
    const query = useUserStore((s) => s.query)
    const setQuery = useUserStore((s) => s.setQuery)
    const status = useUserStore((s) => s.status)
    const setStatus = useUserStore((s) => s.setStatus)
    const activeUserId = useUserStore((s) => s.activeUserId)
    const setActiveUserId = useUserStore((s) => s.setActiveUserId)
    const setIsAddingUser = useUserStore((s) => s.setIsAddingUser)

    // Metadata filters state
    const departmentId = useUserStore((s) => s.departmentId)
    const setDepartmentId = useUserStore((s) => s.setDepartmentId)
    const jobTitleId = useUserStore((s) => s.jobTitleId)
    const setJobTitleId = useUserStore((s) => s.setJobTitleId)
    const roleId = useUserStore((s) => s.roleId)
    const setRoleId = useUserStore((s) => s.setRoleId)

    // Pagination state
    const page = useUserStore((s) => s.page) || 1
    const setPage = useUserStore((s) => s.setPage)
    const limit = useUserStore((s) => s.limit) || 10
    const setLimit = useUserStore((s) => s.setLimit)

    // Debounced search state
    const [localSearch, setLocalSearch] = useState(query || '')

    useEffect(() => {
        const handler = setTimeout(() => {
            setQuery(localSearch || null)
            setPage(1) // Reset to first page on search
        }, 300)
        return () => clearTimeout(handler)
    }, [localSearch, setQuery, setPage])

    // Fetch users (react-query triggers automatically when filters/page/limit change)
    const { users, isLoading, error, refetch, pagination } = useUsers()

    // Fetch metadata
    const { data: departmentsData } = useSimpleDepartments()
    const { data: jobTitlesData } = useSimpleJobTitles()
    const { data: rolesData } = useSimpleRoles()

    // Map metadata to select options
    const departmentOptions = [
        { value: null, label: 'All Departments' },
        ...(departmentsData || []).map((d) => ({ value: d.id, label: d.name })),
    ]

    const jobTitleOptions = [
        { value: null, label: 'All Job Titles' },
        ...(jobTitlesData || []).map((j) => ({
            value: j.id,
            label: j.title_name,
        })),
    ]

    const roleOptions = [
        { value: null, label: 'All Roles' },
        ...(rolesData || []).map((r) => ({ value: r.id, label: r.name })),
    ]

    const handleSelectUser = (user: User) => {
        setIsAddingUser(false)
        setActiveUserId(user.id)
    }

    const handleStatusClick = (filter: 'all' | 'active' | 'inactive') => {
        setStatus(filter === 'all' ? null : filter)
        setPage(1)
    }

    const isActiveTab = (filter: 'all' | 'active' | 'inactive') => {
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
                            placeholder="Search by name, code, email..."
                            value={localSearch}
                            onChange={(e) => setLocalSearch(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 text-sm bg-surface-raised border border-border rounded-xl focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all placeholder:text-text-placeholder"
                        />
                    </div>

                    {/* Status tabs */}
                    <div className="flex items-center gap-1.5 bg-surface-raised border border-border p-1 rounded-xl self-start sm:self-auto">
                        {(['all', 'active', 'inactive'] as const).map(
                            (filter) => (
                                <button
                                    key={filter}
                                    onClick={() => handleStatusClick(filter)}
                                    className={[
                                        'px-3.5 py-1.5 rounded-lg text-xs font-semibold capitalize transition-all cursor-pointer',
                                        isActiveTab(filter)
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

                {/* Metadata filters row */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <SearchableSelect
                        options={departmentOptions}
                        value={departmentId}
                        onChange={(val) => {
                            setDepartmentId(val)
                            setPage(1)
                        }}
                        placeholder="All Departments"
                    />
                    <SearchableSelect
                        options={jobTitleOptions}
                        value={jobTitleId}
                        onChange={(val) => {
                            setJobTitleId(val)
                            setPage(1)
                        }}
                        placeholder="All Job Titles"
                    />
                    <SearchableSelect
                        options={roleOptions}
                        value={roleId}
                        onChange={(val) => {
                            setRoleId(val)
                            setPage(1)
                        }}
                        placeholder="All Roles"
                    />
                </div>
            </div>

            {/* User list table container */}
            <div className="overflow-auto min-h-0 flex-1">
                {isLoading ? (
                    <div className="flex flex-col items-center justify-center min-h-[400px] space-y-3">
                        <LoadingSpinner />
                        <p className="text-sm text-text-placeholder">
                            Loading accounts...
                        </p>
                    </div>
                ) : error ? (
                    <div className="flex flex-col items-center justify-center min-h-[400px] text-center p-6 space-y-2">
                        <AlertCircle className="w-10 h-10 text-error" />
                        <h3 className="text-lg font-semibold text-text-primary">
                            Failed to load accounts
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
                ) : users.length === 0 ? (
                    <div className="flex flex-col items-center justify-center min-h-[400px] text-center p-6 space-y-2">
                        <UserIcon className="w-10 h-10 text-text-placeholder" />
                        <h3 className="text-base font-semibold text-text-secondary">
                            No accounts found
                        </h3>
                        <p className="text-sm text-text-placeholder max-w-xs">
                            Try adjusting your search query or filters.
                        </p>
                    </div>
                ) : (
                    <table className="w-full border-separate border-spacing-0 text-left">
                        <thead>
                            <tr className="text-text-secondary text-xs uppercase font-bold tracking-wider">
                                {/* Đưa sticky và bg-white vào từng thẻ th để làm nền cứng chặn text cuộn phía dưới */}
                                <th className="sticky top-0 z-10 bg-white border-b border-[#D4D7DE]/40 px-5 py-4 font-bold">
                                    No.
                                </th>
                                <th className="sticky top-0 z-10 bg-white border-b border-[#D4D7DE]/40 px-5 py-4 font-bold">
                                    Full Name
                                </th>
                                <th className="sticky top-0 z-10 bg-white border-b border-[#D4D7DE]/40 px-5 py-4 font-bold">
                                    Employee Code
                                </th>
                                <th className="sticky top-0 z-10 bg-white border-b border-[#D4D7DE]/40 px-5 py-4 font-bold">
                                    Email
                                </th>
                                <th className="sticky top-0 z-10 bg-white border-b border-[#D4D7DE]/40 px-5 py-4 font-bold">
                                    Roles
                                </th>
                                <th className="sticky top-0 z-10 bg-white border-b border-[#D4D7DE]/40 px-5 py-4 font-bold">
                                    Status
                                </th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-[#D4D7DE]/40">
                            {users.map((user, index) => {
                                const isSelected = activeUserId === user.id

                                return (
                                    <tr
                                        key={user.id}
                                        onClick={() => handleSelectUser(user)}
                                        className={[
                                            'group cursor-pointer transition-colors duration-150',
                                            isSelected
                                                ? 'bg-primary/5 hover:bg-primary/5 border-l-4 border-primary'
                                                : 'hover:bg-bg/20',
                                        ].join(' ')}
                                    >
                                        <td className="px-5 py-3.5 text-sm text-text-secondary">
                                            {(page - 1) * limit + index + 1}
                                        </td>
                                        {/* User Identity cell */}
                                        <td className="px-5 py-3.5">
                                            <p className="text-sm font-semibold text-text-primary group-hover:text-primary transition-colors">
                                                {user.full_name}
                                            </p>
                                            {user.last_login && (
                                                <p className="text-[10px] text-text-placeholder mt-0.5">
                                                    Last login:{' '}
                                                    {new Date(
                                                        user.last_login
                                                    ).toLocaleDateString()}
                                                </p>
                                            )}
                                        </td>
                                        {/* Code */}
                                        <td className="px-5 py-3.5 text-sm text-text-secondary">
                                            {user.employee_code}
                                        </td>
                                        {/* Email */}
                                        <td className="px-5 py-3.5 text-sm text-text-secondary">
                                            {user.email || (
                                                <span className="italic text-text-placeholder">
                                                    No email
                                                </span>
                                            )}
                                        </td>
                                        {/* Roles */}
                                        <td className="px-5 py-3.5 text-sm text-text-secondary">
                                            {user?.roles
                                                ?.map((role) =>
                                                    stringToLabel(role.name)
                                                )
                                                .join(', ') || 'Employee'}
                                        </td>
                                        {/* Status badge */}
                                        <td className="px-5 py-3.5">
                                            <Badge
                                                variant={
                                                    user.is_active
                                                        ? 'success'
                                                        : 'error'
                                                }
                                                size="sm"
                                                dot
                                            >
                                                {user.is_active
                                                    ? 'Active'
                                                    : 'Inactive'}
                                            </Badge>
                                        </td>
                                    </tr>
                                )
                            })}
                        </tbody>
                    </table>
                )}
            </div>

            {/* Pagination controls at footer */}
            {!isLoading && !error && users.length > 0 && pagination && (
                <div className="flex-shrink-0">
                    <Pagination
                        page={page}
                        limit={limit}
                        totalPages={pagination.total_pages}
                        totalItems={pagination.total}
                        unit="accounts"
                        onPageChange={setPage}
                        onLimitChange={setLimit}
                    />
                </div>
            )}
        </div>
    )
}

export default UserTable
