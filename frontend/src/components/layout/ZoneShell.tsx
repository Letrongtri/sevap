import type { ComponentType } from 'react'
import { useState } from 'react'
import { Outlet } from '@tanstack/react-router'

/* ============================================================
   ZoneShell — Shared zone layout wrapper
   Provides: flex container, sidebar with collapse state,
   and scrollable Outlet area.
   Used by DocumentShell, AdminShell, GlobalAdminShell.
   ============================================================ */

interface ZoneShellProps {
    SidebarComponent: ComponentType<{
        collapsed: boolean
        onToggle: () => void
    }>
}

export function ZoneShell({ SidebarComponent }: ZoneShellProps) {
    const [collapsed, setCollapsed] = useState(false)

    return (
        <div className="flex h-screen overflow-hidden bg-bg relative">
            <SidebarComponent
                collapsed={collapsed}
                onToggle={() => setCollapsed((v) => !v)}
            />

            <div
                className="flex flex-col flex-1 overflow-hidden transition-all duration-300"
                style={{
                    marginLeft: collapsed
                        ? 'var(--sidebar-collapsed-width)'
                        : 'var(--sidebar-width)',
                }}
            >
                <main className="flex-1 overflow-y-auto p-4">
                    <Outlet />
                </main>
            </div>
        </div>
    )
}
