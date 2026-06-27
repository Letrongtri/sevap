import type { ReactNode } from 'react'

/* ============================================================
   SecurityIcon — Small rounded icon wrapper used in the
   Security & Authentication card rows.
   Reusable across PasswordSection, TwoFactorSection, etc.
   ============================================================ */

interface SecurityIconProps {
    children: ReactNode
}

export function SecurityIcon({ children }: SecurityIconProps) {
    return (
        <div className="w-8 h-8 rounded-lg bg-bg flex items-center justify-center text-text-placeholder flex-shrink-0">
            {children}
        </div>
    )
}
