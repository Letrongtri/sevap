import { useEffect, useState } from 'react'
import SearchableSelect from '../ui/SearchableSelect'
import SearchableUserSelect from '../ui/SearchableUserSelect'
import DatePicker from '../ui/DatePicker'
import { useTenantLogStore } from '../../store/tenantLogStore'
import { Search, SlidersHorizontal, X } from 'lucide-react'
import { LOG_LEVELS } from '../../types/common'
import { stringToLabel } from '../../../utils/utils'

const TenantLogFilters = () => {
    const filters = useTenantLogStore((s) => s.filters)
    const setAction = useTenantLogStore((s) => s.setAction)
    const setResource = useTenantLogStore((s) => s.setResource)
    const setUserId = useTenantLogStore((s) => s.setUserId)
    const setLogLevel = useTenantLogStore((s) => s.setLogLevel)
    const setStartDate = useTenantLogStore((s) => s.setStartDate)
    const setEndDate = useTenantLogStore((s) => s.setEndDate)
    const clearFilters = useTenantLogStore((s) => s.clearFilters)
    const setPage = useTenantLogStore((s) => s.setPage)

    // Local debounced text inputs
    const [localAction, setLocalAction] = useState(filters.action || '')
    const [localResource, setLocalResource] = useState(filters.resource || '')

    useEffect(() => {
        const handler = setTimeout(() => {
            setAction(localAction || null)
            setPage(1)
        }, 400)
        return () => clearTimeout(handler)
    }, [localAction, setAction, setPage])

    useEffect(() => {
        const handler = setTimeout(() => {
            setResource(localResource || null)
            setPage(1)
        }, 400)
        return () => clearTimeout(handler)
    }, [localResource, setResource, setPage])

    // Check if any filter is active
    const hasActiveFilters =
        !!filters.action ||
        !!filters.resource ||
        !!filters.user_id ||
        !!filters.log_level ||
        !!filters.start_date ||
        !!filters.end_date

    const handleClearFilters = () => {
        setLocalAction('')
        setLocalResource('')
        clearFilters()
    }

    const logLevels = LOG_LEVELS.map((level) => ({
        value: level,
        label: stringToLabel(level),
    }))
    return (
        <>
            {/* Row 1: Action + Resource text inputs */}
            <div className="flex flex-col sm:flex-row gap-3 items-stretch">
                {/* Action filter */}
                <div className="relative flex-1">
                    <Search className="w-3.5 h-3.5 text-text-placeholder absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input
                        type="text"
                        placeholder="Filter by action..."
                        value={localAction}
                        onChange={(e) => setLocalAction(e.target.value)}
                        className="w-full pl-8.5 pr-8 py-2 text-xs bg-surface-raised border border-border rounded-xl focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all placeholder:text-text-placeholder"
                    />
                    {localAction && (
                        <button
                            onClick={() => setLocalAction('')}
                            className="absolute right-2.5 top-1/2 -translate-y-1/2 p-0.5 text-text-placeholder hover:text-text-secondary transition-colors"
                        >
                            <X className="w-3 h-3" />
                        </button>
                    )}
                </div>

                {/* Resource filter */}
                <div className="relative flex-1">
                    <Search className="w-3.5 h-3.5 text-text-placeholder absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input
                        type="text"
                        placeholder="Filter by resource..."
                        value={localResource}
                        onChange={(e) => setLocalResource(e.target.value)}
                        className="w-full pl-8.5 pr-8 py-2 text-xs bg-surface-raised border border-border rounded-xl focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all placeholder:text-text-placeholder"
                    />
                    {localResource && (
                        <button
                            onClick={() => setLocalResource('')}
                            className="absolute right-2.5 top-1/2 -translate-y-1/2 p-0.5 text-text-placeholder hover:text-text-secondary transition-colors"
                        >
                            <X className="w-3 h-3" />
                        </button>
                    )}
                </div>

                {/* Log level filter */}
                <div className="w-40">
                    <SearchableSelect
                        options={logLevels}
                        value={filters.log_level ?? null}
                        onChange={(val) => {
                            setLogLevel(val)
                            setPage(1)
                        }}
                        placeholder="Log level"
                        size="sm"
                    />
                </div>
            </div>

            {/* Row 2: Log level, Date range, Sort order + Clear */}
            <div className="flex flex-wrap gap-3 items-center">
                {/* User filter */}
                <div className="flex-1 min-w-0">
                    <SearchableUserSelect
                        value={filters.user_id ?? null}
                        onChange={(val) => {
                            setUserId(val as string | null)
                            setPage(1)
                        }}
                        placeholder="Filter by user..."
                        size="sm"
                    />
                </div>

                {/* Start date */}
                <div className="w-50">
                    <DatePicker
                        value={filters.start_date ?? null}
                        onChange={(val) => {
                            setStartDate(val)
                            setPage(1)
                        }}
                        placeholder="From date"
                        size="sm"
                    />
                </div>

                {/* End date */}
                <div className="w-50">
                    <DatePicker
                        value={filters.end_date ?? null}
                        onChange={(val) => {
                            setEndDate(val)
                            setPage(1)
                        }}
                        placeholder="To date"
                        size="sm"
                    />
                </div>

                {/* Clear filters */}
                {hasActiveFilters && (
                    <button
                        onClick={handleClearFilters}
                        className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-error hover:bg-error-bg rounded-xl transition-colors border border-error-border"
                    >
                        <SlidersHorizontal className="w-3 h-3" />
                        Clear filters
                    </button>
                )}
            </div>
        </>
    )
}

export default TenantLogFilters
