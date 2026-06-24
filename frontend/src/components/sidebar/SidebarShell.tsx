import type { ComponentType } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { useRouterState } from '@tanstack/react-router'
import { NavItem } from './NavItem'
import SystemBranding from './SystemBranding'

/* ============================================================
   SidebarShell — Shared sidebar wrapper
   Provides: aside container, branding, nav section, spacer,
   collapse toggle. Footer is injected via `footerSlot`.
   Used by DocumentSidebar, AdminSidebar, GlobalAdminSidebar.
   ============================================================ */

export interface NavEntry {
    label: string
    icon: ComponentType<{ className?: string }>
    to: string
}

interface SidebarShellProps {
    collapsed: boolean
    onToggle: () => void
    navItems: readonly NavEntry[]
    footerSlot: React.ReactNode
}

export function SidebarShell({
    collapsed,
    onToggle,
    navItems,
    footerSlot,
}: SidebarShellProps) {
    const currentPath = useRouterState({ select: (s) => s.location.pathname })

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
            {/* Branding */}
            <SystemBranding collapsed={collapsed} />

            {/* Navigation */}
            <div className="flex-shrink-0 px-2 pt-4 pb-2 border-b border-border/40">
                <div className="space-y-0.5">
                    {navItems.map(({ label, icon, to }) => (
                        <NavItem
                            key={to}
                            label={label}
                            icon={icon}
                            to={to}
                            collapsed={collapsed}
                            currentPath={currentPath}
                        />
                    ))}
                </div>
            </div>

            {/* Spacer */}
            <div className="flex-1" />

            {/* Footer slot (account row, back button, etc.) */}
            {footerSlot}

            {/* Collapse toggle */}
            <button
                onClick={onToggle}
                aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
                className={[
                    'absolute -right-3 bottom-[80px]',
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
