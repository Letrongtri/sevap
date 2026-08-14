import React from 'react'
import Modal from '../ui/Modal'
import DocumentPreviewer from './DocumentPreviewer'
import { useDocument, useDocumentFileBlob } from '../../hooks/useDocuments'
import { Loader2, AlertCircle, RefreshCw } from 'lucide-react'
import Button from '../ui/Button'
import type { ID } from '../../types/common'

interface DocumentPreviewModalProps {
    documentId: ID | null
    isOpen: boolean
    onClose: () => void
}

export const DocumentPreviewModal: React.FC<DocumentPreviewModalProps> = ({
    documentId,
    isOpen,
    onClose,
}) => {
    const {
        data: doc,
        isLoading: isLoadingDoc,
        error: docError,
        refetch: refetchDoc,
    } = useDocument(isOpen ? documentId : null)

    const {
        data: fileBlob,
        isLoading: isLoadingBlob,
        error: blobError,
        refetch: refetchBlob,
    } = useDocumentFileBlob(isOpen ? documentId : null)

    const cleanFileName =
        doc?.file_name?.substring(doc.file_name.indexOf('_') + 1) ||
        doc?.file_name ||
        'document'

    const isLoading = isLoadingDoc || isLoadingBlob
    const hasError = docError || blobError

    const handleRetry = () => {
        refetchDoc()
        refetchBlob()
    }

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={doc?.title || cleanFileName || 'Xem tài liệu'}
            size="3xl"
        >
            <div className="h-[75vh] w-full flex flex-col overflow-hidden relative rounded-xl border border-border/60 bg-surface">
                {isLoading ? (
                    <div className="w-full h-full flex flex-col items-center justify-center p-8 bg-slate-50 text-center space-y-3">
                        <Loader2 className="w-10 h-10 text-primary animate-spin" />
                        <p className="text-sm font-medium text-slate-600">
                            Đang tải tệp tài liệu...
                        </p>
                    </div>
                ) : hasError ? (
                    <div className="w-full h-full flex flex-col items-center justify-center p-8 bg-slate-50 text-center space-y-3">
                        <AlertCircle className="w-12 h-12 text-rose-500" />
                        <h3 className="text-base font-bold text-slate-800">
                            Không thể tải tệp tài liệu
                        </h3>
                        <p className="text-xs text-slate-500 max-w-md">
                            {docError?.message ||
                                blobError?.message ||
                                'Đã xảy ra lỗi trong quá trình tải dữ liệu tài liệu. Vui lòng thử lại sau.'}
                        </p>
                        <Button
                            variant="secondary"
                            size="sm"
                            leftIcon={<RefreshCw className="w-3.5 h-3.5" />}
                            onClick={handleRetry}
                        >
                            Tải lại
                        </Button>
                    </div>
                ) : fileBlob ? (
                    <DocumentPreviewer
                        key={String(documentId)}
                        documentId={documentId || undefined}
                        file={fileBlob}
                        fileName={cleanFileName}
                        fileType={doc?.file_type ?? undefined}
                    />
                ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center p-8 bg-slate-50 text-center space-y-2">
                        <AlertCircle className="w-10 h-10 text-slate-300" />
                        <p className="text-sm text-slate-500">
                            Không tìm thấy dữ liệu tệp tài liệu
                        </p>
                    </div>
                )}
            </div>
        </Modal>
    )
}

export default DocumentPreviewModal
