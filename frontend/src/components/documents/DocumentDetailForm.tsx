import React, { useState, useEffect, useRef } from 'react'
import { Shield, UploadCloud, FileUp, Plus } from 'lucide-react'
import { useUploadDocument, useUpdateDocument } from '../../hooks/useDocuments'
import { useSimpleDepartments } from '../../hooks/useSimpleDepartments'
import { useSimpleRoles } from '../../hooks/useSimpleRoles'
import { useSimpleJobTitles } from '../../hooks/useSimpleJobTitles'
import { useDocumentStore } from '../../store/documentStore'
import { usePermission } from '../../hooks/usePermission'
import { PERMISSIONS } from '../../lib/permissions'

import SearchableSelect from '../ui/SearchableSelect'
import SearchableUserMultiSelect from '../ui/SearchableUserMultiSelect'
import DatePicker from '../ui/DatePicker'
import Input from '../ui/Input'
import Button from '../ui/Button'
import { formatBytes } from '../../../utils/formater'
import type {
    Document,
    DocumentAccessPolicyCreate,
    PolicyGroupState,
} from '../../types/document'
import { type ID, ALLOWED_DOCUMENT_FILE_TYPES } from '../../types/common'
import PolicyGroupCard from './PolicyGroupCard'

const emptyPolicy = (): PolicyGroupState => ({
    id: crypto.randomUUID(),
    roleIds: [],
    departmentIds: [],
    jobTitleIds: [],
    expanded: true,
})

/** Chuyển UI state sang format backend */
function toPoliciesPayload(
    groups: PolicyGroupState[]
): DocumentAccessPolicyCreate[] {
    return groups
        .map((g) => ({
            conditions: [
                ...g.roleIds.map((id) => ({
                    condition_type: 'roles' as const,
                    condition_value_id: id,
                })),
                ...g.departmentIds.map((id) => ({
                    condition_type: 'departments' as const,
                    condition_value_id: id,
                })),
                ...g.jobTitleIds.map((id) => ({
                    condition_type: 'job_titles' as const,
                    condition_value_id: id,
                })),
            ],
        }))
        .filter((p) => p.conditions.length > 0)
}

/** Khôi phục UI state từ document đang edit */
function fromDocument(doc: Document): PolicyGroupState[] {
    if (!doc.document_access_policies?.length) return []
    return doc.document_access_policies.map((p) => {
        const g: PolicyGroupState = {
            id: p.id,
            roleIds: [],
            departmentIds: [],
            jobTitleIds: [],
            expanded: false,
        }
        for (const cond of p.conditions) {
            if (cond.condition_type === 'roles')
                g.roleIds.push(cond.condition_value_id)
            else if (cond.condition_type === 'departments')
                g.departmentIds.push(cond.condition_value_id)
            else if (cond.condition_type === 'job_titles')
                g.jobTitleIds.push(cond.condition_value_id)
        }
        return g
    })
}

// ── Main form component ───────────────────────────────────────────────────────
interface DocumentDetailFormProps {
    document?: Document
    isAddingDocument: boolean
    isEditing: boolean
    setIsEditing: (val: boolean) => void
    handleCloseCard: () => void
    setFormError: (val: string | null) => void
    setFormSuccess: (val: string | null) => void
}

const DocumentDetailForm: React.FC<DocumentDetailFormProps> = ({
    document,
    isAddingDocument,
    isEditing,
    setIsEditing,
    handleCloseCard,
    setFormError,
    setFormSuccess,
}) => {
    const setActiveDocumentId = useDocumentStore((d) => d.setActiveDocumentId)
    const setIsAddingDocumentStore = useDocumentStore(
        (d) => d.setIsAddingDocument
    )

    // Permission guards
    const canUpload = usePermission(PERMISSIONS.DOCUMENTS_UPLOAD)
    const canUpdate = usePermission(PERMISSIONS.DOCUMENTS_UPDATE)
    const canSave = isAddingDocument ? canUpload : canUpdate

    const uploadMutation = useUploadDocument()
    const updateMutation = useUpdateDocument()

    const [selectedFile, setSelectedFile] = useState<File | null>(null)
    const [title, setTitle] = useState('')
    const [category, setCategory] = useState('')
    const [effectiveDate, setEffectiveDate] = useState<string | null>(null)
    const [accessLevel, setAccessLevel] = useState('public')
    const [targetUserIds, setTargetUserIds] = useState<ID[]>([])
    // Policy groups state
    const [policyGroups, setPolicyGroups] = useState<PolicyGroupState[]>([])
    const [showPolicySections, setShowPolicySections] = useState(false)

    const formRef = useRef<HTMLFormElement>(null)

    // Metadata hooks
    const { data: departmentsData } = useSimpleDepartments()
    const { data: rolesData } = useSimpleRoles()
    const { data: jobTitlesData } = useSimpleJobTitles()

    const departmentOptions =
        departmentsData?.map((d) => ({ value: d.id, label: d.name })) ?? []
    const roleOptions =
        rolesData?.map((r) => ({ value: r.id, label: r.name })) ?? []
    const jobTitleOptions =
        jobTitlesData?.map((jt) => ({
            value: jt.id,
            label: `${jt.title_name} (${jt.code})`,
        })) ?? []

    const accessLevelOptions = [
        { value: 'public', label: 'Công khai' },
        { value: 'private', label: 'Riêng tư' },
        { value: 'managerial', label: 'Quản lý' },
    ]

    // Reset scroll when state changes
    useEffect(() => {
        const scrollContainer = formRef.current?.parentElement?.parentElement
        if (scrollContainer) scrollContainer.scrollTop = 0
    }, [isEditing, isAddingDocument])

    const isInitialized = useRef(false)

    useEffect(() => {
        if (!isEditing && !isAddingDocument) {
            isInitialized.current = false
        }
    }, [isEditing, isAddingDocument])

    // Initialize form states
    useEffect(() => {
        if (document && isEditing && !isInitialized.current) {
            setTitle(document.title || '')
            setCategory(document.category || '')
            setEffectiveDate(document.effective_date || null)
            setAccessLevel(document.access_level || 'public')
            setTargetUserIds(document.target_users?.map((u) => u.id) || [])

            const restored = fromDocument(document)
            setPolicyGroups(restored)
            setShowPolicySections(restored.length > 0)
            isInitialized.current = true
        } else if (isAddingDocument && !isInitialized.current) {
            setSelectedFile(null)
            setTitle('')
            setCategory('')
            setEffectiveDate(null)
            setAccessLevel('public')
            setTargetUserIds([])
            setPolicyGroups([])
            setShowPolicySections(false)
            isInitialized.current = true
        }
    }, [document, isEditing, isAddingDocument])

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            const file = e.target.files[0]
            setSelectedFile(file)
            if (!title) {
                const nameWithoutExt =
                    file.name.substring(0, file.name.lastIndexOf('.')) ||
                    file.name
                setTitle(nameWithoutExt)
            }
        }
    }

    // ── Policy group handlers ──────────────────────────────────────────────
    const handleAddPolicyGroup = () => {
        setPolicyGroups((prev) => [...prev, emptyPolicy()])
        setShowPolicySections(true)
    }

    const handleUpdateGroup = (
        id: string,
        patch: Partial<PolicyGroupState>
    ) => {
        setPolicyGroups((prev) =>
            prev.map((g) => (g.id === id ? { ...g, ...patch } : g))
        )
    }

    const handleRemoveGroup = (id: string) => {
        setPolicyGroups((prev) => {
            const next = prev.filter((g) => g.id !== id)
            if (next.length === 0) setShowPolicySections(false)
            return next
        })
    }

    const handleAccessLevelChange = (val: string | null) => {
        const newLevel = val || 'public'
        setAccessLevel(newLevel)
        if (newLevel !== 'private') {
            setPolicyGroups([])
            setShowPolicySections(false)
            setTargetUserIds([])
        }
    }

    const isSubmitting = uploadMutation.isPending || updateMutation.isPending

    const handleSubmit = async (e: React.SyntheticEvent<HTMLFormElement>) => {
        e.preventDefault()
        setFormError(null)
        setFormSuccess(null)

        // Validate Private: phải có ít nhất 1 policy group có điều kiện hoặc 1 target user
        if (accessLevel === 'private') {
            const hasValidPolicy = policyGroups.some(
                (g) =>
                    g.roleIds.length > 0 ||
                    g.departmentIds.length > 0 ||
                    g.jobTitleIds.length > 0
            )
            if (!hasValidPolicy && targetUserIds.length === 0) {
                setFormError(
                    'Tài liệu Riêng tư phải có ít nhất một Policy Group (có điều kiện) hoặc một Tài khoản được chỉ định.'
                )
                return
            }
        }

        const policiesPayload =
            accessLevel === 'private'
                ? toPoliciesPayload(policyGroups)
                : undefined

        if (isAddingDocument) {
            if (!selectedFile) {
                setFormError('Vui lòng chọn tệp để tải lên.')
                return
            }

            uploadMutation.mutate(
                {
                    file: selectedFile,
                    title: title.trim() || selectedFile.name,
                    category: category.trim() || null,
                    effective_date: effectiveDate,
                    access_level: accessLevel,
                    policies:
                        policiesPayload && policiesPayload.length > 0
                            ? policiesPayload
                            : null,
                    target_user_ids:
                        targetUserIds.length > 0 ? targetUserIds : null,
                },
                {
                    onSuccess: (created) => {
                        setFormSuccess('Tải lên tài liệu thành công!')
                        setActiveDocumentId(created.id)
                        setIsAddingDocumentStore(false)
                        setIsEditing(false)
                    },
                    onError: (err: any) => {
                        setFormError(
                            err.response?.data?.detail ??
                                'Tải lên tài liệu thất bại.'
                        )
                    },
                }
            )
        } else if (isEditing && document) {
            updateMutation.mutate(
                {
                    id: document.id,
                    payload: {
                        title: title.trim() || null,
                        category: category.trim() || null,
                        effective_date: effectiveDate,
                        access_level: accessLevel,
                        policies: policiesPayload ?? null,
                        target_user_ids: targetUserIds,
                    },
                },
                {
                    onSuccess: () => {
                        setFormSuccess('Cập nhật tài liệu thành công!')
                        setIsEditing(false)
                    },
                    onError: (err: any) => {
                        setFormError(
                            err.response?.data?.detail ??
                                'Cập nhật tài liệu thất bại.'
                        )
                    },
                }
            )
        }
    }

    return (
        <form ref={formRef} onSubmit={handleSubmit} className="space-y-4">
            {/* File Input (Only in Add Mode) */}
            {isAddingDocument && (
                <div className="space-y-1">
                    <label className="block text-sm font-semibold text-text-secondary">
                        Tệp tài liệu (
                        {ALLOWED_DOCUMENT_FILE_TYPES.map((e) => `.${e}`).join(
                            ', '
                        )}
                        ) *
                    </label>
                    <div className="border-2 border-dashed border-border hover:border-primary rounded-2xl p-6 transition-all bg-surface-raised cursor-pointer relative group flex flex-col items-center justify-center text-center">
                        <input
                            type="file"
                            accept={ALLOWED_DOCUMENT_FILE_TYPES.map(
                                (e) => `.${e}`
                            ).join(',')}
                            onChange={handleFileChange}
                            className="absolute inset-0 opacity-0 cursor-pointer w-full h-full z-10"
                        />
                        {selectedFile ? (
                            <>
                                <FileUp className="w-10 h-10 text-primary mb-2 group-hover:scale-110 transition-transform" />
                                <p className="text-xs font-semibold text-text-primary max-w-xs truncate">
                                    {selectedFile.name}
                                </p>
                                <p className="text-[10px] text-text-placeholder mt-0.5">
                                    {formatBytes(selectedFile.size)}
                                </p>
                            </>
                        ) : (
                            <>
                                <UploadCloud className="w-10 h-10 text-text-placeholder mb-2 group-hover:scale-110 transition-transform" />
                                <p className="text-xs font-semibold text-text-secondary">
                                    Nhấn hoặc kéo thả tệp vào đây để tải lên
                                </p>
                                <p className="text-[10px] text-text-placeholder mt-0.5">
                                    Chỉ hỗ trợ các tệp{' '}
                                    {ALLOWED_DOCUMENT_FILE_TYPES.map(
                                        (e) => `.${e}`
                                    ).join(', ')}
                                </p>
                            </>
                        )}
                    </div>
                </div>
            )}

            <Input
                label="Tiêu đề tài liệu"
                placeholder="Nhập tiêu đề tài liệu"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
            />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Input
                    label="Danh mục"
                    placeholder="Ví dụ: Quy định, Hướng dẫn..."
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                />

                <div className="space-y-1">
                    <label className="block text-sm font-semibold text-text-secondary">
                        Ngày hiệu lực
                    </label>
                    <DatePicker
                        value={effectiveDate}
                        onChange={(val) => setEffectiveDate(val)}
                        placeholder="Chọn ngày hiệu lực"
                    />
                </div>
            </div>

            <SearchableSelect
                options={accessLevelOptions}
                value={accessLevel}
                onChange={handleAccessLevelChange}
                label="Cấp độ truy cập"
                placeholder="Chọn cấp độ truy cập"
            />

            {/* ── PRIVATE ACCESS SECTION ───────────────────────────────────── */}
            {accessLevel === 'private' && (
                <div className="bg-bg/10 rounded-2xl p-4 border border-[#D4D7DE]/40 space-y-4 animate-fade-in">
                    {/* Section header */}
                    <div className="flex items-center gap-1.5 text-text-secondary font-bold text-xs uppercase tracking-wider">
                        <Shield className="w-3.5 h-3.5" />
                        <span>Giới hạn truy cập riêng tư</span>
                    </div>

                    {/* Policy Groups */}
                    {showPolicySections && policyGroups.length > 0 && (
                        <div className="space-y-2">
                            {/* OR badge giữa các groups */}
                            {policyGroups.map((group, i) => (
                                <React.Fragment key={group.id}>
                                    <PolicyGroupCard
                                        group={group}
                                        index={i}
                                        roleOptions={roleOptions}
                                        departmentOptions={departmentOptions}
                                        jobTitleOptions={jobTitleOptions}
                                        onUpdate={handleUpdateGroup}
                                        onRemove={handleRemoveGroup}
                                        canRemove={true}
                                    />
                                    {i < policyGroups.length - 1 && (
                                        <div className="flex items-center gap-2 px-2">
                                            <div className="flex-1 h-px bg-border/40" />
                                            <span className="text-[10px] font-bold text-primary bg-primary/10 px-2 py-0.5 rounded-full uppercase tracking-wider">
                                                HOẶC
                                            </span>
                                            <div className="flex-1 h-px bg-border/40" />
                                        </div>
                                    )}
                                </React.Fragment>
                            ))}
                        </div>
                    )}

                    {/* Add Policy Group button */}
                    <button
                        type="button"
                        onClick={handleAddPolicyGroup}
                        className="w-full flex items-center justify-center gap-2 py-2.5 px-4 border border-dashed border-primary/40 hover:border-primary rounded-xl text-xs font-semibold text-primary hover:bg-primary/5 transition-all"
                    >
                        <Plus className="w-3.5 h-3.5" />
                        Thêm Policy Group
                    </button>

                    {/* Individual users */}
                    <div className="pt-1 border-t border-border/30">
                        <SearchableUserMultiSelect
                            value={targetUserIds}
                            onChange={(val) => setTargetUserIds(val)}
                            initialSelectedUsers={document?.target_users ?? []}
                            placeholder="Chưa chọn tài khoản"
                            label="Tài khoản cụ thể được phép"
                        />
                    </div>
                </div>
            )}

            {/* Save & Cancel buttons */}
            <div className="flex gap-2.5 pt-2">
                <Button
                    type="button"
                    variant="secondary"
                    onClick={() => {
                        if (isAddingDocument) {
                            handleCloseCard()
                        } else {
                            setIsEditing(false)
                        }
                    }}
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
                            isAddingDocument ? 'Đang tải lên...' : 'Đang lưu...'
                        }
                    >
                        {isAddingDocument ? 'Tải lên tài liệu' : 'Lưu thay đổi'}
                    </Button>
                )}
            </div>
        </form>
    )
}

export default DocumentDetailForm
