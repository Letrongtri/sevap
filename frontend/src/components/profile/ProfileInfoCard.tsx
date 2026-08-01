import React, { useState, useCallback } from 'react'
import {
    User as UserIcon,
    Mail,
    Shield,
    Building2,
    Briefcase,
    IdCard,
    Clock,
    Pencil,
    X,
    Check,
} from 'lucide-react'
import { Button } from '../ui/Button'
import { CardHeader } from './CardHeader'
import { ProfileInfoField } from './ProfileInfoField'
import { ReadOnlyField } from './ReadOnlyField'
import { useMyProfileStore } from '../../store/myProfileStore'
import { stringToLabel } from '../../../utils/utils'
import { formatDateTimeToDDMMYYYY } from '../../../utils/formater'
import type {
    InfoField,
    ProfileFormValues,
    ProfileFormErrors,
} from '../../types/myProfile'
import type { User } from '../../types/user'
import { useUpdateMyProfile } from '../../hooks/useUsers'
import { useAuthStore } from '../../store/authStore'
import { toast } from 'sonner'

/* ============================================================
   ProfileInfoCard — Card 1: merged profile info
   Sections: Personal Information | Account Details | Organization
   ============================================================ */

interface ProfileInfoCardProps {
    user: User
    onSaveSuccess: () => void
}

export default function ProfileInfoCard({
    user,
    onSaveSuccess,
}: ProfileInfoCardProps) {
    const { isUpdatingProfile, setIsUpdatingProfile } = useMyProfileStore()
    const { updateUser } = useAuthStore()
    const updateProfileMutation = useUpdateMyProfile()

    const roleLabel = stringToLabel(
        user?.roles?.map((r) => stringToLabel(r.name)).join(', ') || 'Nhân viên'
    )

    /* ── form state ─────────────────────────────────────────── */
    const [form, setForm] = useState<ProfileFormValues>({
        fullName: user?.full_name ?? '',
        email: user?.email ?? '',
    })
    const [formError, setFormError] = useState<ProfileFormErrors>({})

    const setField = useCallback(
        <K extends keyof ProfileFormValues>(
            key: K,
            value: ProfileFormValues[K]
        ) => {
            setForm((prev) => ({ ...prev, [key]: value }))
            setFormError((prev) => ({ ...prev, [key]: undefined }))
        },
        []
    )

    const handleCancel = () => {
        setForm({ fullName: user?.full_name ?? '', email: user?.email ?? '' })
        setFormError({})
        setIsUpdatingProfile(false)
    }

    const validate = (): boolean => {
        const next: ProfileFormErrors = {}
        if (!form.fullName.trim()) next.fullName = 'Họ và tên không được để trống.'
        if (form.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email))
            next.email = 'Vui lòng nhập địa chỉ email hợp lệ.'
        setFormError(next)
        return Object.keys(next).length === 0
    }

    const handleSave = () => {
        if (!validate()) return
        setFormError({})

        updateProfileMutation.mutate(
            {
                payload: {
                    full_name: form.fullName.trim() || undefined,
                    email: form.email.trim() || undefined,
                },
            },
            {
                onSuccess: (data) => {
                    // Keep authStore in sync so sidebar/header re-render
                    updateUser({
                        fullName: data.full_name,
                    })
                    setIsUpdatingProfile(false)
                    onSaveSuccess()
                },
                onError: (err: any) => {
                    const msg: string =
                        err?.response?.data?.detail ??
                        'Cập nhật hồ sơ thất bại. Vui lòng thử lại.'
                    toast.error('Cập nhật thất bại', { description: msg })
                    setIsUpdatingProfile(false)
                },
            }
        )
    }

    /* ── static field lists ─────────────────────────────────── */
    const accountDetails: InfoField[] = [
        {
            icon: <IdCard className="w-4 h-4" />,
            label: 'Mã nhân viên',
            value: user?.employee_code ?? '—',
        },
        {
            icon: <Shield className="w-4 h-4" />,
            label: 'Vai trò',
            value: roleLabel,
        },
        {
            icon: <Clock className="w-4 h-4" />,
            label: 'Đăng nhập gần nhất',
            value: formatDateTimeToDDMMYYYY(user?.last_login || ''),
        },
    ]

    const orgDetails: InfoField[] = [
        ...(user?.tenant?.company_name
            ? [
                  {
                      icon: <Building2 className="w-4 h-4" />,
                      label: 'Công ty',
                      value: user.tenant.company_name,
                  },
              ]
            : []),
        ...(user?.department
            ? [
                  {
                      icon: <Building2 className="w-4 h-4" />,
                      label: 'Phòng ban',
                      value: user.department.name,
                  },
              ]
            : []),
        ...(user?.job_title
            ? [
                  {
                      icon: <Briefcase className="w-4 h-4" />,
                      label: 'Chức danh',
                      value: user.job_title.title_name,
                  },
              ]
            : []),
        ...(user?.tenant?.tenant_domain
            ? [
                  {
                      icon: <IdCard className="w-4 h-4" />,
                      label: 'Tên miền',
                      value: `${user.tenant.tenant_domain}`,
                  },
              ]
            : []),
    ]

    return (
        <div className="bg-surface rounded-2xl border border-border shadow-sm">
            {/* Card header */}
            <CardHeader
                title="Thông tin cá nhân"
                subtitle="Quản lý chi tiết thông tin cá nhân của bạn"
                icon={
                    <UserIcon
                        style={{ width: 18, height: 18 }}
                        className="text-primary"
                    />
                }
            >
                {isUpdatingProfile ? (
                    <>
                        <Button
                            id="profile-cancel-btn"
                            variant="secondary"
                            size="sm"
                            leftIcon={<X className="w-3.5 h-3.5" />}
                            onClick={handleCancel}
                            disabled={updateProfileMutation.isPending}
                        >
                            Hủy
                        </Button>
                        <Button
                            id="profile-save-btn"
                            variant="primary"
                            size="sm"
                            isLoading={updateProfileMutation.isPending}
                            loadingText="Đang lưu…"
                            leftIcon={
                                !updateProfileMutation.isPending ? (
                                    <Check className="w-3.5 h-3.5" />
                                ) : undefined
                            }
                            onClick={handleSave}
                        >
                            Lưu thay đổi
                        </Button>
                    </>
                ) : (
                    <Button
                        id="profile-edit-btn"
                        variant="secondary"
                        size="sm"
                        leftIcon={<Pencil className="w-3.5 h-3.5" />}
                        onClick={() => setIsUpdatingProfile(true)}
                    >
                        Chỉnh sửa hồ sơ
                    </Button>
                )}
            </CardHeader>

            {/* Card body */}
            <div className="p-6">
                {/* ── Personal Information ──────────────────── */}
                <SectionLabel>Thông tin cá nhân</SectionLabel>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4 mb-6">
                    <ProfileInfoField
                        id="profile-fullname-input"
                        label="Họ và tên"
                        value={form.fullName}
                        required
                        editMode={isUpdatingProfile}
                        leftIcon={<UserIcon className="w-4 h-4" />}
                        errorText={formError.fullName}
                        onChange={(v) => setField('fullName', v)}
                    />
                    <ProfileInfoField
                        id="profile-email-input"
                        label="Địa chỉ Email"
                        type="email"
                        value={form.email}
                        editMode={isUpdatingProfile}
                        leftIcon={<Mail className="w-4 h-4" />}
                        errorText={formError.email}
                        onChange={(v) => setField('email', v)}
                    />
                </div>

                {/* ── Account Details ───────────────────────── */}
                <div className="border-t border-border/50 pt-6 mb-6">
                    <SectionLabel>Chi tiết tài khoản</SectionLabel>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-4">
                        {accountDetails.map((f) => (
                            <ReadOnlyField
                                key={f.label}
                                icon={f.icon}
                                label={f.label}
                                value={f.value}
                            />
                        ))}
                    </div>
                </div>

                {/* ── Organization ──────────────────────────── */}
                {orgDetails.length > 0 && (
                    <div className="border-t border-border/50 pt-6">
                        <SectionLabel>Tổ chức</SectionLabel>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-4">
                            {orgDetails.map((f) => (
                                <ReadOnlyField
                                    key={f.label}
                                    icon={f.icon}
                                    label={f.label}
                                    value={f.value}
                                />
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}

/* ─── tiny helper ────────────────────────────────────────── */
function SectionLabel({ children }: { children: React.ReactNode }) {
    return (
        <p className="text-xs font-semibold text-text-placeholder uppercase tracking-wider mb-4">
            {children}
        </p>
    )
}
