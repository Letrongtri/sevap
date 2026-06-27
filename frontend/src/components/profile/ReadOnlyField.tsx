import type { ReactNode } from 'react'

/* ============================================================
   ReadOnlyField — icon + label + plain-text value
   Used in Account Details and Organization sections.
   ============================================================ */

interface ReadOnlyFieldProps {
    icon: ReactNode
    label: string
    value: string
}

export function ReadOnlyField({ icon, label, value }: ReadOnlyFieldProps) {
    return (
        <div className="flex items-start gap-2.5">
            <div className="mt-0.5 flex-shrink-0 text-text-placeholder">{icon}</div>
            <div className="min-w-0">
                <p className="text-[10px] font-semibold text-text-placeholder uppercase tracking-wide">
                    {label}
                </p>
                <p className="mt-0.5 text-sm font-medium text-text-primary truncate">
                    {value || '—'}
                </p>
            </div>
        </div>
    )
}
