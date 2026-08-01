import React, { useState, useEffect, useRef } from 'react'
import { Shield, Info, UploadCloud, FileUp } from 'lucide-react'
import { useUploadDocument, useUpdateDocument } from '../../hooks/useDocuments'
import { useSimpleDepartments } from '../../hooks/useSimpleDepartments'
import { useSimpleRoles } from '../../hooks/useSimpleRoles'
import { useDocumentStore } from '../../store/documentStore'

import SearchableSelect from '../ui/SearchableSelect'
import SearchableMultiSelect from '../ui/SearchableMultiSelect'
import SearchableUserMultiSelect from '../ui/SearchableUserMultiSelect'
import DatePicker from '../ui/DatePicker'
import Input from '../ui/Input'
import Button from '../ui/Button'
import { formatBytes } from '../../../utils/formater'
import type { Document } from '../../types/document'
import { type ID, ALLOWED_DOCUMENT_FILE_TYPES } from '../../types/common'

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

    const uploadMutation = useUploadDocument()
    const updateMutation = useUpdateDocument()

    const [selectedFile, setSelectedFile] = useState<File | null>(null)
    const [title, setTitle] = useState('')
    const [category, setCategory] = useState('')
    const [effectiveDate, setEffectiveDate] = useState<string | null>(null)
    const [accessLevel, setAccessLevel] = useState('public')
    const [departmentIds, setDepartmentIds] = useState<ID[]>([])
    const [roleAccess, setRoleAccess] = useState<ID[]>([])
    const [targetUserIds, setTargetUserIds] = useState<ID[]>([])

    const formRef = useRef<HTMLFormElement>(null)

    // Metadata hooks
    const { data: departmentsData } = useSimpleDepartments()
    const { data: rolesData } = useSimpleRoles()

    const departmentOptions =
        departmentsData?.map((d) => ({
            value: d.id,
            label: d.name,
        })) ?? []

    const roleOptions =
        rolesData?.map((r) => ({
            value: r.id,
            label: r.name,
        })) ?? []

    const accessLevelOptions = [
        { value: 'public', label: 'Công khai' },
        { value: 'private', label: 'Riêng tư' },
        { value: 'managerial', label: 'Quản lý' },
    ]

    // Reset scroll when state changes
    useEffect(() => {
        const scrollContainer = formRef.current?.parentElement?.parentElement
        if (scrollContainer) {
            scrollContainer.scrollTop = 0
        }
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
            setDepartmentIds(document.departments?.map((d) => d.id) || [])
            setRoleAccess(document.roles?.map((r) => r.id) || [])
            setTargetUserIds(document.target_users?.map((u) => u.id) || [])
            isInitialized.current = true
        } else if (isAddingDocument && !isInitialized.current) {
            setSelectedFile(null)
            setTitle('')
            setCategory('')
            setEffectiveDate(null)
            setAccessLevel('public')
            setDepartmentIds([])
            setRoleAccess([])
            setTargetUserIds([])
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

    const isSubmitting = uploadMutation.isPending || updateMutation.isPending

    const handleSubmit = async (e: React.SyntheticEvent<HTMLFormElement>) => {
        e.preventDefault()
        setFormError(null)
        setFormSuccess(null)

        // Validate Private access level restrictions
        if (accessLevel === 'private') {
            if (
                departmentIds.length === 0 &&
                roleAccess.length === 0 &&
                targetUserIds.length === 0
            ) {
                setFormError(
                    'Đối với tài liệu Riêng tư, bạn phải chọn ít nhất một Phòng ban, Vai trò hoặc Tài khoản.'
                )
                return
            }
        }

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
                    department_ids:
                        departmentIds.length > 0 ? departmentIds : null,
                    role_access: roleAccess.length > 0 ? roleAccess : null,
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
                        department_ids: departmentIds,
                        role_access: roleAccess,
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
                onChange={(val) => {
                    const newLevel = val || 'public'
                    setAccessLevel(newLevel)
                    if (newLevel !== 'private') {
                        setDepartmentIds([])
                        setRoleAccess([])
                        setTargetUserIds([])
                    }
                }}
                label="Cấp độ truy cập"
                placeholder="Chọn cấp độ truy cập"
            />

            {/* ACCESS RESTRICTIONS SECTION (Only visible when Access Level is Private) */}
            {accessLevel === 'private' && (
                <div className="bg-bg/10 rounded-2xl p-4 border border-[#D4D7DE]/40 space-y-4 animate-fade-in">
                    <div className="flex items-center gap-1.5 text-text-secondary font-bold text-xs uppercase tracking-wider mb-1">
                        <Shield className="w-3.5 h-3.5" />
                        <span>Giới hạn truy cập riêng tư</span>
                    </div>

                    <SearchableMultiSelect
                        options={departmentOptions}
                        value={departmentIds}
                        onChange={(val) => setDepartmentIds(val)}
                        placeholder="Chưa chọn phòng ban"
                        label="Phòng ban được phép"
                    />

                    <SearchableMultiSelect
                        options={roleOptions}
                        value={roleAccess}
                        onChange={(val) => setRoleAccess(val)}
                        placeholder="Chưa chọn vai trò"
                        label="Vai trò được phép"
                    />

                    <SearchableUserMultiSelect
                        value={targetUserIds}
                        onChange={(val) => setTargetUserIds(val)}
                        initialSelectedUsers={document?.target_users ?? []}
                        placeholder="Chưa chọn tài khoản"
                        label="Tài khoản được phép"
                    />

                    <div className="flex items-start gap-1.5 text-[10px] text-text-placeholder bg-white p-2.5 rounded-lg border border-border">
                        <Info className="w-3.5 h-3.5 text-primary flex-shrink-0 mt-0.5" />
                        <p className="leading-normal">
                            Tài liệu riêng tư yêu cầu chọn ít nhất một phòng ban,
                            vai trò hoặc tài khoản. Chỉ những đối tượng phù hợp mới
                            có thể xem được.
                        </p>
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
            </div>
        </form>
    )
}

export default DocumentDetailForm
