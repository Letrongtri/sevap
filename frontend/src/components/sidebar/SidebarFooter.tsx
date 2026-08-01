import { ArrowLeft } from 'lucide-react'
import { useNavigate } from '@tanstack/react-router'
import Tooltip from '../ui/Tooltip'
import BottomNavigation from './BottomNavigation'
import type { AuthUser } from '../../types/auth'

/* ============================================================
   SidebarFooter — Shared sidebar bottom section
   Renders: optional Back button + user account row.
   Used by DocumentSidebar, AdminSidebar, GlobalAdminSidebar.
   ============================================================ */

interface SidebarFooterProps {
    collapsed: boolean
    user: AuthUser | null
    /** If provided, renders a "Back to Chat" button above the account row */
    backTo?: string
}

export function SidebarFooter({ collapsed, user, backTo }: SidebarFooterProps) {
    const navigate = useNavigate()

    return (
        <>
            <div className="flex-shrink-0 px-2 pb-2 border-t border-border/60 pt-2">
                {/* Back button (optional) */}
                {backTo &&
                    (collapsed ? (
                        <Tooltip content="Quay lại Chat" position="right">
                            <button
                                onClick={() => navigate({ to: backTo })}
                                className="flex items-center justify-center w-full px-3 py-2 rounded-xl text-text-placeholder hover:text-primary hover:bg-primary/10 transition-all duration-150"
                                aria-label="Quay lại Chat"
                            >
                                <ArrowLeft className="w-5 h-5" />
                            </button>
                        </Tooltip>
                    ) : (
                        <button
                            onClick={() => navigate({ to: backTo })}
                            className="flex items-center gap-2 w-full px-3 py-2 rounded-xl text-sm text-text-muted hover:text-primary hover:bg-primary/10 transition-all duration-150"
                        >
                            <ArrowLeft className="w-4 h-4 flex-shrink-0" />
                            <span className="truncate">Quay lại Chat</span>
                        </button>
                    ))}
            </div>
            {/* Account row */}
            <BottomNavigation
                collapsed={collapsed}
                currentPath={''}
                user={user}
            />
        </>
    )
}
