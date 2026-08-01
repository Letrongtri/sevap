import RoleDetail from '../components/role/RoleDetail'
import RoleTable from '../components/role/RoleTable'
import Header from '../components/ui/Header'
import { useRoleStore } from '../store/roleStore'
import { usePageTitle } from '../hooks/usePageTitle'

export default function RolesPage() {
    usePageTitle('Quản lý phân quyền')
    const activeRoleId = useRoleStore((s) => s.activeRoleId)
    const isAddingRole = useRoleStore((s) => s.isAddingRole)
    const showDetail = activeRoleId !== null || isAddingRole
    const setIsAddingRole = useRoleStore((s) => s.setIsAddingRole)
    const setActiveRoleId = useRoleStore((s) => s.setActiveRoleId)

    const handleStartAddRole = () => {
        setActiveRoleId(null)
        setIsAddingRole(true)
    }

    return (
        <div className="h-full flex flex-col gap-4 overflow-hidden">
            {/* Header section */}
            <div className="flex-shrink-0">
                <Header
                    title="Quản lý phân quyền"
                    isAdding={isAddingRole}
                    onAdd={handleStartAddRole}
                    btnTitle="Thêm vai trò"
                />
            </div>

            {/* Filter and Content layout */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-stretch flex-1 overflow-hidden">
                {/* Left side: roles table list */}
                <div
                    className={[
                        'transition-all duration-300 ease-in-out h-full overflow-hidden flex flex-col',
                        showDetail
                            ? 'lg:col-span-5 xl:col-span-4'
                            : 'lg:col-span-12',
                    ].join(' ')}
                >
                    <RoleTable />
                </div>

                {/* Right side: Selected role details or add role card */}
                {showDetail && (
                    <div className="lg:col-span-7 xl:col-span-8 bg-white rounded-2xl border border-[#D4D7DE]/60 shadow-lg relative animate-slide-in-right flex flex-col h-full overflow-hidden">
                        <RoleDetail key={activeRoleId || 'adding'} />
                    </div>
                )}
            </div>
        </div>
    )
}
