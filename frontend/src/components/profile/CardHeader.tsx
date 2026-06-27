import type { ReactNode } from 'react'

interface CardHeaderProps {
    title: string
    subtitle?: string
    icon: ReactNode
    children?: ReactNode
}

export function CardHeader({
    title,
    subtitle,
    icon,
    children,
}: CardHeaderProps) {
    return (
        <div className="flex items-center justify-between px-6 py-4 border-b border-border/60">
            <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-primary-light flex items-center justify-center">
                    {icon}
                </div>
                <div>
                    <h2 className="text-base font-bold text-text-primary">
                        {title}
                    </h2>
                    <p className="text-xs text-text-placeholder mt-0.5">
                        {subtitle}
                    </p>
                </div>
            </div>
            {children && (
                <div className="flex items-center gap-2">{children}</div>
            )}
        </div>
    )
}
