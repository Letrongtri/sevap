import { useRouterState } from '@tanstack/react-router'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { useAuthStore } from '../../store/authStore'
import SystemBranding from '../sidebar/SystemBranding'
import MainNavigation from '../sidebar/MainNavigation'
import BottomNavigation from '../sidebar/BottomNavigation'
import ChatHistory from '../sidebar/ChatHistory'
import { isGlobalAdmin } from '../../lib/permissions'

interface SidebarProps {
    collapsed: boolean
    onToggle: () => void
}

export function Sidebar({ collapsed, onToggle }: SidebarProps) {
    const routerState = useRouterState()
    const currentPath = routerState.location.pathname
    const user = useAuthStore((s) => s.user)

    const isGA = isGlobalAdmin(user)

    return (
        <aside
            className={[
                'fixed top-0 left-0 h-screen z-dropdown',
                'bg-surface border-r border-border/60',
                'flex flex-col transition-all duration-300 ease-in-out',
                'shadow-sm',
                collapsed
                    ? 'w-[var(--sidebar-collapsed-width)]'
                    : 'w-[var(--sidebar-width)]',
            ].join(' ')}
        >
            {/* SECTION 1 — Logo & system name */}
            <SystemBranding collapsed={collapsed} />

            {/* SECTION 2 — Main navigation */}
            <MainNavigation
                collapsed={collapsed}
                user={user}
                currentPath={currentPath}
            />

            {/* SECTION 3 — Chat history (scrollable, từ API) */}
            {!isGA && <ChatHistory collapsed={collapsed} />}

            {/* SECTION 4 — Settings, Support, Account */}
            <BottomNavigation
                collapsed={collapsed}
                currentPath={currentPath}
                user={user}
            />

            {/* Collapse toggle button */}
            <button
                onClick={onToggle}
                aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
                className={[
                    'absolute -right-3 bottom-[20px]',
                    'w-6 h-6 rounded-full bg-surface border border-border',
                    'flex items-center justify-center',
                    'text-text-placeholder hover:text-primary hover:border-primary',
                    'shadow-sm transition-all duration-150 cursor-pointer',
                ].join(' ')}
            >
                {collapsed ? (
                    <ChevronRight className="w-3 h-3" />
                ) : (
                    <ChevronLeft className="w-3 h-3" />
                )}
            </button>
        </aside>
    )
}
