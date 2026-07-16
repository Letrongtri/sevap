import { AlertCircle, ShieldCheck } from 'lucide-react'
import Button from '../ui/Button'
import LoadingSpinner from '../ui/LoadingSpinner'
import Pagination from '../ui/Pagination'
import { useTenantLogStore } from '../../store/tenantLogStore'
import { useTenantLogs } from '../../hooks/useTenantLog'
import TenantLogFilters from './TenantLogFilters'
import TenantLogTable from './TenantLogTable'

const TenantLogList = () => {
    // Filter state from store
    const filters = useTenantLogStore((s) => s.filters)
    const setPage = useTenantLogStore((s) => s.setPage)
    const setLimit = useTenantLogStore((s) => s.setLimit)

    // Pagination state
    const page = filters.page || 1
    const limit = filters.limit || 10

    const { tenantLogs, isLoading, error, refetch, pagination } =
        useTenantLogs()

    return (
        <div className="bg-white rounded-2xl border border-[#D4D7DE]/60 shadow-sm overflow-hidden flex flex-col h-full">
            {/* Search & filters bar */}
            <div className="p-4 border-b border-[#D4D7DE]/40 flex flex-col gap-3 bg-bg/20 flex-shrink-0">
                <TenantLogFilters />
            </div>

            {/* User list table container */}
            <div className="overflow-auto min-h-0 flex-1">
                {isLoading ? (
                    <div className="flex flex-col items-center justify-center min-h-[400px] space-y-3">
                        <LoadingSpinner />
                        <p className="text-sm text-text-placeholder">
                            Loading activity logs...
                        </p>
                    </div>
                ) : error ? (
                    <div className="flex flex-col items-center justify-center min-h-[400px] text-center p-6 space-y-2">
                        <AlertCircle className="w-10 h-10 text-error" />
                        <h3 className="text-lg font-semibold text-text-primary">
                            Failed to load activity logs
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
                ) : tenantLogs.length === 0 ? (
                    <div className="flex flex-col items-center justify-center min-h-[400px] text-center p-6 space-y-2">
                        <ShieldCheck className="w-10 h-10 text-text-placeholder" />
                        <h3 className="text-base font-semibold text-text-secondary">
                            No activity logs found
                        </h3>
                    </div>
                ) : (
                    <TenantLogTable tenantLogs={tenantLogs} />
                )}
            </div>

            {/* Pagination controls at footer */}
            {!isLoading && !error && tenantLogs.length > 0 && pagination && (
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

export default TenantLogList
