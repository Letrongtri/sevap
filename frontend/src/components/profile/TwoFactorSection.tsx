import { Shield } from 'lucide-react'
import { SecurityIcon } from './SecurityIcon'

/* ============================================================
   TwoFactorSection — Security card row for 2FA toggle.
   Stateless — parent (SecurityCard) owns the enabled boolean.
   ============================================================ */

interface TwoFactorSectionProps {
    enabled: boolean
    onToggle: () => void
}

export function TwoFactorSection({ enabled, onToggle }: TwoFactorSectionProps) {
    return (
        <div className="flex items-center justify-between px-6 py-5">
            <div className="flex items-center gap-3">
                <SecurityIcon>
                    <Shield className="w-4 h-4" />
                </SecurityIcon>
                <div>
                    <p className="text-sm font-semibold text-text-primary">
                        Xác thực 2 yếu tố (2FA)
                    </p>
                    <p className="text-xs text-text-muted mt-0.5">
                        Bảo vệ tài khoản của bạn với lớp bảo mật thứ hai.
                    </p>
                </div>
            </div>

            {/* Toggle switch */}
            <button
                id="security-2fa-toggle"
                role="switch"
                aria-checked={enabled}
                onClick={onToggle}
                className={[
                    'relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent',
                    'transition-colors duration-200 ease-in-out',
                    'focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/40',
                    enabled ? 'bg-primary' : 'bg-border',
                ].join(' ')}
            >
                <span
                    className={[
                        'pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow-md',
                        'transform transition-transform duration-200 ease-in-out',
                        enabled ? 'translate-x-5' : 'translate-x-0',
                    ].join(' ')}
                />
            </button>
        </div>
    )
}
