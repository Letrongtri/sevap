import { useState, useRef, useEffect } from 'react'
import type {
    PromptTemplate,
    UpdatePromptTemplatePayload,
} from '../../types/promptTemplate'
import {
    PROMPT_TYPE_LABELS,
    PROMPT_TEMPLATE_TYPE_SELECT_OPTIONS,
} from '../../types/promptTemplate'
import { usePromptTemplateStore } from '../../store/promptTemplateStore'
import { Trash2, ToggleLeft, ToggleRight, User, Hash } from 'lucide-react'
import Button from '../ui/Button'
import Input from '../ui/Input'
import SearchableSelect from '../ui/SearchableSelect'
import Badge from '../ui/Badge'
import ConfirmDialog from '../ui/ConfirmDialog'
import {
    useCreatePromptTemplate,
    useUpdatePromptTemplate,
    useTogglePromptTemplateStatus,
    useDeletePromptTemplate,
} from '../../hooks/usePromptTemplate'
import { toast } from 'sonner'
import { usePermission } from '../../hooks/usePermission'
import { PERMISSIONS } from '../../lib/permissions'
import { formatDateTimeToDDMMYYYY } from '../../../utils/formater'

const DetailPromptTemplateForm = ({
    selectedPrompt,
    onCloseCard,
}: {
    selectedPrompt?: PromptTemplate | null
    onCloseCard: () => void
}) => {
    const [name, setName] = useState(selectedPrompt?.name || '')
    const [type, setType] = useState(selectedPrompt?.type || '')
    const [description, setDescription] = useState(
        selectedPrompt?.description || ''
    )
    const [content, setContent] = useState(selectedPrompt?.content || '')

    const formRef = useRef<HTMLFormElement>(null)

    useEffect(() => {
        const scrollContainer = formRef.current?.parentElement?.parentElement
        if (scrollContainer) {
            scrollContainer.scrollTop = 0
        }
    }, [])

    const isAddingPromptTemplate = usePromptTemplateStore(
        (s) => s.isAddingPromptTemplate
    )
    const setIsAddingPromptTemplate = usePromptTemplateStore(
        (s) => s.setIsAddingPromptTemplate
    )
    const setActivePromptTemplateId = usePromptTemplateStore(
        (s) => s.setActivePromptTemplateId
    )

    const canCreate = usePermission(PERMISSIONS.PROMPT_TEMPLATES_CREATE)
    const canUpdate = usePermission(PERMISSIONS.PROMPT_TEMPLATES_UPDATE)
    const canDelete = usePermission(PERMISSIONS.PROMPT_TEMPLATES_DELETE)
    const canSave = isAddingPromptTemplate ? canCreate : canUpdate

    // Mutation hooks
    const createPromptMutation = useCreatePromptTemplate()
    const updatePromptMutation = useUpdatePromptTemplate()
    const toggleStatusMutation = useTogglePromptTemplateStatus()
    const deletePromptMutation = useDeletePromptTemplate()

    // Confirmation modals state
    const [showSaveConfirm, setShowSaveConfirm] = useState(false)
    const [showToggleConfirm, setShowToggleConfirm] = useState(false)
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)

    const isSubmitting =
        createPromptMutation.isPending ||
        updatePromptMutation.isPending ||
        toggleStatusMutation.isPending ||
        deletePromptMutation.isPending

    const handleFormSubmit = (e: React.FormEvent) => {
        e.preventDefault()

        if (!name.trim()) {
            toast.error('Vui lòng nhập tên prompt.')
            return
        }

        if (!type) {
            toast.error('Vui lòng chọn loại prompt.')
            return
        }

        if (isAddingPromptTemplate) {
            // Direct create
            executeCreate()
        } else {
            // Show update confirmation message
            setShowSaveConfirm(true)
        }
    }

    const executeCreate = () => {
        createPromptMutation.mutate(
            {
                name: name.trim(),
                type: type,
                description: description.trim() ? description.trim() : null,
                content: content.trim() ? content.trim() : null,
            },
            {
                onSuccess: (created) => {
                    toast.success('Tạo prompt template thành công!')
                    setActivePromptTemplateId(created.id)
                    setIsAddingPromptTemplate(false)
                },
                onError: (err: any) => {
                    toast.error(
                        err.response?.data?.detail ??
                            'Tạo prompt template thất bại.'
                    )
                },
            }
        )
    }

    const executeUpdate = () => {
        if (!selectedPrompt) return

        const payload: UpdatePromptTemplatePayload = {
            id: selectedPrompt.id,
            name: name.trim(),
            type: type,
            description: description.trim() ? description.trim() : null,
            content: content.trim() ? content.trim() : null,
        }

        updatePromptMutation.mutate(
            {
                id: selectedPrompt.id,
                payload,
            },
            {
                onSuccess: () => {
                    toast.success('Cập nhật prompt template thành công!')
                    setShowSaveConfirm(false)
                },
                onError: (err: any) => {
                    toast.error(
                        err.response?.data?.detail ??
                            'Cập nhật prompt template thất bại.'
                    )
                    setShowSaveConfirm(false)
                },
            }
        )
    }

    const executeToggleStatus = () => {
        if (!selectedPrompt) return

        toggleStatusMutation.mutate(selectedPrompt.id, {
            onSuccess: (updated) => {
                toast.success(
                    updated.is_active
                        ? 'Đã kích hoạt prompt template.'
                        : 'Đã vô hiệu hóa prompt template.'
                )
                setShowToggleConfirm(false)
            },
            onError: (err: any) => {
                toast.error(
                    err.response?.data?.detail ??
                        'Thay đổi trạng thái thất bại.'
                )
                setShowToggleConfirm(false)
            },
        })
    }

    const executeDelete = () => {
        if (!selectedPrompt) return

        deletePromptMutation.mutate(selectedPrompt.id, {
            onSuccess: () => {
                toast.success('Xóa prompt template thành công.')
                setShowDeleteConfirm(false)
                setActivePromptTemplateId(null)
            },
            onError: (err: any) => {
                toast.error(
                    err.response?.data?.detail ??
                        'Xóa prompt template thất bại.'
                )
                setShowDeleteConfirm(false)
            },
        })
    }

    const typeOptionsWithLabels = PROMPT_TEMPLATE_TYPE_SELECT_OPTIONS.map(
        (opt) => ({
            label: PROMPT_TYPE_LABELS[opt.value] || opt.label,
            value: opt.value,
        })
    )

    return (
        <div className="space-y-6">
            <form
                ref={formRef}
                onSubmit={handleFormSubmit}
                className="space-y-4"
            >
                {/* Information Header if viewing existing prompt */}
                {selectedPrompt && (
                    <div className="bg-bg/25 border border-border rounded-xl p-4 space-y-3">
                        <div className="flex items-center justify-between">
                            <span className="text-xs font-semibold text-text-secondary">
                                Trạng thái hiện tại
                            </span>
                            <Badge
                                variant={
                                    selectedPrompt.is_active
                                        ? 'success'
                                        : 'error'
                                }
                                size="sm"
                                dot
                            >
                                {selectedPrompt.is_active
                                    ? 'Đang hoạt động'
                                    : 'Vô hiệu hóa'}
                            </Badge>
                        </div>

                        {selectedPrompt.user_name && (
                            <div className="grid grid-cols-2 gap-2 pt-2 border-t border-border/60 text-xs">
                                <div>
                                    <span className="text-text-placeholder block text-[11px] mb-0.5">
                                        Người tạo
                                    </span>
                                    <div className="flex items-center gap-1.5 font-medium text-text-primary">
                                        <User className="w-3.5 h-3.5 text-primary" />
                                        <span>{selectedPrompt.user_name}</span>
                                    </div>
                                </div>
                                {selectedPrompt.user_employee_code && (
                                    <div>
                                        <span className="text-text-placeholder block text-[11px] mb-0.5">
                                            Mã nhân viên
                                        </span>
                                        <div className="flex items-center gap-1.5 font-medium text-text-primary">
                                            <Hash className="w-3.5 h-3.5 text-primary" />
                                            <span>
                                                {
                                                    selectedPrompt.user_employee_code
                                                }
                                            </span>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}

                        <div className="text-[11px] text-text-placeholder pt-1 flex justify-between">
                            <span>
                                Ngày tạo:{' '}
                                {formatDateTimeToDDMMYYYY(
                                    selectedPrompt.created_at
                                )}
                            </span>
                            <span>
                                Cập nhật:{' '}
                                {formatDateTimeToDDMMYYYY(
                                    selectedPrompt.updated_at
                                )}
                            </span>
                        </div>
                    </div>
                )}

                {/* Field: Name */}
                <Input
                    label="Tên prompt"
                    placeholder="VD: System Prompt V1"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    disabled={!canSave || isSubmitting}
                    required
                />

                {/* Field: Type Dropdown */}
                <div>
                    <SearchableSelect
                        options={typeOptionsWithLabels}
                        value={type}
                        onChange={(val) => setType(val ? String(val) : '')}
                        label="Loại prompt"
                        placeholder="Chọn loại prompt template..."
                        disabled={!canSave || isSubmitting}
                        required={true}
                    />
                </div>

                {/* Field: Description */}
                <div>
                    <label className="block text-sm font-semibold text-text-secondary mb-1">
                        Mô tả
                    </label>
                    <textarea
                        rows={2}
                        placeholder="Nhập mô tả chi tiết mục đích của prompt này..."
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        disabled={!canSave || isSubmitting}
                        className="w-full px-3 py-2 text-sm bg-surface-raised border border-border rounded-xl focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all placeholder:text-text-placeholder resize-none"
                    />
                </div>

                {/* Field: Content */}
                <div>
                    <label className="block text-sm font-semibold text-text-secondary mb-1">
                        Nội dung Prompt (System / Instructions)
                        <span className="text-error ml-1">*</span>
                    </label>
                    <textarea
                        rows={10}
                        placeholder="Nhập nội dung chỉ dẫn chi tiết cho AI assistant..."
                        value={content}
                        onChange={(e) => setContent(e.target.value)}
                        disabled={!canSave || isSubmitting}
                        className="w-full px-3 py-2 text-sm bg-surface-raised border border-border rounded-xl focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all placeholder:text-text-placeholder resize-y"
                    />
                </div>

                {/* Form submit actions */}
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
                            loadingText={
                                isAddingPromptTemplate
                                    ? 'Đang tạo...'
                                    : 'Đang lưu...'
                            }
                        >
                            {isAddingPromptTemplate
                                ? 'Tạo prompt'
                                : 'Lưu thay đổi'}
                        </Button>
                    )}
                </div>
            </form>

            {/* Quick Action buttons for existing Prompt Template */}
            {!isAddingPromptTemplate && selectedPrompt && (
                <div className="space-y-2 pt-4 border-t border-border">
                    {/* Toggle Status Button */}
                    {canUpdate && (
                        <div className="flex items-center justify-between gap-4 p-3 bg-bg/15 hover:bg-bg/30 border border-border/60 rounded-xl transition-all">
                            <div>
                                <p className="text-xs font-semibold text-text-primary">
                                    Trạng thái hoạt động
                                </p>
                                <p className="text-[10px] text-text-placeholder leading-normal mt-0.5">
                                    {selectedPrompt.is_active
                                        ? 'Vô hiệu hóa prompt này trong hệ thống'
                                        : 'Kích hoạt prompt này làm mẫu chính'}
                                </p>
                            </div>
                            <Button
                                variant={
                                    selectedPrompt.is_active
                                        ? 'secondary'
                                        : 'primary'
                                }
                                size="sm"
                                leftIcon={
                                    selectedPrompt.is_active ? (
                                        <ToggleLeft className="w-4 h-4 text-text-secondary" />
                                    ) : (
                                        <ToggleRight className="w-4 h-4" />
                                    )
                                }
                                onClick={() => setShowToggleConfirm(true)}
                                disabled={isSubmitting}
                            >
                                {selectedPrompt.is_active
                                    ? 'Vô hiệu hóa'
                                    : 'Kích hoạt'}
                            </Button>
                        </div>
                    )}

                    {/* Delete Prompt Button */}
                    {canDelete && (
                        <div className="flex items-center justify-between gap-4 p-3 hover:bg-error-bg/10 rounded-xl transition-all">
                            <div>
                                <p className="text-xs font-semibold text-error-text">
                                    Xóa prompt template
                                </p>
                                <p className="text-[10px] text-text-placeholder leading-normal mt-0.5">
                                    Xóa vĩnh viễn prompt template này khỏi hệ
                                    thống
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
                </div>
            )}

            {/* Confirmation Dialogs */}
            {/* Update Save Confirm */}
            <ConfirmDialog
                isOpen={showSaveConfirm}
                onClose={() => setShowSaveConfirm(false)}
                onConfirm={executeUpdate}
                title="Xác nhận cập nhật prompt?"
                description={`Bạn có chắc chắn muốn cập nhật các thay đổi cho prompt "${name}" không?`}
                confirmLabel="Lưu thay đổi"
                variant="primary"
                isLoading={isSubmitting}
            />

            {/* Toggle Status Confirm */}
            <ConfirmDialog
                isOpen={showToggleConfirm}
                onClose={() => setShowToggleConfirm(false)}
                onConfirm={executeToggleStatus}
                title={
                    selectedPrompt?.is_active
                        ? 'Vô hiệu hóa prompt?'
                        : 'Kích hoạt prompt?'
                }
                description={
                    selectedPrompt?.is_active
                        ? `Prompt "${selectedPrompt?.name}" sẽ ngưng được áp dụng trong hệ thống.`
                        : `Prompt "${selectedPrompt?.name}" sẽ được kích hoạt áp dụng cho tenant.`
                }
                confirmLabel={
                    selectedPrompt?.is_active ? 'Vô hiệu hóa' : 'Kích hoạt'
                }
                variant={selectedPrompt?.is_active ? 'danger' : 'primary'}
                isLoading={isSubmitting}
            />

            {/* Delete Confirm */}
            <ConfirmDialog
                isOpen={showDeleteConfirm}
                onClose={() => setShowDeleteConfirm(false)}
                onConfirm={executeDelete}
                title="Xóa prompt template?"
                description={`Hành động này sẽ xóa vĩnh viễn prompt "${selectedPrompt?.name}" và không thể hoàn tác.`}
                confirmLabel="Xóa prompt"
                variant="danger"
                isLoading={isSubmitting}
            />
        </div>
    )
}

export default DetailPromptTemplateForm
