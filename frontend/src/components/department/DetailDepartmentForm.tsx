import { useState, useEffect, useRef } from 'react'
import type {
    AddDepartmentPayload,
    Department,
    UpdateDepartmentPayload,
} from '../../types/department'
import { useDepartmentStore } from '../../store/departmentStore'
import { Trash2 } from 'lucide-react'
import Button from '../ui/Button'
import {
    useCreateDepartment,
    useDeleteDepartment,
    useUpdateDepartment,
} from '../../hooks/useDepartments'
import DepartmentInfoFields from './DepartmentInfoFields'
import ConfirmDialog from '../ui/ConfirmDialog'
import { toast } from 'sonner'

interface DetailDepartmentFormProps {
    selectedDepartment: Department | null
    onCloseCard: () => void
}

const DetailDepartmentForm = ({
    selectedDepartment,
    onCloseCard,
}: DetailDepartmentFormProps) => {
    const [editDepartmentName, setEditDepartmentName] = useState(
        selectedDepartment?.name || ''
    )
    const [editCode, setEditCode] = useState(selectedDepartment?.code || '')
    const [editDescription, setEditDescription] = useState(
        selectedDepartment?.description || ''
    )

    const formRef = useRef<HTMLFormElement>(null)

    useEffect(() => {
        // Scroll the grandparent container back to the top on component mount
        const scrollContainer = formRef.current?.parentElement?.parentElement
        if (scrollContainer) {
            scrollContainer.scrollTop = 0
        }
    }, [])

    const isAddingDepartment = useDepartmentStore((s) => s.isAddingDepartment)
    const setIsAddingDepartment = useDepartmentStore(
        (s) => s.setIsAddingDepartment
    )
    const setActiveDepartmentId = useDepartmentStore(
        (s) => s.setActiveDepartmentId
    )

    // Mutation hooks
    const createDepartmentMutation = useCreateDepartment()
    const updateDepartmentMutation = useUpdateDepartment()
    const deleteDepartmentMutation = useDeleteDepartment()

    // Delete confirmation state
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)

    const isSubmitting =
        createDepartmentMutation.isPending ||
        updateDepartmentMutation.isPending ||
        deleteDepartmentMutation.isPending

    const handleCreateDepartment = async (
        e: React.SyntheticEvent<HTMLFormElement>
    ) => {
        e.preventDefault()

        const payload: AddDepartmentPayload = {
            name: editDepartmentName.trim(),
            code: editCode.trim(),
            description: editDescription.trim()
                ? editDescription.trim()
                : undefined,
        }
        createDepartmentMutation.mutate(payload, {
            onSuccess: (created) => {
                toast.success('Tạo phòng ban thành công!')
                setActiveDepartmentId(created.id)
                setIsAddingDepartment(false)
            },
            onError: (err: any) => {
                toast.error(
                    err.response?.data?.detail ?? 'Tạo phòng ban thất bại.'
                )
            },
        })
    }

    const handleUpdateDepartment = (
        e: React.SyntheticEvent<HTMLFormElement>
    ) => {
        e.preventDefault()
        if (!selectedDepartment) return

        const payload: UpdateDepartmentPayload = {
            name: editDepartmentName.trim(),
            description: editDescription.trim()
                ? editDescription.trim()
                : undefined,
        }

        updateDepartmentMutation.mutate(
            {
                id: selectedDepartment.id,
                payload,
            },
            {
                onSuccess: async () => {
                    toast.success('Cập nhật phòng ban thành công!')
                },
                onError: (err: any) => {
                    toast.error(
                        err.response?.data?.detail ??
                            'Cập nhật phòng ban thất bại.'
                    )
                },
            }
        )
    }

    const handleDeleteDepartment = () => {
        if (!selectedDepartment) return

        deleteDepartmentMutation.mutate(selectedDepartment.id, {
            onSuccess: () => {
                toast.success('Xóa phòng ban thành công.')
                setActiveDepartmentId(null)
            },
            onError: (err: any) => {
                toast.error(
                    err.response?.data?.detail ?? 'Xóa phòng ban thất bại.'
                )
            },
        })
    }

    return (
        <>
            <div className="space-y-6 h-full">
                {/* Form: Create or Update */}
                <form
                    ref={formRef}
                    onSubmit={
                        isAddingDepartment
                            ? handleCreateDepartment
                            : handleUpdateDepartment
                    }
                    className="space-y-4 flex flex-col h-full"
                >
                    {/* Department Information Fields */}
                    <DepartmentInfoFields
                        editDepartmentName={editDepartmentName}
                        setEditDepartmentName={setEditDepartmentName}
                        editCode={editCode}
                        setEditCode={setEditCode}
                        editDescription={editDescription}
                        setEditDescription={setEditDescription}
                        mode={isAddingDepartment ? 'create' : 'edit'}
                    />

                    <div className="flex-1"></div>

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
                        <Button
                            type="submit"
                            variant="primary"
                            fullWidth
                            isLoading={isSubmitting}
                            loadingText={
                                isAddingDepartment ? 'Đang tạo...' : 'Đang lưu...'
                            }
                        >
                            {isAddingDepartment
                                ? 'Tạo phòng ban'
                                : 'Lưu thay đổi'}
                        </Button>
                    </div>

                    {/* Delete Account button */}
                    {!isAddingDepartment && !showDeleteConfirm && (
                        <div className="flex items-center justify-between gap-4 py-3 hover:bg-error-bg/10 rounded-xl transition-all">
                            <div>
                                <p className="text-xs font-semibold text-error-text">
                                    Xóa phòng ban
                                </p>
                                <p className="text-[10px] text-text-placeholder leading-normal mt-0.5">
                                    Xóa vĩnh viễn phòng ban
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
                </form>
            </div>

            <ConfirmDialog
                isOpen={showDeleteConfirm}
                onClose={() => setShowDeleteConfirm(false)}
                onConfirm={handleDeleteDepartment}
                title="Xóa phòng ban?"
                description="Hành động này sẽ xóa phòng ban ngay lập tức và không thể hoàn tác."
                confirmLabel="Xóa phòng ban"
                variant="danger"
                isLoading={isSubmitting}
            />
        </>
    )
}

export default DetailDepartmentForm
