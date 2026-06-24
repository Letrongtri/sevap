import type { ComponentType } from 'react'
import { Link } from '@tanstack/react-router'
import { PRIVATE_ROUTES } from '../../routes/paths'
import Tooltip from '../ui/Tooltip'

/* ---- Helper: NavLink item ---- */
export const NavItem = ({
    label,
    icon: Icon,
    to,
    collapsed,
    currentPath,
}: {
    label: string
    icon: ComponentType<{ className?: string }>
    to: string
    collapsed: boolean
    currentPath: string
}) => {
    const isActive =
        to === PRIVATE_ROUTES.HOME
            ? currentPath === '/'
            : currentPath.startsWith(to)

    const linkEl = (
        <Link
            to={to}
            className={[
                'flex items-center gap-3 px-3 py-2 rounded-xl w-full',
                'text-sm font-medium transition-all duration-150',
                'group select-none',
                collapsed ? 'justify-center' : '',
                isActive
                    ? 'bg-primary/10 text-primary'
                    : 'text-text-muted hover:bg-bg hover:text-text-secondary',
            ].join(' ')}
        >
            <Icon
                className={[
                    'flex-shrink-0 transition-colors duration-150',
                    collapsed ? 'w-5 h-5' : 'w-4 h-4',
                    isActive
                        ? 'text-primary'
                        : 'text-text-placeholder group-hover:text-text-secondary',
                ].join(' ')}
            />
            {!collapsed && (
                <>
                    <span className="truncate">{label}</span>
                    {isActive && (
                        <span className="ml-auto w-1.5 h-1.5 rounded-full bg-primary flex-shrink-0" />
                    )}
                </>
            )}
        </Link>
    )

    return collapsed ? (
        <Tooltip content={label} position="right">
            {linkEl}
        </Tooltip>
    ) : (
        linkEl
    )
}
