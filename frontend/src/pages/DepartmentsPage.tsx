import DepartmentDetail from '../components/department/DepartmentDetail'
import DepartmentTable from '../components/department/DepartmentTable'
import Header from '../components/ui/Header'
import { useDepartmentStore } from '../store/departmentStore'
import { usePageTitle } from '../hooks/usePageTitle'

export default function DepartmentsPage() {
    usePageTitle('Quản lý phòng ban')
    const activeDepartmentId = useDepartmentStore((s) => s.activeDepartmentId)
    const isAddingDepartment = useDepartmentStore((s) => s.isAddingDepartment)
    const showDetail = activeDepartmentId !== null || isAddingDepartment
    const setIsAddingDepartment = useDepartmentStore(
        (s) => s.setIsAddingDepartment
    )
    const setActiveDepartmentId = useDepartmentStore(
        (s) => s.setActiveDepartmentId
    )

    const handleStartAddDepartment = () => {
        setActiveDepartmentId(null)
        setIsAddingDepartment(true)
    }

    return (
        <div className="h-full flex flex-col gap-4 overflow-hidden">
            {/* Header section */}
            <div className="flex-shrink-0">
                <Header
                    title="Quản lý phòng ban"
                    isAdding={isAddingDepartment}
                    onAdd={handleStartAddDepartment}
                    btnTitle="Thêm phòng ban"
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
                    <DepartmentTable />
                </div>

                {/* Right side: Selected department details or add department card */}
                {showDetail && (
                    <div className="lg:col-span-5 xl:col-span-4 bg-white rounded-2xl border border-[#D4D7DE]/60 shadow-lg relative animate-slide-in-right flex flex-col h-full overflow-hidden">
                        <DepartmentDetail
                            key={activeDepartmentId || 'adding'}
                        />
                    </div>
                )}
            </div>
        </div>
    )
}
