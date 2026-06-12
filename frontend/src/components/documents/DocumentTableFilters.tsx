import { useEffect, useState } from 'react'
import { Search } from 'lucide-react'

import { useDocumentStore } from '../../store/documentStore'
import { useSimpleDepartments } from '../../hooks/useSimpleDepartments'
import { useSimpleRoles } from '../../hooks/useSimpleRoles'
import { ACCESS_LEVELS } from '../../types/common'

import SearchableSelect from '../ui/SearchableSelect'
import DatePicker from '../ui/DatePicker'
import SearchableUserSelect from '../ui/SearchableUserSelect'

const DocumentTableFilters = () => {
    // Search and status state
    const query = useDocumentStore((d) => d.query)
    const setQuery = useDocumentStore((d) => d.setQuery)
    const departmentId = useDocumentStore((d) => d.departmentId)
    const setDepartmentId = useDocumentStore((d) => d.setDepartmentId)
    const accessLevel = useDocumentStore((d) => d.accessLevel)
    const setAccessLevel = useDocumentStore((d) => d.setAccessLevel)
    const effectiveDate = useDocumentStore((d) => d.effectiveDate)
    const setEffectiveDate = useDocumentStore((d) => d.setEffectiveDate)
    const roleAccess = useDocumentStore((d) => d.roleAccess)
    const setRoleAccess = useDocumentStore((d) => d.setRoleAccess)
    const targetUserId = useDocumentStore((d) => d.targetUserId)
    const setTargetUserId = useDocumentStore((d) => d.setTargetUserId)

    const setPage = useDocumentStore((d) => d.setPage)

    // Debounced search state
    const [localSearch, setLocalSearch] = useState(query || '')

    useEffect(() => {
        const handler = setTimeout(() => {
            setQuery(localSearch || null)
            setPage(1) // Reset to first page on search
        }, 300)
        return () => clearTimeout(handler)
    }, [localSearch, setQuery, setPage])

    // Fetch metadata
    const { data: departmentsData } = useSimpleDepartments()
    const { data: rolesData } = useSimpleRoles()

    // Map metadata to select options
    const departmentOptions = [
        { value: null, label: 'All Departments' },
        ...(departmentsData || []).map((d) => ({ value: d.id, label: d.name })),
    ]

    const access_level_options = [
        { value: null, label: 'All Access Levels' },
        ...ACCESS_LEVELS.map((l) => ({
            value: l.toLowerCase(),
            label: l,
        })),
    ]

    const roleOptions = [
        { value: null, label: 'All Roles' },
        ...(rolesData || []).map((r) => ({ value: r.id, label: r.name })),
    ]

    return (
        <div className="p-4 border-b border-[#D4D7DE]/40 flex flex-col gap-4 bg-bg/20 flex-shrink-0">
            {/* Search query & Status filter row */}
            <div className="flex flex-col sm:flex-row gap-3 justify-between items-stretch sm:items-center">
                {/* Search bar */}
                <div className="relative flex-1 max-w-md">
                    <Search className="w-4 h-4 text-text-placeholder absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                        type="text"
                        placeholder="Search by title, file name, category,..."
                        value={localSearch}
                        onChange={(e) => setLocalSearch(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 text-sm bg-surface-raised border border-border rounded-xl focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all placeholder:text-text-placeholder"
                    />
                </div>

                {/* effective date, users */}
                <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center">
                    <DatePicker
                        value={effectiveDate}
                        onChange={(val) => {
                            setEffectiveDate(val)
                            setPage(1)
                        }}
                        placeholder="Effective Date"
                        className="w-full sm:w-44"
                    />
                    <SearchableUserSelect
                        value={targetUserId}
                        onChange={(val) => {
                            setTargetUserId(val)
                            setPage(1)
                        }}
                        placeholder="Select Account..."
                        className="w-full sm:w-56"
                    />
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
                    options={access_level_options}
                    value={accessLevel}
                    onChange={(val) => {
                        setAccessLevel(val)
                        setPage(1)
                    }}
                    placeholder="All Access Level"
                />
                <SearchableSelect
                    options={roleOptions}
                    value={roleAccess}
                    onChange={(val) => {
                        setRoleAccess(val)
                        setPage(1)
                    }}
                    placeholder="All Roles"
                />
            </div>
        </div>
    )
}

export default DocumentTableFilters
