import { useState, useEffect, useRef } from 'react'
import type { Role, UpdateRolePayload } from '../../types/role'
import { useRoleStore } from '../../store/roleStore'
import { Trash2 } from 'lucide-react'
import Button from '../ui/Button'
import {
    useCreateRole,
    useDeleteRole,
    useUpdateRole,
} from '../../hooks/useRoles'
import { usePermissions } from '../../hooks/usePermissions'
import RoleInfoFields from './RoleInfoFields'
import PermissionsMatrix from './PermissionsMatrix'
import { toast } from 'sonner'
import ConfirmDialog from '../ui/ConfirmDialog'
import { usePermission } from '../../hooks/usePermission'
import { PERMISSIONS } from '../../lib/permissions'
import { useAuthStore } from '../../store/authStore'

const DetailRoleForm = ({
    selectedRole,
    onCloseCard,
}: {
    selectedRole?: Role | null
    onCloseCard: () => void
}) => {
    // Form state initialized from selectedRole props.
    // Thanks to the `key` prop in the parent component, React will mount a fresh instance
    // whenever the selected role changes, naturally resetting the state to the new role's values.
    const [editRoleName, setEditRoleName] = useState(selectedRole?.name || '')
    const [editDescription, setEditDescription] = useState(
        selectedRole?.description || ''
    )
    const [editAccessLevel, setEditAccessLevel] = useState(
        selectedRole?.access_level ?? ''
    )
    const [editPermissionIds, setEditPermissionIds] = useState<number[]>(
        selectedRole?.permissions?.map((p) => p.id) ?? []
    )

    const formRef = useRef<HTMLFormElement>(null)

    useEffect(() => {
        // Scroll the grandparent container back to the top on component mount
        const scrollContainer = formRef.current?.parentElement?.parentElement
        if (scrollContainer) {
            scrollContainer.scrollTop = 0
        }
    }, [])

    const handleTogglePermission = (permissionId: number) => {
        setEditPermissionIds((prev) =>
            prev.includes(permissionId)
                ? prev.filter((id) => id !== permissionId)
                : [...prev, permissionId]
        )
    }

    const accessLevelOptions = [
        { value: 'public', label: 'Công khai (Public)' },
        { value: 'private', label: 'Riêng tư (Private)' },
        { value: 'managerial', label: 'Quản lý (Managerial)' },
    ]

    const isAddingRole = useRoleStore((s) => s.isAddingRole)
    const setIsAddingRole = useRoleStore((s) => s.setIsAddingRole)
    const setActiveRoleId = useRoleStore((s) => s.setActiveRoleId)
    const currentUser = useAuthStore((s) => s.user)
    const isMyRole = Boolean(
        !isAddingRole &&
        currentUser?.roles &&
        selectedRole?.name &&
        currentUser.roles.includes(selectedRole.name)
    )

    const canCreate = usePermission(PERMISSIONS.ROLES_CREATE)
    const canUpdate = usePermission(PERMISSIONS.ROLES_UPDATE)
    const canDelete = usePermission(PERMISSIONS.ROLES_DELETE)
    const canSave   = isAddingRole ? canCreate : (canUpdate && !isMyRole)

    // Mutation hooks
    const createRoleMutation = useCreateRole()
    const updateRoleMutation = useUpdateRole()
    const deleteRoleMutation = useDeleteRole()

    // Fetch permission metadata
    const { data: permissionsData } = usePermissions()

    // Delete confirmation state
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)

    const isSubmitting =
        createRoleMutation.isPending ||
        updateRoleMutation.isPending ||
        deleteRoleMutation.isPending

    const handleCreateRole = async (
        e: React.SyntheticEvent<HTMLFormElement>
    ) => {
        e.preventDefault()

        createRoleMutation.mutate(
            {
                name: editRoleName.trim(),
                description: editDescription.trim()
                    ? editDescription.trim()
                    : null,
                access_level: editAccessLevel.trim(),
                permission_ids: editPermissionIds,
            },
            {
                onSuccess: (created) => {
                    toast.success('Tạo vai trò thành công!')
                    setActiveRoleId(created.id)
                    setIsAddingRole(false)
                },
                onError: (err: any) => {
                    toast.error(
                        err.response?.data?.detail ?? 'Tạo vai trò thất bại.'
                    )
                },
            }
        )
    }

    const handleUpdateRole = (e: React.SyntheticEvent<HTMLFormElement>) => {
        e.preventDefault()
        if (!selectedRole) return

        const payload: UpdateRolePayload = {
            id: selectedRole.id,
            name: editRoleName.trim(),
            description: editDescription.trim() ? editDescription.trim() : null,
            access_level: editAccessLevel.trim(),
            permission_ids: editPermissionIds,
        }

        updateRoleMutation.mutate(
            {
                id: selectedRole.id,
                payload: {
                    id: selectedRole.id,
                    name: payload.name,
                    description: payload.description,
                    access_level: payload.access_level,
                    permission_ids: payload.permission_ids,
                },
            },
            {
                onSuccess: async () => {
                    toast.success('Cập nhật vai trò thành công!')
                },
                onError: (err: any) => {
                    toast.error(
                        err.response?.data?.detail ?? 'Cập nhật vai trò thất bại.'
                    )
                },
            }
        )
    }

    const handleDeleteRole = () => {
        if (!selectedRole) return

        deleteRoleMutation.mutate(selectedRole.id, {
            onSuccess: () => {
                toast.success('Xóa vai trò thành công.')
                setActiveRoleId(null)
                setShowDeleteConfirm(false)
            },
            onError: (err: any) => {
                toast.error(
                    err.response?.data?.detail ?? 'Xóa vai trò thất bại.'
                )
                setShowDeleteConfirm(false)
            },
        })
    }

    return (
        <div className="space-y-6">
            {/* Form: Create or Update */}
            <form
                ref={formRef}
                onSubmit={isAddingRole ? handleCreateRole : handleUpdateRole}
                className="space-y-4"
            >
                {/* Role Information Fields */}
                <RoleInfoFields
                    editRoleName={editRoleName}
                    setEditRoleName={setEditRoleName}
                    editDescription={editDescription}
                    setEditDescription={setEditDescription}
                    editAccessLevel={editAccessLevel}
                    setEditAccessLevel={setEditAccessLevel}
                    accessLevelOptions={accessLevelOptions}
                    disabled={isMyRole}
                />

                {/* Permissions Matrix Grid */}
                <PermissionsMatrix
                    permissionsData={permissionsData}
                    editPermissionIds={editPermissionIds}
                    onTogglePermission={handleTogglePermission}
                    disabled={isMyRole}
                />

                {isMyRole && (
                    <p className="text-[11px] text-text-placeholder font-medium">
                        * Bạn không thể tự chỉnh sửa hoặc xóa vai trò đang được gán cho chính mình.
                    </p>
                )}

                {/* Save / Cancel buttons */}
                <div className="flex gap-2.5 pt-2">
                    <Button
                        type="button"
                        variant="secondary"
                        onClick={onCloseCard}
                        disabled={isSubmitting}
                    >
                        Hủy
                    </Button>
                    {canSave && (
                        <Button
                            type="submit"
                            variant="primary"
                            fullWidth
                            isLoading={isSubmitting}
                            loadingText={isAddingRole ? 'Đang tạo...' : 'Đang lưu...'}
                        >
                            {isAddingRole ? 'Tạo vai trò' : 'Lưu thay đổi'}
                        </Button>
                    )}
                </div>
            </form>

            {/* Delete Role button — requires roles:delete */}
            {!isAddingRole && !isMyRole && !showDeleteConfirm && canDelete && (
                <div className="flex items-center justify-between gap-4 p-3 hover:bg-error-bg/10 rounded-xl transition-all">
                    <div>
                        <p className="text-xs font-semibold text-error-text">
                            Xóa vai trò
                        </p>
                        <p className="text-[10px] text-text-placeholder leading-normal mt-0.5">
                            Xóa vĩnh viễn vai trò và các quyền hạn của vai trò này
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
                onConfirm={handleDeleteRole}
                title="Xóa vai trò?"
                description="Hành động này sẽ xóa vai trò ngay lập tức và không thể hoàn tác."
                confirmLabel="Xóa vai trò"
                variant="danger"
                isLoading={isSubmitting}
            />
        </div>
    )
}

export default DetailRoleForm
