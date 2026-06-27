import { useJobTitleStore } from '../../store/jobTitleStore'
import { X } from 'lucide-react'
import { useJobTitles } from '../../hooks/useJobTitles'
import DetailJobTitleForm from './DetailJobTitleForm'

const JobTitleDetail = () => {
    const activeJobTitleId = useJobTitleStore((s) => s.activeJobTitleId)
    const setActiveJobTitleId = useJobTitleStore((s) => s.setActiveJobTitleId)
    const isAddingJobTitle = useJobTitleStore((s) => s.isAddingJobTitle)
    const setIsAddingJobTitle = useJobTitleStore((s) => s.setIsAddingJobTitle)

    const { jobTitles } = useJobTitles()
    const selectedJobTitle = jobTitles.find((d) => d.id === activeJobTitleId)

    const handleCloseCard = () => {
        setActiveJobTitleId(null)
        setIsAddingJobTitle(false)
    }

    return (
        <div className="flex flex-col h-full relative">
            {/* Close button X */}
            <div className="px-6 py-4 border-b border-[#D4D7DE]/40 flex-shrink-0 relative">
                {/* Nút đóng X */}
                <button
                    onClick={handleCloseCard}
                    title="Close detail panel"
                    className="absolute top-3 right-3 p-1.5 rounded-lg text-text-placeholder hover:text-text-primary hover:bg-bg transition-all duration-150 z-20 cursor-pointer"
                >
                    <X className="w-5 h-5" />
                </button>

                {/* Tiêu đề động tự đổi chữ tùy thuộc vào state đang Add hay View Detail */}
                <h2 className="text-lg font-bold text-text-primary">
                    {isAddingJobTitle
                        ? 'Add New Job Title'
                        : selectedJobTitle
                          ? 'Job Title Information'
                          : ''}
                </h2>
            </div>

            {/* ─── PHẦN 2: NỘI DUNG INPUTS ĐƯỢC PHÉP SCROLL (SCROLLABLE CONTENT) ─── */}
            <div className="flex-1 overflow-y-auto p-6 pt-4 scrollbar-thin">
                {(isAddingJobTitle || selectedJobTitle) && (
                    <DetailJobTitleForm
                        key={selectedJobTitle?.id ?? 'new-job-title'}
                        selectedJobTitle={selectedJobTitle ?? null}
                        onCloseCard={handleCloseCard}
                    />
                )}
            </div>
        </div>
    )
}

export default JobTitleDetail
