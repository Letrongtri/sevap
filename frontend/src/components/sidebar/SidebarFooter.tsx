import { ArrowLeft, LogOut } from 'lucide-react'
import { useNavigate } from '@tanstack/react-router'
import Tooltip from '../ui/Tooltip'

/* ============================================================
   SidebarFooter — Shared sidebar bottom section
   Renders: optional Back button + user account row.
   Used by DocumentSidebar, AdminSidebar, GlobalAdminSidebar.
   ============================================================ */

interface SidebarFooterProps {
    collapsed: boolean
    userInitial: string
    fullName: string | undefined
    roleLabel: string
    onLogout: () => void
    /** If provided, renders a "Back to Chat" button above the account row */
    backTo?: string
}

export function SidebarFooter({
    collapsed,
    userInitial,
    fullName,
    roleLabel,
    onLogout,
    backTo,
}: SidebarFooterProps) {
    const navigate = useNavigate()

    return (
        <div className="flex-shrink-0 px-2 pb-2 border-t border-border/60 pt-2">
            {/* Back button (optional) */}
            {backTo &&
                (collapsed ? (
                    <Tooltip content="Back to Chat" position="right">
                        <button
                            onClick={() => navigate({ to: backTo })}
                            className="flex items-center justify-center w-full px-3 py-2 rounded-xl text-text-placeholder hover:text-primary hover:bg-primary/10 transition-all duration-150"
                            aria-label="Back to Chat"
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
                        <span className="truncate">Back to Chat</span>
                    </button>
                ))}

            {/* Account row */}
            {collapsed ? (
                <Tooltip content={fullName ?? 'Account'} position="right">
                    <button
                        onClick={onLogout}
                        className="flex items-center justify-center w-full px-3 py-2 mt-1 rounded-xl text-text-placeholder hover:text-error hover:bg-error-bg transition-all duration-150"
                        aria-label="Sign out"
                    >
                        <span className="w-5 h-5 rounded-md bg-primary/10 flex items-center justify-center text-primary font-bold text-xs">
                            {userInitial}
                        </span>
                    </button>
                </Tooltip>
            ) : (
                <div className="flex items-center gap-2 px-3 py-2 mt-1 rounded-xl hover:bg-bg transition-all duration-150 group">
                    <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center text-primary font-bold text-xs select-none flex-shrink-0">
                        {userInitial}
                    </div>
                    <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold text-text-primary leading-none truncate">
                            {fullName ?? 'User'}
                        </p>
                        <p className="text-[10px] text-text-placeholder mt-0.5 truncate">
                            {roleLabel}
                        </p>
                    </div>
                    <button
                        onClick={onLogout}
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
