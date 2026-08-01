import { useEffect, useRef, type CSSProperties } from 'react'
import {
    User,
    LogOut,
    ChevronRight,
    Building2,
    Shield,
    Settings2,
} from 'lucide-react'
import { useNavigate } from '@tanstack/react-router'
import { Avatar } from '../ui/Avatar'
import type { AuthUser } from '../../types/auth'
import { stringToLabel } from '../../../utils/utils'
import Badge from '../ui/Badge'
import { SwitchButton } from './SwitchButton'
import { PRIVATE_ROUTES } from '../../routes/paths'
import { isAdminRole } from '../../lib/permissions'

/* ============================================================
   ProfilePopover — Floating card shown on avatar click
   ============================================================ */

interface ProfilePopoverProps {
    user: AuthUser | null
    onClose: () => void
    onLogout: () => void
    /** Anchor position for the popover */
    anchorRect: DOMRect | null
}

export const ProfilePopover = ({
    user,
    onClose,
    onLogout,
    anchorRect,
}: ProfilePopoverProps) => {
    const popoverRef = useRef<HTMLDivElement>(null)
    const navigate = useNavigate()

    // Close on outside click or ESC
    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (
                popoverRef.current &&
                !popoverRef.current.contains(e.target as Node)
            ) {
                onClose()
            }
        }
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose()
        }
        document.addEventListener('mousedown', handleClickOutside)
        document.addEventListener('keydown', handleKeyDown)
        return () => {
            document.removeEventListener('mousedown', handleClickOutside)
            document.removeEventListener('keydown', handleKeyDown)
        }
    }, [onClose])

    // Position: above the anchor
    const style: CSSProperties = anchorRect
        ? {
              position: 'fixed',
              bottom: `calc(100vh - ${anchorRect.top}px + 8px)`,
              left: anchorRect.left,
              zIndex: 500,
          }
        : { position: 'fixed', bottom: '80px', left: '16px', zIndex: 500 }

    const handleProfileClick = () => {
        onClose()
        navigate({ to: '/profile' })
    }

    const handleLogout = () => {
        onClose()
        onLogout()
    }

    return (
        <div
            ref={popoverRef}
            style={style}
            className="w-64 bg-surface rounded-2xl border border-border shadow-xl animate-scale-pop origin-bottom-left overflow-hidden"
            role="menu"
            aria-label="Account menu"
        >
            {/* User info header */}
            <div className="px-4 pt-4 pb-3 border-b border-border/60">
                <div className="flex items-center gap-3">
                    <Avatar
                        id={user?.id ?? 'User'}
                        fullName={user?.fullName ?? 'User'}
                        size={44}
                    />
                    <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold text-text-primary truncate">
                            {user?.fullName ?? 'User'}
                        </p>
                        <div className="flex items-center gap-1">
                            <p className="text-xs text-text-secondary truncate">
                                Code:
                            </p>
                            <Badge size="sm" variant="ghost">
                                {user?.employeeCode ?? 'User'}
                            </Badge>
                        </div>
                    </div>
                </div>

                <div className="flex flex-col gap-1 mt-3">
                    <div className="flex items-center justify-between gap-1">
                        <div className="flex items-center gap-1 text-xs text-text-secondary">
                            <Building2 className="w-3 h-3" />
                            <span>Công ty:</span>
                        </div>
                        <p className="text-xs text-text-secondary truncate">
                            {user?.companyName ?? 'Công ty'}
                        </p>
                    </div>
                    <div className="flex items-center justify-between gap-1">
                        <div className="flex items-center gap-1 text-xs text-text-secondary">
                            <Shield className="w-3 h-3" />
                            <span>Vai trò:</span>
                        </div>
                        <Badge size="sm" variant="primary">
                            {user?.roles
                                ?.map((role) => stringToLabel(role))
                                .join(', ') || 'Nhân viên'}
                        </Badge>
                    </div>
                </div>
            </div>

            {/* Menu items */}
            <div className="p-1.5">
                <button
                    id="profile-popover-my-profile"
                    role="menuitem"
                    onClick={handleProfileClick}
                    className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-text-secondary hover:bg-bg hover:text-text-primary transition-all duration-150 group"
                >
                    <User className="w-4 h-4 text-text-placeholder group-hover:text-primary transition-colors" />
                    <span className="flex-1 text-left font-medium">
                        Trang cá nhân
                    </span>
                    <ChevronRight className="w-3.5 h-3.5 text-text-placeholder opacity-0 group-hover:opacity-100 transition-opacity" />
                </button>

                {isAdminRole(user) && (
                    <SwitchButton
                        label="Trang quản trị"
                        icon={Settings2}
                        to={PRIVATE_ROUTES.TENANT_ADMIN_DASHBOARD}
                        collapsed={false}
                    />
                )}
            </div>

            {/* Divider + Sign out */}
            <div className="px-1.5 pb-1.5 border-t border-border/60 pt-1.5">
                <button
                    id="profile-popover-sign-out"
                    role="menuitem"
                    onClick={handleLogout}
                    className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-error hover:bg-error-bg transition-all duration-150 group"
                >
                    <LogOut className="w-4 h-4" />
                    <span className="font-medium">Đăng xuất</span>
                </button>
            </div>
        </div>
    )
}

export default ProfilePopover
