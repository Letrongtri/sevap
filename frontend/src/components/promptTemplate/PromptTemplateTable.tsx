import { useState, useEffect } from 'react'
import { usePromptTemplateStore } from '../../store/promptTemplateStore'
import {
    usePromptTemplates,
    useTogglePromptTemplateStatus,
    useDeletePromptTemplate,
} from '../../hooks/usePromptTemplate'
import type { PromptTemplate } from '../../types/promptTemplate'
import {
    PROMPT_TYPE_LABELS,
    PROMPT_TEMPLATE_TYPE_SELECT_OPTIONS,
} from '../../types/promptTemplate'
import { AlertCircle, Search, FileCode } from 'lucide-react'
import LoadingSpinner from '../ui/LoadingSpinner'
import Button from '../ui/Button'
import Badge from '../ui/Badge'
import Pagination from '../ui/Pagination'
import SearchableSelect from '../ui/SearchableSelect'
import ConfirmDialog from '../ui/ConfirmDialog'
import { toast } from 'sonner'
import { formatDateTimeToDDMMYYYY } from '../../../utils/formater'

const PromptTemplateTable = () => {
    // Store filters state
    const query = usePromptTemplateStore((s) => s.query)
    const setQuery = usePromptTemplateStore((s) => s.setQuery)
    const type = usePromptTemplateStore((s) => s.type)
    const setType = usePromptTemplateStore((s) => s.setType)
    const is_active = usePromptTemplateStore((s) => s.is_active)
    const setIsActive = usePromptTemplateStore((s) => s.setIsActive)

    const activePromptTemplateId = usePromptTemplateStore(
        (s) => s.activePromptTemplateId
    )
    const setActivePromptTemplateId = usePromptTemplateStore(
        (s) => s.setActivePromptTemplateId
    )
    const setIsAddingPromptTemplate = usePromptTemplateStore(
        (s) => s.setIsAddingPromptTemplate
    )

    // Pagination state
    const page = usePromptTemplateStore((s) => s.page) || 1
    const setPage = usePromptTemplateStore((s) => s.setPage)
    const limit = usePromptTemplateStore((s) => s.limit) || 10
    const setLimit = usePromptTemplateStore((s) => s.setLimit)

    // Debounced search
    const [localSearch, setLocalSearch] = useState(query || '')

    useEffect(() => {
        const handler = setTimeout(() => {
            setQuery(localSearch || null)
            setPage(1)
        }, 300)
        return () => clearTimeout(handler)
    }, [localSearch, setQuery, setPage])

    // Query & Mutation hooks
    const { prompt_templates, isLoading, error, refetch, pagination } =
        usePromptTemplates()
    const toggleStatusMutation = useTogglePromptTemplateStatus()
    const deletePromptMutation = useDeletePromptTemplate()

    // Confirmation dialog states for table action buttons
    const [confirmTogglePrompt, setConfirmTogglePrompt] =
        useState<PromptTemplate | null>(null)
    const [confirmDeletePrompt, setConfirmDeletePrompt] =
        useState<PromptTemplate | null>(null)

    const isSubmitting =
        toggleStatusMutation.isPending || deletePromptMutation.isPending

    const handleSelectPrompt = (prompt: PromptTemplate) => {
        setIsAddingPromptTemplate(false)
        setActivePromptTemplateId(prompt.id)
    }

    const handleConfirmToggle = () => {
        if (!confirmTogglePrompt) return
        toggleStatusMutation.mutate(confirmTogglePrompt.id, {
            onSuccess: (updated) => {
                toast.success(
                    updated.is_active
                        ? 'Đã kích hoạt prompt template.'
                        : 'Đã vô hiệu hóa prompt template.'
                )
                setConfirmTogglePrompt(null)
            },
            onError: (err: any) => {
                toast.error(
                    err.response?.data?.detail ??
                        'Thay đổi trạng thái thất bại.'
                )
                setConfirmTogglePrompt(null)
            },
        })
    }

    const handleConfirmDelete = () => {
        if (!confirmDeletePrompt) return
        deletePromptMutation.mutate(confirmDeletePrompt.id, {
            onSuccess: () => {
                toast.success('Xóa prompt template thành công.')
                if (activePromptTemplateId === confirmDeletePrompt.id) {
                    setActivePromptTemplateId(null)
                }
                setConfirmDeletePrompt(null)
            },
            onError: (err: any) => {
                toast.error(
                    err.response?.data?.detail ??
                        'Xóa prompt template thất bại.'
                )
                setConfirmDeletePrompt(null)
            },
        })
    }

    // Dropdown options for Type Filter
    const typeFilterOptions = [
        { label: 'Tất cả loại prompt', value: null },
        ...PROMPT_TEMPLATE_TYPE_SELECT_OPTIONS,
    ]

    return (
        <div className="bg-white rounded-2xl border border-[#D4D7DE]/60 shadow-sm overflow-hidden flex flex-col h-full">
            {/* Search & Filter Bar */}
            <div className="p-4 border-b border-[#D4D7DE]/40 flex flex-col gap-4 bg-bg/20 flex-shrink-0">
                <div className="flex flex-col lg:flex-row gap-3 justify-between items-stretch lg:items-center">
                    {/* Search Input */}
                    <div className="relative flex-1 max-w-md">
                        <Search className="w-4 h-4 text-text-placeholder absolute left-3.5 top-1/2 -translate-y-1/2" />
                        <input
                            type="text"
                            placeholder="Tìm kiếm theo tên hoặc mô tả prompt..."
                            value={localSearch}
                            onChange={(e) => setLocalSearch(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 text-sm bg-surface-raised border border-border rounded-xl focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all placeholder:text-text-placeholder"
                        />
                    </div>

                    {/* Dropdown Filters & Status Tabs */}
                    <div className="flex flex-wrap items-center gap-3">
                        {/* Prompt Type Dropdown Filter */}
                        <div className="w-56">
                            <SearchableSelect
                                options={typeFilterOptions}
                                value={type}
                                onChange={(val) => {
                                    setType(val ? String(val) : null)
                                    setPage(1)
                                }}
                                placeholder="Lọc theo loại prompt..."
                                size="sm"
                            />
                        </div>

                        {/* Active Status Tabs */}
                        <div className="flex items-center gap-1 bg-surface-raised border border-border p-1 rounded-xl">
                            {[
                                { label: 'Tất cả', val: null },
                                { label: 'Hoạt động', val: true },
                                { label: 'Vô hiệu hóa', val: false },
                            ].map((item) => (
                                <button
                                    key={String(item.val)}
                                    onClick={() => {
                                        setIsActive(item.val)
                                        setPage(1)
                                    }}
                                    className={[
                                        'px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer',
                                        is_active === item.val
                                            ? 'bg-white text-text-primary shadow-sm'
                                            : 'text-text-placeholder hover:text-text-secondary',
                                    ].join(' ')}
                                >
                                    {item.label}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            {/* Table Container */}
            <div className="overflow-auto min-h-0 flex-1">
                {isLoading ? (
                    <div className="flex flex-col items-center justify-center min-h-[400px] space-y-3">
                        <LoadingSpinner />
                        <p className="text-sm text-text-placeholder">
                            Đang tải danh sách prompt template...
                        </p>
                    </div>
                ) : error ? (
                    <div className="flex flex-col items-center justify-center min-h-[400px] text-center p-6 space-y-2">
                        <AlertCircle className="w-10 h-10 text-error" />
                        <h3 className="text-lg font-semibold text-text-primary">
                            Tải danh sách prompt thất bại
                        </h3>
                        <p className="text-sm text-text-placeholder max-w-sm">
                            {(error as any)?.message || 'Đã có lỗi xảy ra'}
                        </p>
                        <Button
                            variant="secondary"
                            size="sm"
                            onClick={() => refetch()}
                        >
                            Thử lại
                        </Button>
                    </div>
                ) : prompt_templates.length === 0 ? (
                    <div className="flex flex-col items-center justify-center min-h-[400px] text-center p-6 space-y-2">
                        <FileCode className="w-10 h-10 text-text-placeholder" />
                        <h3 className="text-base font-semibold text-text-secondary">
                            Không tìm thấy prompt template nào
                        </h3>
                        <p className="text-xs text-text-placeholder">
                            Thử thay đổi bộ lọc hoặc tạo prompt mới.
                        </p>
                    </div>
                ) : (
                    <table className="w-full border-separate border-spacing-0 text-left">
                        <thead>
                            <tr className="text-text-secondary text-xs uppercase font-bold tracking-wider">
                                <th className="sticky top-0 z-10 bg-white border-b border-[#D4D7DE]/40 px-5 py-4 font-bold">
                                    STT
                                </th>
                                <th className="sticky top-0 z-10 bg-white border-b border-[#D4D7DE]/40 px-5 py-4 font-bold">
                                    Tên Prompt
                                </th>
                                <th className="sticky top-0 z-10 bg-white border-b border-[#D4D7DE]/40 px-5 py-4 font-bold">
                                    Loại Prompt
                                </th>
                                <th className="sticky top-0 z-10 bg-white border-b border-[#D4D7DE]/40 px-5 py-4 font-bold">
                                    Người tạo
                                </th>
                                <th className="sticky top-0 z-10 bg-white border-b border-[#D4D7DE]/40 px-5 py-4 font-bold">
                                    Trạng thái
                                </th>
                                <th className="sticky top-0 z-10 bg-white border-b border-[#D4D7DE]/40 px-5 py-4 font-bold">
                                    Cập nhật
                                </th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-[#D4D7DE]/40">
                            {prompt_templates.map((prompt, index) => {
                                const isSelected =
                                    activePromptTemplateId === prompt.id

                                return (
                                    <tr
                                        key={prompt.id}
                                        onClick={() =>
                                            handleSelectPrompt(prompt)
                                        }
                                        className={[
                                            'group cursor-pointer transition-colors duration-150',
                                            isSelected
                                                ? 'bg-primary/5 hover:bg-primary/5 border-l-4 border-primary'
                                                : 'hover:bg-bg/20',
                                        ].join(' ')}
                                    >
                                        {/* Index */}
                                        <td className="px-5 py-3.5 text-sm text-text-secondary">
                                            {(page - 1) * limit + index + 1}
                                        </td>

                                        {/* Name & Description */}
                                        <td className="px-5 py-3.5 text-sm text-text-primary">
                                            <div className="font-semibold text-text-primary">
                                                {prompt.name}
                                            </div>
                                            {prompt.description && (
                                                <div className="text-xs text-text-placeholder line-clamp-1 mt-0.5">
                                                    {prompt.description}
                                                </div>
                                            )}
                                        </td>

                                        {/* Type */}
                                        <td className="px-5 py-3.5 text-xs text-text-secondary">
                                            <span className="font-medium text-text-primary text-sm">
                                                {PROMPT_TYPE_LABELS[
                                                    prompt.type
                                                ] || prompt.type}
                                            </span>
                                        </td>

                                        {/* Creator */}
                                        <td className="px-5 py-3.5 text-sm text-text-secondary">
                                            {prompt.user_name ? (
                                                <span className="text-text-primary text-sm">
                                                    {prompt.user_name}
                                                </span>
                                            ) : (
                                                <span className="text-text-placeholder text-xs">
                                                    Hệ thống
                                                </span>
                                            )}
                                        </td>

                                        {/* Status Badge */}
                                        <td className="px-5 py-3.5">
                                            <Badge
                                                variant={
                                                    prompt.is_active
                                                        ? 'success'
                                                        : 'error'
                                                }
                                                size="sm"
                                                dot
                                            >
                                                {prompt.is_active
                                                    ? 'Đang hoạt động'
                                                    : 'Vô hiệu hóa'}
                                            </Badge>
                                        </td>

                                        {/* Updated date */}
                                        <td className="px-5 py-3.5 text-sm text-text-secondary">
                                            {formatDateTimeToDDMMYYYY(
                                                prompt.updated_at
                                            )}
                                        </td>
                                    </tr>
                                )
                            })}
                        </tbody>
                    </table>
                )}
            </div>

            {/* Pagination Controls */}
            {!isLoading &&
                !error &&
                prompt_templates.length > 0 &&
                pagination && (
                    <div className="flex-shrink-0">
                        <Pagination
                            page={page}
                            limit={limit}
                            totalPages={pagination.total_pages}
                            totalItems={pagination.total}
                            unit="prompt"
                            onPageChange={setPage}
                            onLimitChange={setLimit}
                        />
                    </div>
                )}

            {/* Confirmation Dialogs for Table Quick Actions */}
            {/* Quick Toggle Status Confirm */}
            <ConfirmDialog
                isOpen={Boolean(confirmTogglePrompt)}
                onClose={() => setConfirmTogglePrompt(null)}
                onConfirm={handleConfirmToggle}
                title={
                    confirmTogglePrompt?.is_active
                        ? 'Vô hiệu hóa prompt?'
                        : 'Kích hoạt prompt?'
                }
                description={
                    confirmTogglePrompt?.is_active
                        ? `Prompt "${confirmTogglePrompt?.name}" sẽ ngưng được áp dụng trong hệ thống.`
                        : `Prompt "${confirmTogglePrompt?.name}" sẽ được kích hoạt áp dụng cho hệ thống.`
                }
                confirmLabel={
                    confirmTogglePrompt?.is_active ? 'Vô hiệu hóa' : 'Kích hoạt'
                }
                variant={confirmTogglePrompt?.is_active ? 'danger' : 'primary'}
                isLoading={isSubmitting}
            />

            {/* Quick Delete Confirm */}
            <ConfirmDialog
                isOpen={Boolean(confirmDeletePrompt)}
                onClose={() => setConfirmDeletePrompt(null)}
                onConfirm={handleConfirmDelete}
                title="Xóa prompt template?"
                description={`Bạn có chắc chắn muốn xóa vĩnh viễn prompt "${confirmDeletePrompt?.name}" không? Hành động này không thể hoàn tác.`}
                confirmLabel="Xóa prompt"
                variant="danger"
                isLoading={isSubmitting}
            />
        </div>
    )
}

export default PromptTemplateTable
