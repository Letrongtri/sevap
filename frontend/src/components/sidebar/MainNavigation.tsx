import { FileText, SquarePen, UserCog, ShieldCheck, LayoutDashboard, Users, ShieldAlert, Cpu, History } from 'lucide-react'
import { PRIVATE_ROUTES } from '../../routes/paths'
import { NavItem } from './NavItem'

const allUserNav = [
    { label: 'New Chat', icon: SquarePen, to: PRIVATE_ROUTES.HOME },
] as const

const managerNav = [
    { label: 'Documents', icon: FileText, to: PRIVATE_ROUTES.DOCUMENTS },
    { label: 'Accounts', icon: UserCog, to: PRIVATE_ROUTES.ACCOUNTS },
    {
        label: 'Roles & Permissions',
        icon: ShieldCheck,
        to: PRIVATE_ROUTES.ROLES,
    },
] as const

const globalAdminNav = [
    { label: 'Dashboard', icon: LayoutDashboard, to: PRIVATE_ROUTES.GLOBAL_DASHBOARD },
    { label: 'Tenants Management', icon: Users, to: PRIVATE_ROUTES.GLOBAL_TENANTS },
    { label: 'Global Permissions Master', icon: ShieldAlert, to: PRIVATE_ROUTES.GLOBAL_PERMISSIONS },
    { label: 'AI Models & Infrastructure', icon: Cpu, to: PRIVATE_ROUTES.GLOBAL_INFRASTRUCTURE },
    { label: 'System Logs', icon: History, to: PRIVATE_ROUTES.GLOBAL_LOGS },
] as const

const MainNavigation = ({
    collapsed,
    isManager,
    isGlobalAdmin,
    currentPath,
}: {
    collapsed: boolean
    isManager: boolean | undefined
    isGlobalAdmin: boolean
    currentPath: string
}) => {
    if (isGlobalAdmin) {
        return (
            <div className="flex-shrink-0 px-2 pt-4 pb-2 border-b border-border/40">
                <div className="space-y-0.5">
                    {globalAdminNav.map(({ label, icon, to }) => (
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
        )
    }

    return (
        <div className="flex-shrink-0 px-2 pt-4 pb-2 border-b border-border/40">
            <div className="space-y-0.5">
                {allUserNav.map(({ label, icon, to }) => (
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

            {/* Manager-only section */}
            {isManager && (
                <div
                    className={[
                        'space-y-0.5',
                        collapsed ? 'mt-1' : 'mt-3',
                    ].join(' ')}
                >
                    {managerNav.map(({ label, icon, to }) => (
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
            )}
        </div>
    )
}

export default MainNavigation
