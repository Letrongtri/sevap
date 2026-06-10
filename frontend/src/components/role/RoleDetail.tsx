import { useState } from 'react'
import { useRoleStore } from '../../store/roleStore'
import { AlertCircle, CheckCircle, X } from 'lucide-react'
import { useRoles } from '../../hooks/useRoles'
import DetailRoleForm from './DetailRoleForm'

const RoleDetail = () => {
    const activeRoleId = useRoleStore((s) => s.activeRoleId)
    const setActiveRoleId = useRoleStore((s) => s.setActiveRoleId)
    const isAddingRole = useRoleStore((s) => s.isAddingRole)
    const setIsAddingRole = useRoleStore((s) => s.setIsAddingRole)

    const { roles } = useRoles()
    const selectedRole = roles.find((r) => r.id === activeRoleId) || null

    // Form feedback states
    const [formError, setFormError] = useState<string | null>(null)
    const [formSuccess, setFormSuccess] = useState<string | null>(null)

    const handleCloseCard = () => {
        setActiveRoleId(null)
        setIsAddingRole(false)
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
                    {isAddingRole
                        ? 'Add New Role'
                        : selectedRole
                          ? 'Role Information'
                          : ''}
                </h2>

                {/* Khóa các Banner feedback cố định tại đây để không bị cuộn mất khi có lỗi/thành công */}
                {formError && (
                    <div className="mb-2 p-3 bg-error-bg border border-error-border text-error-text rounded-xl text-xs flex items-start gap-2 animate-fade-in-down">
                        <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                        <span>{formError}</span>
                    </div>
                )}
                {formSuccess && (
                    <div className="mb-2 p-3 bg-success-bg border border-success-border text-success rounded-xl text-xs flex items-start gap-2 animate-fade-in-down">
                        <CheckCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                        <span>{formSuccess}</span>
                    </div>
                )}
            </div>

            {/* ─── PHẦN 2: NỘI DUNG INPUTS ĐƯỢC PHÉP SCROLL (SCROLLABLE CONTENT) ─── */}
            <div className="flex-1 overflow-y-auto p-6 pt-4 scrollbar-thin">
                {(isAddingRole || selectedRole) && (
                    <DetailRoleForm
                        key={selectedRole?.id ?? 'new-role'}
                        selectedRole={selectedRole}
                        setFormError={setFormError}
                        setFormSuccess={setFormSuccess}
                        onCloseCard={handleCloseCard}
                    />
                )}
            </div>
        </div>
    )
}

export default RoleDetail
