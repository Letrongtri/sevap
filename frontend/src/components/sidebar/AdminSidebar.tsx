import {
    UserCog,
    ShieldCheck,
    Building2,
    Briefcase,
    History,
} from 'lucide-react'
import { useAuthStore } from '../../store/authStore'
import { PRIVATE_ROUTES } from '../../routes/paths'
import { SidebarShell } from './SidebarShell'
import { SidebarFooter } from './SidebarFooter'

/* ============================================================
   AdminSidebar — Zone 3 Sidebar
   Admin Panel navigation for tenant admin only.
   ============================================================ */

const adminNav = [
    {
        label: 'User Accounts',
        icon: UserCog,
        to: PRIVATE_ROUTES.ADMIN_ACCOUNTS,
    },
    {
        label: 'Roles & Permissions',
        icon: ShieldCheck,
        to: PRIVATE_ROUTES.ADMIN_ROLES,
    },
    {
        label: 'Departments',
        icon: Building2,
        to: PRIVATE_ROUTES.ADMIN_DEPARTMENTS,
    },
    {
        label: 'Job Titles',
        icon: Briefcase,
        to: PRIVATE_ROUTES.ADMIN_JOB_TITLES,
    },
    { label: 'Activity Logs', icon: History, to: PRIVATE_ROUTES.TENANT_LOGS },
] as const

interface AdminSidebarProps {
    collapsed: boolean
    onToggle: () => void
}

export function AdminSidebar({ collapsed, onToggle }: AdminSidebarProps) {
    const user = useAuthStore((s) => s.user)

    return (
        <SidebarShell
            collapsed={collapsed}
            onToggle={onToggle}
            navItems={adminNav}
            footerSlot={
                <SidebarFooter
                    collapsed={collapsed}
                    user={user}
                    backTo={PRIVATE_ROUTES.HOME}
                />
            }
        />
    )
}
