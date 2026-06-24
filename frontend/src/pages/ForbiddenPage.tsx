import { useNavigate } from '@tanstack/react-router'
import { ShieldOff, ArrowLeft, Home } from 'lucide-react'
import { PRIVATE_ROUTES } from '../routes/paths'

/* ============================================================
   ForbiddenPage — 403 Access Denied
   Shown when a user tries to access a page without permission.
   ============================================================ */

export default function ForbiddenPage() {
    const navigate = useNavigate()

    return (
        <div className="min-h-screen bg-bg flex items-center justify-center p-6">
            <div className="max-w-md w-full text-center">
                {/* Icon */}
                <div className="mx-auto w-20 h-20 rounded-2xl bg-error-bg flex items-center justify-center mb-6">
                    <ShieldOff className="w-10 h-10 text-error" />
                </div>

                {/* Status */}
                <p className="text-sm font-semibold text-error uppercase tracking-widest mb-2">
                    403 — Forbidden
                </p>

                {/* Title */}
                <h1 className="text-2xl font-bold text-text-primary mb-3">
                    Bạn không có quyền truy cập
                </h1>

                {/* Description */}
                <p className="text-sm text-text-muted leading-relaxed mb-8">
                    Trang này yêu cầu quyền hạn cao hơn. Nếu bạn cho rằng đây là
                    lỗi, vui lòng liên hệ quản trị viên của tổ chức.
                </p>

                {/* Actions */}
                <div className="flex flex-col sm:flex-row gap-3 justify-center">
                    <button
                        onClick={() => navigate({ to: -1 as unknown as string })}
                        className={[
                            'flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl',
                            'text-sm font-medium border border-border',
                            'text-text-muted hover:text-text-primary hover:border-primary/40',
                            'transition-all duration-150',
                        ].join(' ')}
                    >
                        <ArrowLeft className="w-4 h-4" />
                        Quay lại
                    </button>
                    <button
                        onClick={() => navigate({ to: PRIVATE_ROUTES.HOME })}
                        className={[
                            'flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl',
                            'text-sm font-medium',
                            'bg-primary text-white hover:bg-primary/90',
                            'transition-all duration-150',
                        ].join(' ')}
                    >
                        <Home className="w-4 h-4" />
                        Về trang chủ
                    </button>
                </div>
            </div>
        </div>
    )
}
