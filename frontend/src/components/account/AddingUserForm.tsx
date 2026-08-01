import { useState } from 'react'
import Input from '../ui/Input'
import { Mail, UserIcon, Lock } from 'lucide-react'
import Button from '../ui/Button'
import type { AddUserPayload } from '../../types/user'
import SearchableSelect from '../ui/SearchableSelect'
import SearchableMultiSelect from '../ui/SearchableMultiSelect'
import { useSimpleDepartments } from '../../hooks/useSimpleDepartments'
import { useSimpleJobTitles } from '../../hooks/useSimpleJobTitles'
import { useSimpleRoles } from '../../hooks/useSimpleRoles'
import type { ID } from '../../types/common'
import { toast } from 'sonner'
import { useCreateUser } from '../../hooks/useUsers'
import { useUserStore } from '../../store/usersStore'

const AddingUserForm = () => {
    const setActiveUserId = useUserStore((s) => s.setActiveUserId)
    const setIsAddingUser = useUserStore((s) => s.setIsAddingUser)

    const createUserMutation = useCreateUser()

    // Add user form inputs
    const [newEmployeeCode, setNewEmployeeCode] = useState('')
    const [newFullName, setNewFullName] = useState('')
    const [newEmail, setNewEmail] = useState('')
    const [newPassword, setNewPassword] = useState('')
    const [departmentId, setDepartmentId] = useState<ID | null>(null)
    const [jobTitleId, setJobTitleId] = useState<ID | null>(null)
    const [roleIds, setRoleIds] = useState<ID[]>([])

    // Fetch metadata
    const { data: departmentsData } = useSimpleDepartments()
    const { data: jobTitlesData } = useSimpleJobTitles()
    const { data: rolesData } = useSimpleRoles()

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

    const handleCreateUser = async (
        e: React.SyntheticEvent<HTMLFormElement>
    ) => {
        e.preventDefault()
        if (
            !newEmployeeCode.trim() ||
            !newFullName.trim() ||
            !newPassword.trim()
        ) {
            toast.error(
                'Vui lòng nhập mã nhân viên, họ tên và mật khẩu.'
            )
            return
        }

        const payload: AddUserPayload = {
            employee_code: newEmployeeCode,
            full_name: newFullName,
            email: newEmail.trim(),
            password: newPassword,
            job_title_id: jobTitleId,
            department_id: departmentId,
            role_ids: roleIds,
        }

        createUserMutation.mutate(
            {
                employee_code: payload.employee_code,
                full_name: payload.full_name,
                password: payload.password,
                email: payload.email,
                job_title_id: payload.job_title_id ?? undefined,
                department_id: payload.department_id ?? undefined,
                role_ids: payload.role_ids ?? undefined,
            },
            {
                onSuccess: (created) => {
                    toast.success('Tạo tài khoản người dùng thành công!')
                    setActiveUserId(created.id)
                    setIsAddingUser(false)
                },
                onError: (err: any) => {
                    toast.error(
                        err.response?.data?.detail ??
                            'Tạo tài khoản người dùng thất bại.'
                    )
                },
            }
        )
    }
    return (
        <form onSubmit={handleCreateUser} className="space-y-4">
            <Input
                label="Mã nhân viên *"
                placeholder="ví dụ: NV-0105"
                value={newEmployeeCode}
                onChange={(e) => setNewEmployeeCode(e.target.value)}
                leftIcon={<UserIcon className="w-4 h-4" />}
                required
            />

            <Input
                label="Họ và tên *"
                placeholder="ví dụ: Nguyễn Văn A"
                value={newFullName}
                onChange={(e) => setNewFullName(e.target.value)}
                leftIcon={<UserIcon className="w-4 h-4" />}
                required
            />

            <Input
                label="Địa chỉ Email"
                type="email"
                placeholder="ví dụ: user@company.local"
                value={newEmail}
                onChange={(e) => setNewEmail(e.target.value)}
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

            <div className="space-y-1.5">
                <Input
                    label="Mật khẩu *"
                    type="password"
                    placeholder="Tối thiểu 8 ký tự, gồm chữ hoa, chữ thường, số, ký tự đặc biệt"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    leftIcon={<Lock className="w-4 h-4" />}
                    required
                />
                <p className="text-[10px] text-text-placeholder leading-normal">
                    Phải có từ 8 ký tự trở lên, bao gồm chữ hoa, chữ thường, chữ số và ký tự đặc biệt.
                </p>
            </div>

            <div className="flex gap-2.5 pt-2">
                <Button
                    type="submit"
                    variant="primary"
                    fullWidth
                    isLoading={createUserMutation.isPending}
                    loadingText="Đang đăng ký..."
                >
                    Tạo tài khoản
                </Button>
                <Button
                    type="button"
                    variant="secondary"
                    onClick={() => {
                        setActiveUserId(null)
                        setIsAddingUser(false)
                    }}
                    disabled={createUserMutation.isPending}
                >
                    Hủy
                </Button>
            </div>
        </form>
    )
}

export default AddingUserForm
