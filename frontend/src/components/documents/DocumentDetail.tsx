import { useState } from 'react'
import { X, AlertCircle } from 'lucide-react'
import { useDocumentStore } from '../../store/documentStore'
import {
    useDocument,
    useDeleteDocument,
    useDownloadDocument,
} from '../../hooks/useDocuments'
import LoadingSpinner from '../ui/LoadingSpinner'

import DocumentDetailView from './DocumentDetailView'
import DocumentDetailForm from './DocumentDetailForm'
import { toast } from 'sonner'

const DocumentDetail = () => {
    const activeDocumentId = useDocumentStore((d) => d.activeDocumentId)
    const setActiveDocumentId = useDocumentStore((d) => d.setActiveDocumentId)
    const isAddingDocument = useDocumentStore((d) => d.isAddingDocument)
    const setIsAddingDocument = useDocumentStore((d) => d.setIsAddingDocument)

    // Query detailed document from backend
    const {
        data: document,
        isLoading: isLoadingDoc,
        error: loadError,
    } = useDocument(activeDocumentId)

    const deleteMutation = useDeleteDocument()
    const downloadMutation = useDownloadDocument()

    // UI States
    const [isEditing, setIsEditing] = useState(false)
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)

    const handleCloseCard = () => {
        setActiveDocumentId(null)
        setIsAddingDocument(false)
        setIsEditing(false)
        setShowDeleteConfirm(false)
    }

    const handleDownload = () => {
        if (!document) return
        downloadMutation.mutate(
            {
                id: document.id,
                fileName:
                    document.file_name?.substring(
                        document.file_name.indexOf('_') + 1
                    ) || 'document.docx',
            },
            {
                onError: (err: any) => {
                    toast.error(
                        err.response?.data?.detail ??
                            'Tải tệp tài liệu thất bại.'
                    )
                },
            }
        )
    }

    const handleDelete = () => {
        if (!document) return
        deleteMutation.mutate(document.id, {
            onSuccess: () => {
                toast.success('Xóa tài liệu thành công!')
                handleCloseCard()
            },
            onError: (err: any) => {
                toast.error(
                    err.response?.data?.detail ?? 'Xóa tài liệu thất bại.'
                )
            },
        })
    }

    const isEditingOrAdding = isAddingDocument || isEditing

    return (
        <div className="flex flex-col h-full relative">
            {/* Close button & Card header */}
            <div className="px-6 py-4 border-b border-[#D4D7DE]/40 flex-shrink-0 relative">
                <button
                    onClick={handleCloseCard}
                    title="Đóng bảng chi tiết"
                    className="absolute top-3 right-3 p-1.5 rounded-lg text-text-placeholder hover:text-text-primary hover:bg-bg transition-all duration-150 z-20 cursor-pointer"
                >
                    <X className="w-5 h-5" />
                </button>

                <h2 className="text-lg font-bold text-text-primary">
                    {isAddingDocument
                        ? 'Tải lên tài liệu mới'
                        : isEditing
                          ? 'Chỉnh sửa thông tin tài liệu'
                          : 'Thông tin tài liệu'}
                </h2>
            </div>

            {/* Scrollable content */}
            <div className="flex-1 overflow-y-auto p-6 pt-4 scrollbar-thin">
                {isLoadingDoc && activeDocumentId && !isAddingDocument ? (
                    <div className="flex flex-col items-center justify-center py-20 space-y-3 h-100">
                        <LoadingSpinner />
                        <p className="text-xs text-text-placeholder">
                            Đang tải chi tiết tài liệu...
                        </p>
                    </div>
                ) : loadError && activeDocumentId && !isAddingDocument ? (
                    <div className="flex flex-col items-center justify-center py-20 text-center space-y-2">
                        <AlertCircle className="w-8 h-8 text-error" />
                        <h4 className="text-sm font-semibold text-text-primary">
                            Tải chi tiết thất bại
                        </h4>
                        <p className="text-xs text-text-placeholder max-w-xs">
                            {loadError.message}
                        </p>
                    </div>
                ) : isEditingOrAdding ? (
                    /* --- EDIT / ADD FORM --- */
                    <DocumentDetailForm
                        document={document}
                        isAddingDocument={isAddingDocument}
                        isEditing={isEditing}
                        setIsEditing={setIsEditing}
                        handleCloseCard={handleCloseCard}
                    />
                ) : document ? (
                    /* --- VIEW MODE --- */
                    <DocumentDetailView
                        document={document}
                        setIsEditing={setIsEditing}
                        setShowDeleteConfirm={setShowDeleteConfirm}
                        showDeleteConfirm={showDeleteConfirm}
                        handleDelete={handleDelete}
                        isSubmitting={deleteMutation.isPending}
                        handleDownload={handleDownload}
                        isDownloading={downloadMutation.isPending}
                    />
                ) : null}
            </div>
        </div>
    )
}

export default DocumentDetail
