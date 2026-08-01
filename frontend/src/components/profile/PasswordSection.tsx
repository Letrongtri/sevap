import { useState } from 'react'
import { KeyRound, Eye, EyeOff, X, Check } from 'lucide-react'
import { Input } from '../ui/Input'
import { Button } from '../ui/Button'
import { ConfirmDialog } from '../ui/ConfirmDialog'
import { SecurityIcon } from './SecurityIcon'
import { useChangeMyPassword } from '../../hooks/useUsers'
import { toast } from 'sonner'
import { validatePassword } from '../../../utils/utils'

/* ============================================================
   PasswordSection — Security card row for password management.

   View mode  → "Change Password" button on the right.
   Edit mode  → Cancel + Save buttons; two password inputs expand
                below (current + new), each with a show/hide toggle.
   On Save    → validates inline → opens ConfirmDialog → calls
                useChangeMyPassword mutation → toast feedback.
   ============================================================ */

interface PasswordForm {
    oldPassword: string
    newPassword: string
}

interface PasswordErrors {
    oldPassword?: string
    newPassword?: string
}

export function PasswordSection() {
    const changePasswordMutation = useChangeMyPassword()

    const [isEditing, setIsEditing] = useState(false)
    const [showConfirm, setShowConfirm] = useState(false)
    const [showOld, setShowOld] = useState(false)
    const [showNew, setShowNew] = useState(false)

    const [form, setForm] = useState<PasswordForm>({
        oldPassword: '',
        newPassword: '',
    })
    const [errors, setErrors] = useState<PasswordErrors>({})

    const setField = (key: keyof PasswordForm, value: string) => {
        setForm((prev) => ({ ...prev, [key]: value }))
        setErrors((prev) => ({ ...prev, [key]: undefined }))
    }

    const handleCancel = () => {
        setIsEditing(false)
        setForm({ oldPassword: '', newPassword: '' })
        setErrors({})
    }

    const validate = (): boolean => {
        const next: PasswordErrors = {}
        if (!form.oldPassword.trim())
            next.oldPassword = 'Mật khẩu hiện tại không được để trống.'
        if (!form.newPassword.trim())
            next.newPassword = 'Mật khẩu mới không được để trống.'
        else if (!validatePassword(form.newPassword))
            next.newPassword =
                'Mật khẩu phải có ít nhất 8 ký tự, bao gồm ít nhất một chữ hoa, một chữ thường và một chữ số.'
        else if (form.newPassword === form.oldPassword)
            next.newPassword =
                'Mật khẩu mới phải khác mật khẩu hiện tại.'
        setErrors(next)
        return Object.keys(next).length === 0
    }

    const handleSaveClick = () => {
        if (!validate()) return
        setShowConfirm(true)
    }

    const handleConfirm = () => {
        changePasswordMutation.mutate(
            {
                payload: {
                    old_password: form.oldPassword,
                    new_password: form.newPassword,
                },
            },
            {
                onSuccess: () => {
                    setShowConfirm(false)
                    handleCancel()
                    toast.success('Đã đổi mật khẩu', {
                        description:
                            'Mật khẩu của bạn đã được cập nhật thành công.',
                    })
                },
                onError: (err: unknown) => {
                    setShowConfirm(false)
                    const msg =
                        (
                            err as {
                                response?: { data?: { detail?: string } }
                            }
                        )?.response?.data?.detail ??
                        'Đổi mật khẩu thất bại. Vui lòng thử lại.'
                    toast.error('Đổi mật khẩu thất bại', { description: msg })
                },
            }
        )
    }

    const isPending = changePasswordMutation.isPending

    return (
        <>
            <div className="flex flex-col gap-1">
                {/* ── Header row (always visible) ──────────────── */}
                <div className="flex items-center justify-between px-6 py-5">
                    <div className="flex items-center gap-3">
                        <SecurityIcon>
                            <KeyRound className="w-4 h-4" />
                        </SecurityIcon>
                        <p className="text-sm font-semibold text-text-primary">
                            Mật khẩu
                        </p>
                    </div>

                    {isEditing ? (
                        <div className="flex items-center gap-2">
                            <Button
                                id="password-cancel-btn"
                                variant="secondary"
                                size="sm"
                                leftIcon={<X className="w-3.5 h-3.5" />}
                                onClick={handleCancel}
                                disabled={isPending}
                            >
                                Hủy
                            </Button>
                            <Button
                                id="password-save-btn"
                                variant="primary"
                                size="sm"
                                leftIcon={<Check className="w-3.5 h-3.5" />}
                                onClick={handleSaveClick}
                                disabled={isPending}
                            >
                                Lưu
                            </Button>
                        </div>
                    ) : (
                        <button
                            id="security-change-password-btn"
                            onClick={() => setIsEditing(true)}
                            className="px-3.5 py-1.5 rounded-lg text-xs font-semibold text-text-secondary border border-border bg-surface hover:bg-bg transition-all duration-150"
                        >
                            Đổi mật khẩu
                        </button>
                    )}
                </div>

                {/* ── Inline password form (edit mode only) ──────── */}
                {isEditing && (
                    <div className="px-6 pb-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <Input
                            id="password-old-input"
                            label="Mật khẩu hiện tại"
                            type={showOld ? 'text' : 'password'}
                            value={form.oldPassword}
                            onChange={(e) =>
                                setField('oldPassword', e.target.value)
                            }
                            errorText={errors.oldPassword}
                            required
                            leftIcon={<KeyRound className="w-4 h-4" />}
                            rightElement={
                                <button
                                    type="button"
                                    tabIndex={-1}
                                    onClick={() => setShowOld((v) => !v)}
                                    className="text-text-placeholder hover:text-text-secondary transition-colors"
                                >
                                    {showOld ? (
                                        <EyeOff className="w-4 h-4" />
                                    ) : (
                                        <Eye className="w-4 h-4" />
                                    )}
                                </button>
                            }
                        />
                        <Input
                            id="password-new-input"
                            label="Mật khẩu mới"
                            type={showNew ? 'text' : 'password'}
                            value={form.newPassword}
                            onChange={(e) =>
                                setField('newPassword', e.target.value)
                            }
                            errorText={errors.newPassword}
                            helperText="Tối thiểu 8 ký tự"
                            required
                            leftIcon={<KeyRound className="w-4 h-4" />}
                            rightElement={
                                <button
                                    type="button"
                                    tabIndex={-1}
                                    onClick={() => setShowNew((v) => !v)}
                                    className="text-text-placeholder hover:text-text-secondary transition-colors"
                                >
                                    {showNew ? (
                                        <EyeOff className="w-4 h-4" />
                                    ) : (
                                        <Eye className="w-4 h-4" />
                                    )}
                                </button>
                            }
                        />
                    </div>
                )}
            </div>

            {/* ── Confirm dialog ────────────────────────────── */}
            <ConfirmDialog
                isOpen={showConfirm}
                onClose={() => setShowConfirm(false)}
                onConfirm={handleConfirm}
                title="Xác nhận đổi mật khẩu?"
                description="Mật khẩu mới sẽ có hiệu lực ngay lập tức. Bạn vẫn sẽ duy trì đăng nhập trên thiết bị này."
                confirmLabel="Đổi mật khẩu"
                variant="danger"
                isLoading={isPending}
            />
        </>
    )
}
