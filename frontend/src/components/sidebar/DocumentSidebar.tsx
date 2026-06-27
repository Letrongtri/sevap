import { FileText } from 'lucide-react'
import { useAuthStore } from '../../store/authStore'
import { PRIVATE_ROUTES } from '../../routes/paths'
import { SidebarShell } from './SidebarShell'
import { SidebarFooter } from './SidebarFooter'

/* ============================================================
   DocumentSidebar — Zone 2 Sidebar
   Document Management navigation for hr_manager + admin.
   ============================================================ */

const docNav = [
    { label: 'Documents', icon: FileText, to: PRIVATE_ROUTES.DOCUMENTS },
] as const

interface DocumentSidebarProps {
    collapsed: boolean
    onToggle: () => void
}

export function DocumentSidebar({ collapsed, onToggle }: DocumentSidebarProps) {
    const user = useAuthStore((s) => s.user)

    return (
        <SidebarShell
            collapsed={collapsed}
            onToggle={onToggle}
            navItems={docNav}
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
