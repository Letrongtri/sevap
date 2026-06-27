import { type ComponentType, useRef, useState } from 'react'
import { NavItem } from './NavItem'
import { useAuth } from '../../hooks/useAuth'
import type { AuthUser } from '../../types/auth'
import Tooltip from '../ui/Tooltip'
import { isGlobalAdmin } from '../../lib/permissions'
import { Avatar } from '../ui/Avatar'
import { ProfilePopover } from './ProfilePopover'

// Placeholder nav items — restore when settings/support pages are implemented
const bottomNav: { label: string; icon: ComponentType; to: string }[] = []

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
    const isGA = isGlobalAdmin(user)
    const [popoverOpen, setPopoverOpen] = useState(false)
    const [anchorRect, setAnchorRect] = useState<DOMRect | null>(null)
    const avatarRef = useRef<HTMLButtonElement>(null)

    const handleAvatarClick = () => {
        if (avatarRef.current) {
            setAnchorRect(avatarRef.current.getBoundingClientRect())
        }
        setPopoverOpen(true)
    }

    return (
        <>
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
                    <Tooltip
                        content={user?.fullName ?? 'Account'}
                        position="right"
                    >
                        <button
                            ref={avatarRef}
                            id="sidebar-avatar-btn-collapsed"
                            aria-label="Open account menu"
                            onClick={handleAvatarClick}
                            className="rounded-full focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
                        >
                            <Avatar
                                fullName={user?.fullName ?? 'User'}
                                size={32}
                            />
                        </button>
                    </Tooltip>
                ) : (
                    <button
                        ref={avatarRef}
                        id="sidebar-avatar-btn"
                        aria-label="Open account menu"
                        onClick={handleAvatarClick}
                        className="w-full flex items-center gap-2 px-3 py-2 mt-1 rounded-xl hover:bg-bg transition-all duration-150 group focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
                    >
                        {/* Avatar */}
                        <Avatar fullName={user?.fullName ?? 'User'} size={32} />
                        {/* Name + role */}
                        <div className="flex-1 min-w-0 text-left">
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
                    </button>
                )}
            </div>

            {/* Profile popover (portal-style fixed position) */}
            {popoverOpen && (
                <ProfilePopover
                    user={user}
                    anchorRect={anchorRect}
                    onClose={() => setPopoverOpen(false)}
                    onLogout={logout}
                />
            )}
        </>
    )
}

export default BottomNavigation
