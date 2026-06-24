import { SquarePen, Users, FileText, Settings2 } from 'lucide-react'
import { PRIVATE_ROUTES } from '../../routes/paths'
import { NavItem } from './NavItem'
import {
    canAccessDocumentZone,
    canAccessTenantAdminZone,
} from '../../lib/permissions'
import type { AuthUser } from '../../types/auth'
import { SwitchButton } from './SwitchButton'

/* ============================================================
   MainNavigation — Zone 1 Sidebar Navigation
   Shows chat navigation + optional switch buttons to Zone 2/3.
   ============================================================ */

const tenantZoneNav = [
    { label: 'New Chat', icon: SquarePen, to: PRIVATE_ROUTES.HOME },
    { label: 'Directory', icon: Users, to: PRIVATE_ROUTES.DIRECTORY },
] as const

const MainNavigation = ({
    collapsed,
    user,
    currentPath,
}: {
    collapsed: boolean
    user: AuthUser | null
    currentPath: string
}) => {
    const showDocManager = canAccessDocumentZone(user)
    const showAdminPanel = canAccessTenantAdminZone(user)

    return (
        <div className="flex-shrink-0 px-2 pt-4 pb-2 border-b border-border/40">
            {/* Zone 1 navigation */}
            <div className="space-y-0.5">
                {tenantZoneNav.map(({ label, icon, to }) => (
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

            {/* Switch buttons to Zone 2 / Zone 3 */}
            {(showDocManager || showAdminPanel) && (
                <div
                    className={[
                        'space-y-0.5',
                        collapsed ? 'mt-1 pt-1' : 'mt-3 pt-3',
                        'border-t border-border/30',
                    ].join(' ')}
                >
                    {!collapsed && (
                        <p className="text-[10px] font-semibold uppercase tracking-widest text-text-placeholder px-3 pb-1">
                            Switch to
                        </p>
                    )}
                    {showDocManager && (
                        <SwitchButton
                            label="Document Manager"
                            icon={FileText}
                            to={PRIVATE_ROUTES.DOCUMENTS}
                            collapsed={collapsed}
                        />
                    )}
                    {showAdminPanel && (
                        <SwitchButton
                            label="Admin Panel"
                            icon={Settings2}
                            to={PRIVATE_ROUTES.ADMIN_ACCOUNTS}
                            collapsed={collapsed}
                        />
                    )}
                </div>
            )}
        </div>
    )
}

export default MainNavigation
