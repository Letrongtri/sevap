/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState } from 'react'
import { X, UserCheck, AlertCircle } from 'lucide-react'
import { useUserStore } from '../../store/usersStore'
import {
    useUsers,
    useCreateUser,
    useUpdateUser,
    useToggleUserStatus,
    useDeleteUser,
    useResetUserPassword,
} from '../../hooks/useUsers'
import AddingUserForm from './AddingUserForm'
import DetailAccountForm from './DetailAccountForm'
import type { AddUserPayload, UpdateUserPayload } from '../../types/user'
import type { ID } from '../../types/common'

const UserDetail = () => {
    const activeUserId = useUserStore((s) => s.activeUserId)
    const setActiveUserId = useUserStore((s) => s.setActiveUserId)
    const isAddingUser = useUserStore((s) => s.isAddingUser)
    const setIsAddingUser = useUserStore((s) => s.setIsAddingUser)

    const { users } = useUsers()
    const selectedUser = users.find((u) => u.id === activeUserId) || null

    // Mutation hooks
    const createUserMutation = useCreateUser()
    const updateUserMutation = useUpdateUser()
    const toggleStatusMutation = useToggleUserStatus()
    const deleteUserMutation = useDeleteUser()
    const resetPasswordMutation = useResetUserPassword()

    // Form feedback states
    const [formError, setFormError] = useState<string | null>(null)
    const [formSuccess, setFormSuccess] = useState<string | null>(null)

    const handleCloseCard = () => {
        setActiveUserId(null)
        setIsAddingUser(false)
    }

    const isSubmitting =
        createUserMutation.isPending ||
        updateUserMutation.isPending ||
        toggleStatusMutation.isPending ||
        deleteUserMutation.isPending ||
        resetPasswordMutation.isPending

    const handleCreateUser = async (payload: AddUserPayload) => {
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
                    setFormSuccess('User account created successfully!')
                    setActiveUserId(created.id)
                    setIsAddingUser(false)
                },
                onError: (err: any) => {
                    setFormError(
                        err.response?.data?.detail ??
                            'Failed to create user account.'
                    )
                },
            }
        )
    }

    const handleUpdateUser = async (payload: UpdateUserPayload) => {
        updateUserMutation.mutate(
            {
                id: payload.id,
                payload: {
                    full_name: payload.full_name,
                    email: payload.email,
                },
            },
            {
                onSuccess: async () => {
                    setFormSuccess('Account updated successfully!')
                },
                onError: (err: any) => {
                    setFormError(
                        err.response?.data?.detail ??
                            'Failed to update user account.'
                    )
                },
            }
        )
    }

    const handleResetPassword = (id: ID) => {
        resetPasswordMutation.mutate(id, {
            onSuccess: () => {
                setFormSuccess(
                    "Password reset successfully to default ('password')."
                )
            },
            onError: (err: any) => {
                setFormError(
                    err.response?.data?.detail ?? 'Failed to reset password.'
                )
            },
        })
    }

    const handleDeleteUser = (id: ID) => {
        deleteUserMutation.mutate(id, {
            onSuccess: () => {
                setFormSuccess('Account deleted successfully.')
                setActiveUserId(null)
            },
            onError: (err: any) => {
                setFormError(
                    err.response?.data?.detail ?? 'Failed to delete account.'
                )
            },
        })
    }

    const handleToggleUserStatus = (id: ID, status: boolean) => {
        toggleStatusMutation.mutate(
            { id, active: status },
            {
                onSuccess: () => {
                    setFormSuccess('Account activated successfully.')
                },
                onError: (err: any) => {
                    setFormError(
                        err.response?.data?.detail ??
                            'Failed to activate account.'
                    )
                },
            }
        )
    }

    return (
        <div className="flex flex-col h-full relative">
            {/* Close button X */}
            <div className="px-6 py-4 border-b border-[#D4D7DE]/40 flex-shrink-0 relative">
                {/* Nút đóng X */}
                <button
                    onClick={handleCloseCard}
                    title="Close detail panel"
                    className="absolute top-3 right-3 p-1.5 rounded-lg text-text-placeholder hover:text-text-primary hover:bg-bg transition-all duration-150 z-20 cursor-pointer"
                >
                    <X className="w-5 h-5" />
                </button>

                {/* Tiêu đề động tự đổi chữ tùy thuộc vào state đang Add hay View Detail */}
                <h2 className="text-lg font-bold text-text-primary">
                    {isAddingUser
                        ? 'Add New Account'
                        : selectedUser
                          ? 'User Information'
                          : ''}
                </h2>

                {/* Khóa các Banner feedback cố định tại đây để không bị cuộn mất khi có lỗi/thành công */}
                {formError && (
                    <div className="mb-2 p-3 bg-error-bg border border-error-border text-error-text rounded-xl text-xs flex items-start gap-2 animate-fade-in-down">
                        <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                        <span>{formError}</span>
                    </div>
                )}
                {formSuccess && (
                    <div className="mb-2 p-3 bg-success-bg border border-success-border text-success rounded-xl text-xs flex items-start gap-2 animate-fade-in-down">
                        <UserCheck className="w-4 h-4 flex-shrink-0 mt-0.5" />
                        <span>{formSuccess}</span>
                    </div>
                )}
            </div>

            {/* ─── PHẦN 2: NỘI DUNG INPUTS ĐƯỢC PHÉP SCROLL (SCROLLABLE CONTENT) ─── */}
            <div className="flex-1 overflow-y-auto p-6 pt-4 scrollbar-thin">
                {/* --- STATE 1: Adding a user --- */}
                {isAddingUser && (
                    <AddingUserForm
                        onCreateUser={handleCreateUser}
                        isSubmitting={createUserMutation.isPending}
                        setFormError={setFormError}
                        setFormSuccess={setFormSuccess}
                        onCloseCard={handleCloseCard}
                    />
                )}

                {/* --- STATE 2: Viewing/Editing selected user --- */}
                {selectedUser && (
                    <DetailAccountForm
                        selectedUser={selectedUser}
                        onUpdateUser={handleUpdateUser}
                        onResetPassword={handleResetPassword}
                        onDeleteUser={handleDeleteUser}
                        onToggleUserStatus={handleToggleUserStatus}
                        isSubmitting={isSubmitting}
                        setFormError={setFormError}
                        setFormSuccess={setFormSuccess}
                    />
                )}
            </div>
        </div>
    )
}

export default UserDetail
