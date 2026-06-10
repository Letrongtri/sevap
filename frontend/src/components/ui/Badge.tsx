import React from 'react'

/* ============================================================
   Badge — Status & label badges
   Variants: default | primary | success | warning | error | info | ghost
   Sizes:    sm | md
   ============================================================ */

type BadgeVariant =
    | 'default'
    | 'primary'
    | 'success'
    | 'warning'
    | 'error'
    | 'info'
    | 'ghost'

type BadgeSize = 'sm' | 'md'

interface BadgeProps {
    children: React.ReactNode
    variant?: BadgeVariant
    size?: BadgeSize
    /** Show pulsing dot before text (useful for live statuses) */
    dot?: boolean
    dotColor?: string
    icon?: React.ReactNode
    className?: string
}

const variantStyles: Record<BadgeVariant, string> = {
    default: 'bg-bg text-text-secondary border border-border',
    primary: 'bg-primary/10 text-primary border border-primary/20',
    success: 'bg-success-bg text-success border border-success-border',
    warning: 'bg-warning-bg text-warning border border-warning-border',
    error:   'bg-error-bg text-error-text border border-error-border',
    info:    'bg-info/10 text-info border border-info/30',
    ghost:   'bg-surface text-text-muted border border-border shadow-sm',
}

const sizeStyles: Record<BadgeSize, string> = {
    sm: 'px-2 py-0.5 text-[10px] gap-1   rounded-md',
    md: 'px-2.5 py-1 text-xs    gap-1.5 rounded-lg',
}

const dotColorMap: Record<BadgeVariant, string> = {
    default: 'bg-text-placeholder',
    primary: 'bg-primary',
    success: 'bg-success',
    warning: 'bg-warning',
    error:   'bg-error',
    info:    'bg-info',
    ghost:   'bg-text-placeholder',
}

export const Badge: React.FC<BadgeProps> = ({
    children,
    variant = 'default',
    size = 'md',
    dot = false,
    dotColor,
    icon,
    className = '',
}) => {
    return (
        <span
            className={[
                'inline-flex items-center font-medium',
                variantStyles[variant],
                sizeStyles[size],
                className,
            ].join(' ')}
        >
            {dot && (
                <span className="relative flex items-center">
                    <span
                        className={`animate-ping absolute inline-flex h-1.5 w-1.5 rounded-full opacity-75 ${
                            dotColor ?? dotColorMap[variant]
                        }`}
                    />
                    <span
                        className={`relative inline-flex rounded-full h-1.5 w-1.5 ${
                            dotColor ?? dotColorMap[variant]
                        }`}
                    />
                </span>
            )}
            {icon && !dot && (
                <span className="flex-shrink-0 [&>svg]:w-3 [&>svg]:h-3">
                    {icon}
                </span>
            )}
            {children}
        </span>
    )
}

export default Badge
