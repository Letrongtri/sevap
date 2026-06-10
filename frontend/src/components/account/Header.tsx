import { Plus } from 'lucide-react'
import Button from '../ui/Button'
import { useUserStore } from '../../store/usersStore'

const Header = () => {
    const isAddingUser = useUserStore((s) => s.isAddingUser)
    const setIsAddingUser = useUserStore((s) => s.setIsAddingUser)
    const setActiveUserId = useUserStore((s) => s.setActiveUserId)

    const handleStartAddUser = () => {
        setActiveUserId(null)
        setIsAddingUser(true)
    }

    return (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
                <h1 className="text-2xl font-bold text-[#1A1D23]">
                    Account Management
                </h1>
            </div>
            {!isAddingUser && (
                <Button
                    variant="primary"
                    leftIcon={<Plus className="w-4 h-4" />}
                    onClick={handleStartAddUser}
                >
                    Add User
                </Button>
            )}
        </div>
    )
}

export default Header
