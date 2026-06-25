import { AlertCircle, Briefcase } from 'lucide-react'
import { useDirectoryStore } from '../../store/directoryStore'
import { DirectoryTab } from '../../types/directory'
import { useDirectoryJobTitles } from '../../hooks/useDirectory'
import LoadingSpinner from '../ui/LoadingSpinner'
import Button from '../ui/Button'
import Pagination from '../ui/Pagination'

const JobTitleDirectoryTable = () => {
    const activeTab = useDirectoryStore((s) => s.activeTab)
    const page = useDirectoryStore((s) => s.page) || 1
    const setPage = useDirectoryStore((s) => s.setPage)
    const limit = useDirectoryStore((s) => s.limit) || 10
    const setLimit = useDirectoryStore((s) => s.setLimit)

    const { data, isLoading, error, refetch } = useDirectoryJobTitles({
        enabled: activeTab === DirectoryTab.JobTitles,
    })

    const jobTitles = data?.job_titles || []
    const pagination = data?.pagination

    if (isLoading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[400px] space-y-3">
                <LoadingSpinner />
                <p className="text-sm text-text-placeholder">
                    Loading job titles...
                </p>
            </div>
        )
    }

    if (error) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[400px] text-center p-6 space-y-2">
                <AlertCircle className="w-10 h-10 text-error" />
                <h3 className="text-lg font-semibold text-text-primary">
                    Failed to load job titles
                </h3>
                <p className="text-sm text-text-placeholder max-w-sm">
                    {error instanceof Error
                        ? error.message
                        : 'An error occurred'}
                </p>
                <Button variant="secondary" size="sm" onClick={() => refetch()}>
                    Retry
                </Button>
            </div>
        )
    }

    if (jobTitles.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[400px] text-center p-6 space-y-2">
                <Briefcase className="w-10 h-10 text-text-placeholder" />
                <h3 className="text-base font-semibold text-text-secondary">
                    No job titles found
                </h3>
                <p className="text-sm text-text-placeholder max-w-xs">
                    Try adjusting your search query.
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
                                No.
                            </th>
                            <th className="sticky top-0 z-10 bg-white border-b border-[#D4D7DE]/40 px-5 py-4 font-bold">
                                Code
                            </th>
                            <th className="sticky top-0 z-10 bg-white border-b border-[#D4D7DE]/40 px-5 py-4 font-bold">
                                Title Name
                            </th>
                            <th className="sticky top-0 z-10 bg-white border-b border-[#D4D7DE]/40 px-5 py-4 font-bold">
                                Description
                            </th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-[#D4D7DE]/40">
                        {jobTitles.map((job, index) => (
                            <tr
                                key={job.id}
                                className="group hover:bg-bg/20 transition-colors duration-150"
                            >
                                <td className="px-5 py-3.5 text-sm text-text-secondary font-mono">
                                    {(page - 1) * limit + index + 1}
                                </td>
                                <td className="px-5 py-3.5 text-sm text-text-secondary font-mono">
                                    {job.code}
                                </td>
                                <td className="px-5 py-3.5 text-sm font-semibold text-text-primary group-hover:text-primary transition-colors">
                                    {job.title_name}
                                </td>
                                <td className="px-5 py-3.5 text-sm text-text-secondary max-w-[300px] truncate">
                                    {job.description || (
                                        <span className="italic text-text-placeholder">
                                            No description
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
                        onPageChange={setPage}
                        onLimitChange={setLimit}
                    />
                </div>
            )}
        </div>
    )
}

export default JobTitleDirectoryTable
