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
            next.oldPassword = 'Current password is required.'
        if (!form.newPassword.trim())
            next.newPassword = 'New password is required.'
        else if (!validatePassword(form.newPassword))
            next.newPassword =
                'Password must be at least 8 characters, contain at least one uppercase letter, one lowercase letter, and one number.'
        else if (form.newPassword === form.oldPassword)
            next.newPassword =
                'New password must be different from current password.'
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
                    toast.success('Password changed', {
                        description:
                            'Your password has been updated successfully.',
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
                        'Failed to change password. Please try again.'
                    toast.error('Password change failed', { description: msg })
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
                            Password
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
                                Cancel
                            </Button>
                            <Button
                                id="password-save-btn"
                                variant="primary"
                                size="sm"
                                leftIcon={<Check className="w-3.5 h-3.5" />}
                                onClick={handleSaveClick}
                                disabled={isPending}
                            >
                                Save
                            </Button>
                        </div>
                    ) : (
                        <button
                            id="security-change-password-btn"
                            onClick={() => setIsEditing(true)}
                            className="px-3.5 py-1.5 rounded-lg text-xs font-semibold text-text-secondary border border-border bg-surface hover:bg-bg transition-all duration-150"
                        >
                            Change Password
                        </button>
                    )}
                </div>

                {/* ── Inline password form (edit mode only) ──────── */}
                {isEditing && (
                    <div className="px-6 pb-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <Input
                            id="password-old-input"
                            label="Current Password"
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
                            label="New Password"
                            type={showNew ? 'text' : 'password'}
                            value={form.newPassword}
                            onChange={(e) =>
                                setField('newPassword', e.target.value)
                            }
                            errorText={errors.newPassword}
                            helperText="Minimum 8 characters"
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
                title="Change your password?"
                description="This will update your login credentials immediately. You will remain logged in on this device."
                confirmLabel="Yes, change it"
                variant="danger"
                isLoading={isPending}
            />
        </>
    )
}
