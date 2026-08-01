import { useState } from 'react'
import Input from '../ui/Input'
import { Mail, UserIcon } from 'lucide-react'
import Button from '../ui/Button'
import { RefreshCw } from 'lucide-react'
import { Trash2 } from 'lucide-react'
import type { UpdateUserPayload, User } from '../../types/user'
import type { ID } from '../../types/common'
import SearchableMultiSelect from '../ui/SearchableMultiSelect'
import SearchableSelect from '../ui/SearchableSelect'
import { useSimpleDepartments } from '../../hooks/useSimpleDepartments'
import { useSimpleJobTitles } from '../../hooks/useSimpleJobTitles'
import { useSimpleRoles } from '../../hooks/useSimpleRoles'
import { formatDateTimeToDDMMYYYY } from '../../../utils/formater'
import {
    useDeleteUser,
    useResetUserPassword,
    useToggleUserStatus,
    useUpdateUser,
} from '../../hooks/useUsers'
import { toast } from 'sonner'
import { useUserStore } from '../../store/usersStore'
import ConfirmDialog from '../ui/ConfirmDialog'
import { usePermission } from '../../hooks/usePermission'
import { PERMISSIONS } from '../../lib/permissions'

const DetailAccountForm = ({ selectedUser }: { selectedUser: User }) => {
    const setActiveUserId = useUserStore((s) => s.setActiveUserId)
    const canUpdate  = usePermission(PERMISSIONS.USERS_UPDATE)
    const canSuspend = usePermission(PERMISSIONS.USERS_SUSPEND)
    const canDelete  = usePermission(PERMISSIONS.USERS_DELETE)

    const [editFullName, setEditFullName] = useState(
        selectedUser?.full_name || ''
    )
    const [editEmail, setEditEmail] = useState(selectedUser?.email || '')
    const [editIsActive, setEditIsActive] = useState(
        selectedUser?.is_active ?? true
    )

    const [departmentId, setDepartmentId] = useState<ID | null>(
        selectedUser?.department_id || null
    )
    const [jobTitleId, setJobTitleId] = useState<ID | null>(
        selectedUser?.job_title_id || null
    )
    const [roleIds, setRoleIds] = useState<ID[]>(
        selectedUser?.roles?.map((r) => r.id) || []
    )

    // Fetch metadata
    const { data: departmentsData } = useSimpleDepartments()
    const { data: jobTitlesData } = useSimpleJobTitles()
    const { data: rolesData } = useSimpleRoles()

    // Mutation hooks
    const updateUserMutation = useUpdateUser()
    const toggleStatusMutation = useToggleUserStatus()
    const deleteUserMutation = useDeleteUser()
    const resetPasswordMutation = useResetUserPassword()

    // Map metadata to select options
    const departmentOptions =
        departmentsData?.map((d) => ({
            value: d.id,
            label: d.name,
        })) ?? []

    const jobTitleOptions =
        jobTitlesData?.map((j) => ({
            value: j.id,
            label: j.title_name,
        })) ?? []

    const roleOptions =
        rolesData?.map((r) => ({
            value: r.id,
            label: r.name,
        })) ?? []

    // Delete confirmation state
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
    const [showResetPasswordConfirm, setShowResetPasswordConfirm] =
        useState(false)
    const [showActiveToggleConfirm, setShowActiveToggleConfirm] =
        useState(false)

    const handleUpdateUser = (e: React.SyntheticEvent<HTMLFormElement>) => {
        e.preventDefault()
        if (!selectedUser) return

        const payload: UpdateUserPayload = {
            id: selectedUser.id,
            full_name: editFullName.trim(),
            email: editEmail.trim() ? editEmail.trim() : null,
            department_id: departmentId,
            job_title_id: jobTitleId,
            role_ids: roleIds,
        }
        updateUserMutation.mutate(
            {
                id: payload.id,
                payload: {
                    full_name: payload.full_name,
                    email: payload.email,
                    department_id: payload.department_id ?? undefined,
                    job_title_id: payload.job_title_id ?? undefined,
                    role_ids: payload.role_ids,
                },
            },
            {
                onSuccess: async () => {
                    toast.success('Cập nhật tài khoản thành công!')
                },
                onError: (err: any) => {
                    toast.error(
                        err.response?.data?.detail ??
                            'Cập nhật tài khoản thất bại.'
                    )
                },
            }
        )
    }

    const handleResetPassword = () => {
        if (!selectedUser) return
        if (
            !window.confirm(
                `Bạn có chắc chắn muốn đặt lại mật khẩu cho ${selectedUser.full_name} về mật khẩu mặc định?`
            )
        ) {
            return
        }

        resetPasswordMutation.mutate(selectedUser.id, {
            onSuccess: () => {
                toast.success('Đặt lại mật khẩu thành công về mặc định.')
            },
            onError: (err: any) => {
                toast.error(
                    err.response?.data?.detail ?? 'Đặt lại mật khẩu thất bại.'
                )
            },
        })
    }

    const handleDeleteUser = () => {
        if (!selectedUser) return

        deleteUserMutation.mutate(selectedUser.id, {
            onSuccess: () => {
                toast.success('Xóa tài khoản thành công.')
                setActiveUserId(null)
            },
            onError: (err: any) => {
                toast.error(
                    err.response?.data?.detail ?? 'Xóa tài khoản thất bại.'
                )
            },
        })
    }

    const handleToggleUserStatus = () => {
        if (!selectedUser) return

        toggleStatusMutation.mutate(
            { id: selectedUser.id, active: !editIsActive },
            {
                onSuccess: () => {
                    toast.success(
                        `Đã ${!editIsActive ? 'kích hoạt' : 'vô hiệu hóa'} tài khoản thành công.`
                    )
                },
                onError: (err: any) => {
                    toast.error(
                        err.response?.data?.detail ??
                            'Thao tác trạng thái tài khoản thất bại.'
                    )
                },
            }
        )

        setEditIsActive(!editIsActive)
    }

    const isSubmitting =
        updateUserMutation.isPending ||
        toggleStatusMutation.isPending ||
        deleteUserMutation.isPending ||
        resetPasswordMutation.isPending

    return (
        <div className="space-y-6">
            {/* Form: Update Details */}
            <form onSubmit={handleUpdateUser} className="space-y-4">
                <Input
                    label="Mã nhân viên"
                    placeholder="ví dụ: NV-0105"
                    value={selectedUser.employee_code}
                    readOnly
                    leftIcon={<UserIcon className="w-4 h-4" />}
                    disabled
                />

                <Input
                    label="Họ và tên"
                    placeholder="Họ và tên người dùng"
                    value={editFullName}
                    onChange={(e) => setEditFullName(e.target.value)}
                    leftIcon={<UserIcon className="w-4 h-4" />}
                />

                <Input
                    label="Địa chỉ Email"
                    type="email"
                    placeholder="Email người dùng"
                    value={editEmail}
                    onChange={(e) => setEditEmail(e.target.value)}
                    leftIcon={<Mail className="w-4 h-4" />}
                />

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <SearchableSelect
                        options={departmentOptions}
                        value={departmentId}
                        onChange={(val) => {
                            setDepartmentId(val)
                        }}
                        placeholder="Chọn phòng ban"
                        label="Phòng ban"
                    />
                    <SearchableSelect
                        options={jobTitleOptions}
                        value={jobTitleId}
                        onChange={(val) => {
                            setJobTitleId(val)
                        }}
                        placeholder="Chọn chức danh"
                        label="Chức danh"
                    />
                </div>

                <SearchableMultiSelect
                    options={roleOptions}
                    value={roleIds}
                    onChange={(val) => {
                        setRoleIds(val)
                    }}
                    placeholder="Chọn vai trò"
                    label="Vai trò"
                />

                {/* Save details button */}
                {canUpdate && (
                    <Button
                        type="submit"
                        variant="primary"
                        fullWidth
                        isLoading={isSubmitting}
                        loadingText="Đang lưu..."
                    >
                        Lưu thay đổi
                    </Button>
                )}
            </form>

            {/* Section: Admin Quick Settings */}
            <div className="border-t border-border/60 pt-4 space-y-3">
                <h4 className="text-xs font-bold text-text-placeholder uppercase tracking-wider">
                    Bảo mật & Quản lý
                </h4>

                {/* Created at */}
                <div className="flex items-center justify-between p-3">
                    <p className="text-sm font-medium text-text-secondary">
                        Ngày tạo tài khoản
                    </p>
                    <p className="text-sm font-medium text-text-secondary">
                        {formatDateTimeToDDMMYYYY(
                            selectedUser.created_at.toString()
                        )}
                    </p>
                </div>

                {/* Status toggle slider — requires users:suspend */}
                {canSuspend && (
                    <div className="flex items-center justify-between p-3 bg-surface-raised border border-border rounded-xl">
                        <div>
                            <p className="text-sm font-semibold text-text-secondary">
                                Trạng thái tài khoản
                            </p>
                            <p className="text-[10px] text-text-placeholder mt-0.5">
                                Bật/tắt trạng thái hoạt động
                            </p>
                        </div>
                        <button
                            type="button"
                            onClick={() => setShowActiveToggleConfirm(true)}
                            className={[
                                'relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none',
                                editIsActive ? 'bg-success' : 'bg-[#D4D7DE]',
                            ].join(' ')}
                        >
                            <span
                                className={[
                                    'pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out',
                                    editIsActive
                                        ? 'translate-x-5'
                                        : 'translate-x-0',
                                ].join(' ')}
                            />
                        </button>
                    </div>
                )}

                {/* Password Reset button — requires users:update */}
                {canUpdate && (
                    <div className="flex items-center justify-between gap-4 p-3 hover:bg-bg/20 rounded-xl transition-all">
                        <div>
                            <p className="text-sm font-semibold text-text-secondary">
                                Đặt lại mật khẩu
                            </p>
                            <p className="text-[10px] text-text-placeholder leading-normal mt-0.5">
                                Đặt lại mật khẩu về mặc định
                            </p>
                        </div>
                        <Button
                            variant="secondary"
                            size="sm"
                            leftIcon={<RefreshCw className="w-3.5 h-3.5" />}
                            onClick={() => setShowResetPasswordConfirm(true)}
                            disabled={isSubmitting}
                        >
                            Đặt lại
                        </Button>
                    </div>
                )}

                {/* Delete Account button — requires users:delete */}
                {canDelete && (
                    <div className="flex items-center justify-between gap-4 p-3 bg-error-bg/30 border border-error-border/60 rounded-xl">
                        <div>
                            <p className="text-sm font-semibold text-error-text">
                                Xóa tài khoản
                            </p>
                            <p className="text-[10px] text-text-placeholder leading-normal mt-0.5">
                                Xóa vĩnh viễn hồ sơ và nhật ký người dùng
                            </p>
                        </div>
                        <Button
                            variant="danger"
                            size="sm"
                            leftIcon={<Trash2 className="w-3.5 h-3.5" />}
                            onClick={() => setShowDeleteConfirm(true)}
                            disabled={isSubmitting}
                        >
                            Xóa
                        </Button>
                    </div>
                )}

                <ConfirmDialog
                    isOpen={showDeleteConfirm}
                    onClose={() => setShowDeleteConfirm(false)}
                    onConfirm={handleDeleteUser}
                    title="Xóa tài khoản?"
                    description="Hành động này sẽ xóa tài khoản ngay lập tức và không thể hoàn tác."
                    confirmLabel="Xóa tài khoản"
                    variant="danger"
                    isLoading={isSubmitting}
                />

                <ConfirmDialog
                    isOpen={showResetPasswordConfirm}
                    onClose={() => setShowResetPasswordConfirm(false)}
                    onConfirm={handleResetPassword}
                    title="Đặt lại mật khẩu?"
                    description="Hành động này sẽ đặt lại mật khẩu tài khoản về mặc định (password)."
                    confirmLabel="Đặt lại mật khẩu"
                    variant="danger"
                    isLoading={isSubmitting}
                />

                <ConfirmDialog
                    isOpen={showActiveToggleConfirm}
                    onClose={() => setShowActiveToggleConfirm(false)}
                    onConfirm={handleToggleUserStatus}
                    title="Thay đổi trạng thái tài khoản?"
                    description="Hành động này sẽ thay đổi trạng thái hoạt động của tài khoản."
                    confirmLabel="Xác nhận thay đổi"
                    variant="danger"
                    isLoading={isSubmitting}
                />
            </div>
        </div>
    )
}

export default DetailAccountForm
