import { Outlet } from '@tanstack/react-router'
import { useState } from 'react'
import { Sidebar } from './Sidebar'

/* ============================================================
   AppShell — Main authenticated layout
   Sidebar (collapsible) + Topbar + scrollable content area
   ============================================================ */

export function AppShell() {
    const [sidebarCollapsed, setSidebarCollapsed] = useState(false)

    return (
        <div className="flex h-screen overflow-hidden bg-bg relative">
            {/* Left sidebar */}
            <Sidebar
                collapsed={sidebarCollapsed}
                onToggle={() => setSidebarCollapsed((v) => !v)}
            />

            {/* Right: topbar + page content */}
            <div
                className="flex flex-col flex-1 overflow-hidden transition-all duration-300"
                style={{
                    marginLeft: sidebarCollapsed
                        ? 'var(--sidebar-collapsed-width)'
                        : 'var(--sidebar-width)',
                }}
            >
                {/* Scrollable page area */}
                <main className="flex-1 overflow-y-auto p-4">
                    <Outlet />
                </main>
            </div>

            {/* <button
                aria-label="Notifications"
                className={[
                    'absolute right-3 top-3',
                    'w-8 h-8 rounded-xl bg-surface border border-border',
                    'flex items-center justify-center',
                    'text-text-placeholder hover:text-primary hover:border-primary hover:bg-bg',
                    'shadow-sm transition-all duration-150 cursor-pointer',
                ].join(' ')}
            >
                <Bell style={{ width: 18, height: 18 }} />
                <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full bg-primary" />
            </button> */}
        </div>
    )
}
