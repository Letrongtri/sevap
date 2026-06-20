/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState } from 'react'
import { X, AlertCircle, CheckCircle } from 'lucide-react'
import { useDocumentStore } from '../../store/documentStore'
import {
    useDocument,
    useDeleteDocument,
    useDownloadDocument,
} from '../../hooks/useDocuments'
import LoadingSpinner from '../ui/LoadingSpinner'

import DocumentDetailView from './DocumentDetailView'
import DocumentDetailForm from './DocumentDetailForm'

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
    const [formError, setFormError] = useState<string | null>(null)
    const [formSuccess, setFormSuccess] = useState<string | null>(null)

    const handleCloseCard = () => {
        setActiveDocumentId(null)
        setIsAddingDocument(false)
        setIsEditing(false)
        setShowDeleteConfirm(false)
        setFormError(null)
        setFormSuccess(null)
    }

    const handleDownload = () => {
        if (!document) return
        setFormError(null)
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
                    setFormError(
                        err.response?.data?.detail ??
                            'Failed to download document file.'
                    )
                },
            }
        )
    }

    const handleDelete = () => {
        if (!document) return
        setFormError(null)
        setFormSuccess(null)

        deleteMutation.mutate(document.id, {
            onSuccess: () => {
                setFormSuccess('Document deleted successfully.')
                handleCloseCard()
            },
            onError: (err: any) => {
                setFormError(
                    err.response?.data?.detail ?? 'Failed to delete document.'
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
                    title="Close detail panel"
                    className="absolute top-3 right-3 p-1.5 rounded-lg text-text-placeholder hover:text-text-primary hover:bg-bg transition-all duration-150 z-20 cursor-pointer"
                >
                    <X className="w-5 h-5" />
                </button>

                <h2 className="text-lg font-bold text-text-primary">
                    {isAddingDocument
                        ? 'Upload New Document'
                        : isEditing
                          ? 'Edit Document Details'
                          : 'Document Information'}
                </h2>

                {/* Banner feedback */}
                {formError && (
                    <div className="mt-2 p-3 bg-error-bg border border-error-border text-error-text rounded-xl text-xs flex items-start gap-2 animate-fade-in-down">
                        <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                        <span>{formError}</span>
                    </div>
                )}
                {formSuccess && (
                    <div className="mt-2 p-3 bg-success-bg border border-success-border text-success rounded-xl text-xs flex items-start gap-2 animate-fade-in-down">
                        <CheckCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                        <span>{formSuccess}</span>
                    </div>
                )}
            </div>

            {/* Scrollable content */}
            <div className="flex-1 overflow-y-auto p-6 pt-4 scrollbar-thin">
                {isLoadingDoc && activeDocumentId && !isAddingDocument ? (
                    <div className="flex flex-col items-center justify-center py-20 space-y-3">
                        <LoadingSpinner />
                        <p className="text-xs text-text-placeholder">
                            Loading document details...
                        </p>
                    </div>
                ) : loadError && activeDocumentId && !isAddingDocument ? (
                    <div className="flex flex-col items-center justify-center py-20 text-center space-y-2">
                        <AlertCircle className="w-8 h-8 text-error" />
                        <h4 className="text-sm font-semibold text-text-primary">
                            Failed to load details
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
                        setFormError={setFormError}
                        setFormSuccess={setFormSuccess}
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
