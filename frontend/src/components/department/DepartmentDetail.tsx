import { useDepartmentStore } from '../../store/departmentStore'
import { X } from 'lucide-react'
import { useDepartments } from '../../hooks/useDepartments'
import DetailDepartmentForm from './DetailDepartmentForm'

const DepartmentDetail = () => {
    const activeDepartmentId = useDepartmentStore((s) => s.activeDepartmentId)
    const setActiveDepartmentId = useDepartmentStore(
        (s) => s.setActiveDepartmentId
    )
    const isAddingDepartment = useDepartmentStore((s) => s.isAddingDepartment)
    const setIsAddingDepartment = useDepartmentStore(
        (s) => s.setIsAddingDepartment
    )

    const { departments } = useDepartments()
    const selectedDepartment = departments.find(
        (d) => d.id === activeDepartmentId
    )

    const handleCloseCard = () => {
        setActiveDepartmentId(null)
        setIsAddingDepartment(false)
    }

    return (
        <div className="flex flex-col h-full relative">
            {/* Close button X */}
            <div className="px-6 py-4 border-b border-[#D4D7DE]/40 flex-shrink-0 relative">
                {/* Nút đóng X */}
                <button
                    onClick={handleCloseCard}
                    title="Đóng bảng chi tiết"
                    className="absolute top-3 right-3 p-1.5 rounded-lg text-text-placeholder hover:text-text-primary hover:bg-bg transition-all duration-150 z-20 cursor-pointer"
                >
                    <X className="w-5 h-5" />
                </button>

                {/* Tiêu đề động tự đổi chữ tùy thuộc vào state đang Add hay View Detail */}
                <h2 className="text-lg font-bold text-text-primary">
                    {isAddingDepartment
                        ? 'Thêm phòng ban mới'
                        : selectedDepartment
                          ? 'Thông tin phòng ban'
                          : ''}
                </h2>
            </div>

            {/* ─── PHẦN 2: NỘI DUNG INPUTS ĐƯỢC PHÉP SCROLL (SCROLLABLE CONTENT) ─── */}
            <div className="flex-1 overflow-y-auto p-6 pt-4 scrollbar-thin">
                {(isAddingDepartment || selectedDepartment) && (
                    <DetailDepartmentForm
                        key={selectedDepartment?.id ?? 'new-department'}
                        selectedDepartment={selectedDepartment ?? null}
                        onCloseCard={handleCloseCard}
                    />
                )}
            </div>
        </div>
    )
}

export default DepartmentDetail
