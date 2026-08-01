import { useState } from 'react'
import { Shield } from 'lucide-react'
import { CardHeader } from './CardHeader'
import { PasswordSection } from './PasswordSection'
import { TwoFactorSection } from './TwoFactorSection'
import UserSessionsSection from './ActiveSessionsSection'

/* ============================================================
   SecurityCard — Card 2: Security & Authentication
   Orchestrates: PasswordSection | TwoFactorSection | ActiveSessionsSection
   ============================================================ */

export function SecurityCard() {
    const [twoFactorEnabled, setTwoFactorEnabled] = useState(false)

    return (
        <div className="bg-surface rounded-2xl border border-border shadow-sm">
            <CardHeader
                title="Bảo mật & Xác thực"
                subtitle="Quản lý mật khẩu, 2FA và các phiên đăng nhập đang hoạt động"
                icon={
                    <Shield
                        style={{ width: 18, height: 18 }}
                        className="text-primary"
                    />
                }
            />

            <div className="divide-y divide-border/50">
                <PasswordSection />

                <TwoFactorSection
                    enabled={twoFactorEnabled}
                    onToggle={() => setTwoFactorEnabled((v) => !v)}
                />

                <UserSessionsSection />
            </div>
        </div>
    )
}

export default SecurityCard
