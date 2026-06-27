import Header from '../components/ui/Header'
import UserTable from '../components/account/UserTable'
import UserDetail from '../components/account/UserDetail'
import { useUserStore } from '../store/usersStore'

export default function AccountsPage() {
    const activeUserId = useUserStore((s) => s.activeUserId)
    const isAddingUser = useUserStore((s) => s.isAddingUser)
    const showDetail = activeUserId !== null || isAddingUser
    const setIsAddingUser = useUserStore((s) => s.setIsAddingUser)
    const setActiveUserId = useUserStore((s) => s.setActiveUserId)

    const handleStartAddUser = () => {
        setActiveUserId(null)
        setIsAddingUser(true)
    }

    return (
        <div className="h-full flex flex-col gap-4 overflow-hidden">
            {/* Header section */}
            <div className="flex-shrink-0">
                <Header
                    title="Account Management"
                    isAdding={isAddingUser}
                    onAdd={handleStartAddUser}
                    btnTitle="Add User"
                />
            </div>

            {/* Filter and Content layout */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-stretch flex-1 overflow-hidden">
                {/* Left side: Users table list */}
                <div
                    className={[
                        'transition-all duration-300 ease-in-out h-full overflow-hidden flex flex-col',
                        showDetail
                            ? 'lg:col-span-7 xl:col-span-8'
                            : 'lg:col-span-12',
                    ].join(' ')}
                >
                    <UserTable />
                </div>

                {/* Right side: Selected user details or add user card */}
                {showDetail && (
                    <div className="lg:col-span-5 xl:col-span-4 bg-white rounded-2xl border border-[#D4D7DE]/60 shadow-lg relative animate-slide-in-right flex flex-col h-full overflow-hidden">
                        <UserDetail key={activeUserId || 'adding'} />
                    </div>
                )}
            </div>
        </div>
    )
}
