import { ChevronLeft, ChevronRight } from 'lucide-react'

interface PaginationProps {
    page: number
    limit: number
    totalPages: number
    totalItems: number
    unit?: string
    onPageChange: (page: number) => void
    onLimitChange: (limit: number) => void
}

export default function Pagination({
    page,
    limit,
    totalPages,
    totalItems,
    unit = 'items',
    onPageChange,
    onLimitChange,
}: PaginationProps) {
    if (totalPages <= 0) return null

    // Helper to generate page numbers list
    const getPageNumbers = () => {
        // Nếu tổng số trang ít (ví dụ <= 7), hiển thị tất cả
        if (totalPages <= 7) {
            return Array.from({ length: totalPages }, (_, i) => i + 1)
        }

        // Nếu đang ở những trang đầu (<= 4)
        if (page <= 4) {
            return [1, 2, 3, 4, 5, '...', totalPages]
        }

        // Nếu đang ở những trang cuối (>= totalPages - 3)
        if (page >= totalPages - 3) {
            return [
                1,
                '...',
                totalPages - 4,
                totalPages - 3,
                totalPages - 2,
                totalPages - 1,
                totalPages,
            ]
        }

        // Nếu đang ở những trang khoảng giữa
        return [1, '...', page - 1, page, page + 1, '...', totalPages]
    }

    const handlePrev = () => {
        if (page > 1) onPageChange(page - 1)
    }

    const handleNext = () => {
        if (page < totalPages) onPageChange(page + 1)
    }

    return (
        <div className="flex flex-wrap items-center justify-end gap-3.5 px-6 py-4 border-t border-[#D4D7DE]/40 bg-bg/5 select-none font-medium text-xs text-text-secondary">
            {/* Total items count display */}
            <span className="mr-auto text-text-placeholder">
                Total {totalItems} {unit}
            </span>

            {/* Pagination Controls Wrapper */}
            <div className="flex items-center gap-1.5">
                {/* Previous Button */}
                <button
                    type="button"
                    disabled={page === 1}
                    onClick={handlePrev}
                    className="p-1 rounded-lg text-text-secondary hover:bg-bg/25 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition-colors"
                >
                    <ChevronLeft className="w-4 h-4" />
                </button>

                {/* Page Numbers */}
                {getPageNumbers().map((p, index) => {
                    if (p === '...') {
                        return (
                            <span
                                key={`ellipsis-${index}`}
                                className="w-7 h-7 flex items-center justify-center text-text-placeholder text-xs font-semibold select-none"
                            >
                                ...
                            </span>
                        )
                    }

                    const isActive = p === page
                    return (
                        <button
                            key={p}
                            type="button"
                            onClick={() => onPageChange(p as number)}
                            className={[
                                'w-7 h-7 flex items-center justify-center rounded-full text-xs font-semibold transition-all cursor-pointer',
                                isActive
                                    ? 'bg-primary/10 border border-primary text-primary shadow-sm'
                                    : 'text-text-secondary hover:bg-bg/25',
                            ].join(' ')}
                        >
                            {p}
                        </button>
                    )
                })}

                {/* Next Button */}
                <button
                    type="button"
                    disabled={page === totalPages}
                    onClick={handleNext}
                    className="p-1 rounded-lg text-text-secondary hover:bg-bg/25 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition-colors"
                >
                    <ChevronRight className="w-4 h-4" />
                </button>
            </div>

            {/* Limit Selector */}
            <div className="relative">
                <select
                    value={limit}
                    onChange={(e) => onLimitChange(Number(e.target.value))}
                    className="appearance-none pl-3 pr-7 py-1 bg-white border border-border text-text-secondary text-xs font-semibold rounded-full outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 cursor-pointer hover:border-text-placeholder transition-all"
                >
                    <option value={10}>10 / page</option>
                    <option value={20}>20 / page</option>
                    <option value={50}>50 / page</option>
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-2 flex items-center text-text-placeholder">
                    {/* Native arrow replacement with Lucide styling on wrapper */}
                    <svg
                        className="w-3.5 h-3.5 fill-current"
                        viewBox="0 0 20 20"
                    >
                        <path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" />
                    </svg>
                </div>
            </div>
        </div>
    )
}
