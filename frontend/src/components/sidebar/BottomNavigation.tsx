import { LogOut } from 'lucide-react'
import { NavItem } from './NavItem'
import { useAuth } from '../../hooks/useAuth'
import type { AuthUser } from '../../types/auth'
import Tooltip from '../ui/Tooltip'
import { isGlobalAdmin } from '../../lib/permissions'

// Placeholder nav items — restore when settings/support pages are implemented
const bottomNav: { label: string; icon: typeof LogOut; to: string }[] = []

const BottomNavigation = ({
    collapsed,
    currentPath,
    user,
}: {
    collapsed: boolean
    currentPath: string
    user: AuthUser | null
}) => {
    const { logout } = useAuth()
    const userInitial = user?.fullName?.charAt(0)?.toUpperCase() ?? 'U'
    const isGA = isGlobalAdmin(user)

    return (
        <div
            className={[
                'flex-shrink-0 border-t border-border/60 px-2 pt-2 pb-3 space-y-0.5',
                isGA ? 'mt-auto' : '',
            ].join(' ')}
        >
            {/* Settings & Support links */}
            {bottomNav.map(
                ({ label, icon, to }) =>
                    !isGA && (
                        <NavItem
                            key={to}
                            label={label}
                            icon={icon}
                            to={to}
                            collapsed={collapsed}
                            currentPath={currentPath}
                        />
                    )
            )}

            {/* Account row */}
            {collapsed ? (
                <Tooltip content={user?.fullName ?? 'Account'} position="right">
                    <button
                        onClick={logout}
                        className="flex items-center justify-center w-full px-3 py-2 rounded-xl text-text-placeholder hover:text-error hover:bg-error-bg transition-all duration-150"
                    >
                        <LogOut className="w-5 h-5" />
                    </button>
                </Tooltip>
            ) : (
                <div className="flex items-center gap-2 px-3 py-2 mt-1 rounded-xl hover:bg-bg transition-all duration-150 group">
                    {/* Avatar */}
                    <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center text-primary font-bold text-xs select-none flex-shrink-0">
                        {userInitial}
                    </div>
                    {/* Name + role */}
                    <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold text-text-primary leading-none truncate">
                            {user?.fullName ?? 'User'}
                        </p>
                        <p className="text-[10px] text-text-placeholder mt-0.5 truncate">
                            {user?.roles?.includes('admin')
                                ? 'Admin'
                                : user?.roles?.includes('hr_manager')
                                  ? 'HR Manager'
                                  : 'Employee'}
                        </p>
                    </div>
                    {/* Logout */}
                    <button
                        onClick={logout}
                        aria-label="Sign out"
                        title="Sign out"
                        className="p-1 rounded-lg text-text-placeholder hover:text-error hover:bg-error-bg opacity-0 group-hover:opacity-100 transition-all duration-150 flex-shrink-0"
                    >
                        <LogOut className="w-3.5 h-3.5" />
                    </button>
                </div>
            )}
        </div>
    )
}

export default BottomNavigation
