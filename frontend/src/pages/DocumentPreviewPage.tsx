import { useParams } from '@tanstack/react-router'
import { useDocument, useDocumentFileBlob } from '../hooks/useDocuments'
import { usePageTitle } from '../hooks/usePageTitle'
import DocumentPreviewer from '../components/preview/DocumentPreviewer'
import Button from '../components/ui/Button'
import { Loader2, AlertCircle } from 'lucide-react'
import type { ID } from '../types/common'

export default function DocumentPreviewPage() {
    const { documentId } = useParams({
        strict: false,
    }) as { documentId?: ID }

    const id = documentId || null

    const {
        data: doc,
        isLoading: isLoadingDoc,
        error: docError,
    } = useDocument(id)

    const {
        data: fileBlob,
        isLoading: isLoadingBlob,
        error: blobError,
    } = useDocumentFileBlob(id)

    const title = doc?.title || doc?.file_name || 'Xem tài liệu'
    usePageTitle(title)

    const cleanFileName =
        doc?.file_name?.substring(doc.file_name.indexOf('_') + 1) ||
        doc?.file_name ||
        'document'

    const isLoading = isLoadingDoc || isLoadingBlob
    const hasError = docError || blobError

    return (
        <div className="h-full flex flex-col gap-4 overflow-hidden">
            <div className="flex-1 bg-white rounded-2xl border border-[#D4D7DE]/60 shadow-lg overflow-hidden flex flex-col relative">
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
                            onClick={() => window.location.reload()}
                        >
                            Tải lại trang
                        </Button>
                    </div>
                ) : fileBlob ? (
                    <DocumentPreviewer
                        key={id || 'preview'}
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
        </div>
    )
}
