/* eslint-disable @typescript-eslint/no-explicit-any */
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
import type { ID } from '../../types/common'

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
        { value: 'public', label: 'Public' },
        { value: 'private', label: 'Private' },
        { value: 'managerial', label: 'Managerial' },
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
                    'For Private documents, you must select at least one Department, Role, or Target User.'
                )
                return
            }
        }

        if (isAddingDocument) {
            if (!selectedFile) {
                setFormError('Please select a file to upload.')
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
                        setFormSuccess('Document uploaded successfully!')
                        setActiveDocumentId(created.id)
                        setIsAddingDocumentStore(false)
                        setIsEditing(false)
                    },
                    onError: (err: any) => {
                        setFormError(
                            err.response?.data?.detail ??
                                'Failed to upload document.'
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
                        setFormSuccess('Document updated successfully!')
                        setIsEditing(false)
                    },
                    onError: (err: any) => {
                        setFormError(
                            err.response?.data?.detail ??
                                'Failed to update document.'
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
                        Document File (.docx) *
                    </label>
                    <div className="border-2 border-dashed border-border hover:border-primary rounded-2xl p-6 transition-all bg-surface-raised cursor-pointer relative group flex flex-col items-center justify-center text-center">
                        <input
                            type="file"
                            accept=".docx"
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
                                    Click or drag file to upload
                                </p>
                                <p className="text-[10px] text-text-placeholder mt-0.5">
                                    Only MS Word (.docx) files supported
                                </p>
                            </>
                        )}
                    </div>
                </div>
            )}

            <Input
                label="Document Title"
                placeholder="Enter document title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
            />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Input
                    label="Category"
                    placeholder="e.g. Policy, Guide..."
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                />

                <div className="space-y-1">
                    <label className="block text-sm font-semibold text-text-secondary">
                        Effective Date
                    </label>
                    <DatePicker
                        value={effectiveDate}
                        onChange={(val) => setEffectiveDate(val)}
                        placeholder="Select effective date"
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
                label="Access Level"
                placeholder="Select access level"
            />

            {/* ACCESS RESTRICTIONS SECTION (Only visible when Access Level is Private) */}
            {accessLevel === 'private' && (
                <div className="bg-bg/10 rounded-2xl p-4 border border-[#D4D7DE]/40 space-y-4 animate-fade-in">
                    <div className="flex items-center gap-1.5 text-text-secondary font-bold text-xs uppercase tracking-wider mb-1">
                        <Shield className="w-3.5 h-3.5" />
                        <span>Private Access Restrictions</span>
                    </div>

                    <SearchableMultiSelect
                        options={departmentOptions}
                        value={departmentIds}
                        onChange={(val) => setDepartmentIds(val)}
                        placeholder="No departments selected"
                        label="Allowed Departments"
                    />

                    <SearchableMultiSelect
                        options={roleOptions}
                        value={roleAccess}
                        onChange={(val) => setRoleAccess(val)}
                        placeholder="No roles selected"
                        label="Allowed Roles"
                    />

                    <SearchableUserMultiSelect
                        value={targetUserIds}
                        onChange={(val) => setTargetUserIds(val)}
                        initialSelectedUsers={document?.target_users ?? []}
                        placeholder="No users selected"
                        label="Allowed Users"
                    />

                    <div className="flex items-start gap-1.5 text-[10px] text-text-placeholder bg-white p-2.5 rounded-lg border border-border">
                        <Info className="w-3.5 h-3.5 text-primary flex-shrink-0 mt-0.5" />
                        <p className="leading-normal">
                            Private documents require at least one department,
                            role, or user restriction. Only matched entities can
                            read it.
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
                    Cancel
                </Button>
                <Button
                    type="submit"
                    variant="primary"
                    fullWidth
                    isLoading={isSubmitting}
                    loadingText={
                        isAddingDocument ? 'Uploading...' : 'Saving...'
                    }
                >
                    {isAddingDocument ? 'Upload Document' : 'Save Changes'}
                </Button>
            </div>
        </form>
    )
}

export default DocumentDetailForm
