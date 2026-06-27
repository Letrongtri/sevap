import { ChartPie, Cpu, Building2, History, ShieldCheck } from 'lucide-react'
import { useAuthStore } from '../../store/authStore'
import { PRIVATE_ROUTES } from '../../routes/paths'
import { SidebarShell } from './SidebarShell'
import { SidebarFooter } from './SidebarFooter'

/* ============================================================
   GlobalAdminSidebar — Zone 4 Sidebar
   Global Admin Panel navigation for global admin only.
   ============================================================ */

const globalAdminNav = [
    {
        label: 'Dashboards',
        icon: ChartPie,
        to: PRIVATE_ROUTES.GLOBAL_DASHBOARD,
    },
    { label: 'Tenants', icon: Building2, to: PRIVATE_ROUTES.GLOBAL_TENANTS },
    {
        label: 'Infrastructure',
        icon: Cpu,
        to: PRIVATE_ROUTES.GLOBAL_INFRASTRUCTURE,
    },
    {
        label: 'Permissions',
        icon: ShieldCheck,
        to: PRIVATE_ROUTES.GLOBAL_PERMISSIONS,
    },
    { label: 'Activity Logs', icon: History, to: PRIVATE_ROUTES.GLOBAL_LOGS },
] as const

interface GlobalAdminSidebarProps {
    collapsed: boolean
    onToggle: () => void
}

export function GlobalAdminSidebar({
    collapsed,
    onToggle,
}: GlobalAdminSidebarProps) {
    const user = useAuthStore((s) => s.user)

    return (
        <SidebarShell
            collapsed={collapsed}
            onToggle={onToggle}
            navItems={globalAdminNav}
            footerSlot={
                <SidebarFooter
                    collapsed={collapsed}
                    user={user}
                    // No backTo — global admin has no "Back to Chat"
                />
            }
        />
    )
}
