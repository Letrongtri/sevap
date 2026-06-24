import { FileText, ArrowRight } from 'lucide-react'
import { useNavigate } from '@tanstack/react-router'
import Tooltip from '../ui/Tooltip'

export const SwitchButton = ({
    label,
    icon: Icon,
    to,
    collapsed,
}: {
    label: string
    icon: typeof FileText
    to: string
    collapsed: boolean
}) => {
    const navigate = useNavigate()

    const btn = (
        <button
            onClick={() => navigate({ to })}
            className={[
                'flex items-center gap-2 w-full px-3 py-2 rounded-xl',
                'text-sm font-medium transition-all duration-150 group',
                collapsed ? 'justify-center' : '',
                'text-text-muted hover:bg-primary/8 hover:text-primary',
                'border border-transparent hover:border-primary/20',
            ].join(' ')}
        >
            <Icon
                className={[
                    'flex-shrink-0 transition-colors duration-150',
                    collapsed ? 'w-5 h-5' : 'w-4 h-4',
                    'text-text-placeholder group-hover:text-primary',
                ].join(' ')}
            />
            {!collapsed && (
                <>
                    <span className="truncate flex-1 text-left">{label}</span>
                    <ArrowRight className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0" />
                </>
            )}
        </button>
    )

    return collapsed ? (
        <Tooltip content={label} position="right">
            {btn}
        </Tooltip>
    ) : (
        btn
    )
}
