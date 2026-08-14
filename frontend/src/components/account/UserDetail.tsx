import { X } from 'lucide-react'
import { useUserStore } from '../../store/usersStore'
import { useUsers } from '../../hooks/useUsers'
import AddingUserForm from './AddingUserForm'
import DetailAccountForm from './DetailAccountForm'

const UserDetail = () => {
    const activeUserId = useUserStore((s) => s.activeUserId)
    const setActiveUserId = useUserStore((s) => s.setActiveUserId)
    const isAddingUser = useUserStore((s) => s.isAddingUser)
    const setIsAddingUser = useUserStore((s) => s.setIsAddingUser)

    const { users } = useUsers()
    const selectedUser = users.find((u) => u.id === activeUserId) || null

    // Mutation hooks

    const handleCloseCard = () => {
        setActiveUserId(null)
        setIsAddingUser(false)
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
                    {isAddingUser
                        ? 'Thêm tài khoản mới'
                        : selectedUser
                          ? 'Thông tin người dùng'
                          : ''}
                </h2>
            </div>

            {/* ─── PHẦN 2: NỘI DUNG INPUTS ĐƯỢC PHÉP SCROLL (SCROLLABLE CONTENT) ─── */}
            <div className="flex-1 overflow-y-auto p-6 pt-4 scrollbar-thin">
                {/* --- STATE 1: Adding a user --- */}
                {isAddingUser && <AddingUserForm />}

                {/* --- STATE 2: Viewing/Editing selected user --- */}
                {selectedUser && (
                    <DetailAccountForm
                        key={selectedUser.id}
                        selectedUser={selectedUser}
                    />
                )}
            </div>
        </div>
    )
}

export default UserDetail
