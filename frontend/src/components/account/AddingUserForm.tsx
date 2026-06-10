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

const AddingUserForm = ({
    onCreateUser,
    isSubmitting,
    setFormError,
    setFormSuccess,
    onCloseCard,
}: {
    onCreateUser: (payload: AddUserPayload) => void
    isSubmitting: boolean
    setFormError: (error: string | null) => void
    setFormSuccess: (success: string | null) => void
    onCloseCard: () => void
}) => {
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
            setFormError(
                'Please fill in employee code, full name, and password.'
            )
            return
        }

        setFormError(null)
        setFormSuccess(null)

        const payload: AddUserPayload = {
            employee_code: newEmployeeCode,
            full_name: newFullName,
            email: newEmail.trim(),
            password: newPassword,
            job_title_id: jobTitleId,
            department_id: departmentId,
            role_ids: roleIds,
        }
        onCreateUser(payload)
    }
    return (
        <form onSubmit={handleCreateUser} className="space-y-4">
            <Input
                label="Employee Code *"
                placeholder="e.g. EMP-0105"
                value={newEmployeeCode}
                onChange={(e) => setNewEmployeeCode(e.target.value)}
                leftIcon={<UserIcon className="w-4 h-4" />}
                required
            />

            <Input
                label="Full Name *"
                placeholder="e.g. Nguyen Van A"
                value={newFullName}
                onChange={(e) => setNewFullName(e.target.value)}
                leftIcon={<UserIcon className="w-4 h-4" />}
                required
            />

            <Input
                label="Email Address"
                type="email"
                placeholder="e.g. user@company.local"
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
                    placeholder="Select Department"
                    label="Department"
                />
                <SearchableSelect
                    options={jobTitleOptions}
                    value={jobTitleId}
                    onChange={(val) => {
                        setJobTitleId(val)
                    }}
                    placeholder="Select Job Title"
                    label="Job Title"
                />
            </div>

            <SearchableMultiSelect
                options={roleOptions}
                value={roleIds}
                onChange={(val) => {
                    setRoleIds(val)
                }}
                placeholder="Select Roles"
                label="Roles"
            />

            <div className="space-y-1.5">
                <Input
                    label="Password *"
                    type="password"
                    placeholder="Min 8 characters, mix of A-Z, a-z, 0-9, symbol"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    leftIcon={<Lock className="w-4 h-4" />}
                    required
                />
                <p className="text-[10px] text-text-placeholder leading-normal">
                    Must be 8+ chars, contain an uppercase letter, lowercase
                    letter, number, and special character.
                </p>
            </div>

            <div className="flex gap-2.5 pt-2">
                <Button
                    type="submit"
                    variant="primary"
                    fullWidth
                    isLoading={isSubmitting}
                    loadingText="Registering..."
                >
                    Create Account
                </Button>
                <Button
                    type="button"
                    variant="secondary"
                    onClick={onCloseCard}
                    disabled={isSubmitting}
                >
                    Cancel
                </Button>
            </div>
        </form>
    )
}

export default AddingUserForm
