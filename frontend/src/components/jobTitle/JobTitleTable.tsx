import { useState, useEffect } from 'react'
import { useJobTitleStore } from '../../store/jobTitleStore'
import { useJobTitles } from '../../hooks/useJobTitles'
import type { JobTitle } from '../../types/jobTitle'
import { AlertCircle, Search, ShieldCheck } from 'lucide-react'
import LoadingSpinner from '../ui/LoadingSpinner'
import Button from '../ui/Button'
import Pagination from '../ui/Pagination'
import { formatDateTimeToDDMMYYYY } from '../../../utils/formater'

const JobTitleTable = () => {
    // Search and status state
    const query = useJobTitleStore((s) => s.query)
    const setQuery = useJobTitleStore((s) => s.setQuery)
    const activeJobTitleId = useJobTitleStore((s) => s.activeJobTitleId)
    const setActiveJobTitleId = useJobTitleStore((s) => s.setActiveJobTitleId)
    const setIsAddingJobTitle = useJobTitleStore((s) => s.setIsAddingJobTitle)

    // Pagination state
    const page = useJobTitleStore((s) => s.page) || 1
    const setPage = useJobTitleStore((s) => s.setPage)
    const limit = useJobTitleStore((s) => s.limit) || 10
    const setLimit = useJobTitleStore((s) => s.setLimit)

    // Debounced search state
    const [localSearch, setLocalSearch] = useState(query || '')

    useEffect(() => {
        const handler = setTimeout(() => {
            setQuery(localSearch || null)
            setPage(1) // Reset to first page on search
        }, 300)
        return () => clearTimeout(handler)
    }, [localSearch, setQuery, setPage])

    // Fetch jobTitles (react-query triggers automatically when filters/page/limit change)
    const { jobTitles, isLoading, error, refetch, pagination } = useJobTitles()

    const handleSelectJobTitle = (jobTitle: JobTitle) => {
        setIsAddingJobTitle(false)
        setActiveJobTitleId(jobTitle.id)
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
                            placeholder="Search by jobTitle name or code..."
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
                            Loading job titles...
                        </p>
                    </div>
                ) : error ? (
                    <div className="flex flex-col items-center justify-center min-h-[400px] text-center p-6 space-y-2">
                        <AlertCircle className="w-10 h-10 text-error" />
                        <h3 className="text-lg font-semibold text-text-primary">
                            Failed to load job titles
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
                ) : jobTitles.length === 0 ? (
                    <div className="flex flex-col items-center justify-center min-h-[400px] text-center p-6 space-y-2">
                        <ShieldCheck className="w-10 h-10 text-text-placeholder" />
                        <h3 className="text-base font-semibold text-text-secondary">
                            No job titles found
                        </h3>
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
                                    Name
                                </th>
                                <th className="sticky top-0 z-10 bg-white border-b border-[#D4D7DE]/40 px-5 py-4 font-bold">
                                    Code
                                </th>
                                <th className="sticky top-0 z-10 bg-white border-b border-[#D4D7DE]/40 px-5 py-4 font-bold">
                                    Description
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
                            {jobTitles.map((jobTitle, index) => {
                                const isSelected =
                                    activeJobTitleId === jobTitle.id

                                return (
                                    <tr
                                        key={jobTitle.id}
                                        onClick={() =>
                                            handleSelectJobTitle(jobTitle)
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
                                            {jobTitle.title_name}
                                        </td>
                                        <td className="px-5 py-3.5 text-sm text-text-secondary">
                                            {jobTitle.code}
                                        </td>
                                        {/* Description */}
                                        <td className="px-5 py-3.5 text-sm text-text-secondary">
                                            {jobTitle.description || ''}
                                        </td>

                                        <td className="px-5 py-3.5 text-sm text-text-secondary">
                                            {formatDateTimeToDDMMYYYY(
                                                jobTitle.created_at
                                            )}
                                        </td>

                                        <td className="px-5 py-3.5 text-sm text-text-secondary">
                                            {formatDateTimeToDDMMYYYY(
                                                jobTitle.updated_at
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
            {!isLoading && !error && jobTitles.length > 0 && pagination && (
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

export default JobTitleTable
