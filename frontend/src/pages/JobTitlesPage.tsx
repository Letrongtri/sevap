import JobTitleDetail from '../components/jobTitle/JobTitleDetail'
import JobTitleTable from '../components/jobTitle/JobTitleTable'
import Header from '../components/ui/Header'
import { useJobTitleStore } from '../store/jobTitleStore'

export default function JobTitlesPage() {
    const activeJobTitleId = useJobTitleStore((s) => s.activeJobTitleId)
    const isAddingJobTitle = useJobTitleStore((s) => s.isAddingJobTitle)
    const showDetail = activeJobTitleId !== null || isAddingJobTitle
    const setIsAddingJobTitle = useJobTitleStore((s) => s.setIsAddingJobTitle)
    const setActiveJobTitleId = useJobTitleStore((s) => s.setActiveJobTitleId)

    const handleStartAddDepartment = () => {
        setActiveJobTitleId(null)
        setIsAddingJobTitle(true)
    }

    return (
        <div className="h-full flex flex-col gap-4 overflow-hidden">
            {/* Header section */}
            <div className="flex-shrink-0">
                <Header
                    title="Job Title Management"
                    isAdding={isAddingJobTitle}
                    onAdd={handleStartAddDepartment}
                    btnTitle="Add Job Title"
                />
            </div>

            {/* Filter and Content layout */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-stretch flex-1 overflow-hidden">
                {/* Left side: roles table list */}
                <div
                    className={[
                        'transition-all duration-300 ease-in-out h-full overflow-hidden flex flex-col',
                        showDetail
                            ? 'lg:col-span-7 xl:col-span-8'
                            : 'lg:col-span-12',
                    ].join(' ')}
                >
                    <JobTitleTable />
                </div>

                {/* Right side: Selected department details or add department card */}
                {showDetail && (
                    <div className="lg:col-span-5 xl:col-span-4 bg-white rounded-2xl border border-[#D4D7DE]/60 shadow-lg relative animate-slide-in-right flex flex-col h-full overflow-hidden">
                        <JobTitleDetail key={activeJobTitleId || 'adding'} />
                    </div>
                )}
            </div>
        </div>
    )
}
