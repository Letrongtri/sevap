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

const DetailAccountForm = ({
    selectedUser,
    onUpdateUser,
    onResetPassword,
    onDeleteUser,
    onToggleUserStatus,
    isSubmitting,
    setFormError,
    setFormSuccess,
}: {
    selectedUser: User
    onUpdateUser: (payload: UpdateUserPayload) => void
    onResetPassword: (id: ID) => void
    onDeleteUser: (id: ID) => void
    onToggleUserStatus: (id: ID, status: boolean) => void
    isSubmitting: boolean
    setFormError: (error: string | null) => void
    setFormSuccess: (success: string | null) => void
}) => {
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

    const handleUpdateUser = (e: React.SyntheticEvent<HTMLFormElement>) => {
        e.preventDefault()
        if (!selectedUser) return

        setFormError(null)
        setFormSuccess(null)

        const payload: UpdateUserPayload = {
            id: selectedUser.id,
            full_name: editFullName.trim(),
            email: editEmail.trim() ? editEmail.trim() : null,
        }
        onUpdateUser(payload)
    }

    const handleResetPassword = () => {
        if (!selectedUser) return
        if (
            !window.confirm(
                `Are you sure you want to reset password for ${selectedUser.full_name} to the default password?`
            )
        ) {
            return
        }

        setFormError(null)
        setFormSuccess(null)

        onResetPassword(selectedUser.id)
    }

    const handleDeleteUser = () => {
        if (!selectedUser) return

        setFormError(null)
        setFormSuccess(null)

        onDeleteUser(selectedUser.id)
    }

    const handleToggleUserStatus = () => {
        if (!selectedUser) return

        setFormError(null)
        setFormSuccess(null)

        onToggleUserStatus(selectedUser.id, !editIsActive)

        setEditIsActive(!editIsActive)
    }

    return (
        <div className="space-y-6">
            {/* Form: Update Details */}
            <form onSubmit={handleUpdateUser} className="space-y-4">
                <Input
                    label="Employee Code"
                    placeholder="e.g. EMP-0105"
                    value={selectedUser.employee_code}
                    readOnly
                    leftIcon={<UserIcon className="w-4 h-4" />}
                    disabled
                />

                <Input
                    label="Full Name"
                    placeholder="User full name"
                    value={editFullName}
                    onChange={(e) => setEditFullName(e.target.value)}
                    leftIcon={<UserIcon className="w-4 h-4" />}
                />

                <Input
                    label="Email Address"
                    type="email"
                    placeholder="User email"
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

                {/* Save details button */}
                <Button
                    type="submit"
                    variant="primary"
                    fullWidth
                    isLoading={isSubmitting}
                    loadingText="Saving..."
                >
                    Save Changes
                </Button>
            </form>

            {/* Section: Admin Quick Settings */}
            <div className="border-t border-border/60 pt-4 space-y-3">
                <h4 className="text-xs font-bold text-text-placeholder uppercase tracking-wider">
                    Security & Management
                </h4>

                {/* Status toggle slider */}
                <div className="flex items-center justify-between p-3 bg-surface-raised border border-border rounded-xl">
                    <div>
                        <p className="text-sm font-semibold text-text-secondary">
                            Account Status
                        </p>
                        <p className="text-[10px] text-text-placeholder mt-0.5">
                            Toggle active or inactive status
                        </p>
                    </div>
                    <button
                        type="button"
                        onClick={handleToggleUserStatus}
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

                {/* Password Reset button */}
                <div className="flex items-center justify-between gap-4 p-3 hover:bg-bg/20 rounded-xl transition-all">
                    <div>
                        <p className="text-xs font-semibold text-text-secondary">
                            Reset Password
                        </p>
                        <p className="text-[10px] text-text-placeholder leading-normal mt-0.5">
                            Resets password to default ('password')
                        </p>
                    </div>
                    <Button
                        variant="secondary"
                        size="sm"
                        leftIcon={<RefreshCw className="w-3.5 h-3.5" />}
                        onClick={handleResetPassword}
                        disabled={isSubmitting}
                    >
                        Reset
                    </Button>
                </div>

                {/* Delete Account button */}
                {!showDeleteConfirm ? (
                    <div className="flex items-center justify-between gap-4 p-3 hover:bg-error-bg/10 rounded-xl transition-all">
                        <div>
                            <p className="text-xs font-semibold text-error-text">
                                Delete Account
                            </p>
                            <p className="text-[10px] text-text-placeholder leading-normal mt-0.5">
                                Permanently delete user profile and logs
                            </p>
                        </div>
                        <Button
                            variant="danger"
                            size="sm"
                            leftIcon={<Trash2 className="w-3.5 h-3.5" />}
                            onClick={() => setShowDeleteConfirm(true)}
                            disabled={isSubmitting}
                        >
                            Delete
                        </Button>
                    </div>
                ) : (
                    <div className="p-3.5 bg-error-bg/30 border border-error-border/60 rounded-xl space-y-2.5 animate-fade-in">
                        <p className="text-xs font-semibold text-error-text">
                            Confirm Deletion?
                        </p>
                        <p className="text-[10px] text-text-secondary leading-normal">
                            This action is irreversible and will delete all
                            session logs for this user.
                        </p>
                        <div className="flex gap-2">
                            <Button
                                variant="danger"
                                size="sm"
                                onClick={handleDeleteUser}
                                isLoading={isSubmitting}
                                loadingText="Deleting..."
                                fullWidth
                            >
                                Yes, Delete
                            </Button>
                            <Button
                                variant="secondary"
                                size="sm"
                                onClick={() => setShowDeleteConfirm(false)}
                                disabled={isSubmitting}
                                fullWidth
                            >
                                Cancel
                            </Button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}

export default DetailAccountForm
