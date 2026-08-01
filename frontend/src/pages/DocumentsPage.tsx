import Header from '../components/ui/Header'
import DocumentTable from '../components/documents/DocumentTable'
import DocumentDetail from '../components/documents/DocumentDetail'
import { useDocumentStore } from '../store/documentStore'
import { usePageTitle } from '../hooks/usePageTitle'
import { usePermission } from '../hooks/usePermission'
import { PERMISSIONS } from '../lib/permissions'

export default function DocumentsPage() {
    usePageTitle('Quản lý tài liệu')
    const canUpload = usePermission(PERMISSIONS.DOCUMENTS_UPLOAD)
    const activeDocumentId = useDocumentStore((d) => d.activeDocumentId)
    const isAddingDocument = useDocumentStore((d) => d.isAddingDocument)
    const showDetail = activeDocumentId !== null || isAddingDocument
    const setIsAddingDocument = useDocumentStore((d) => d.setIsAddingDocument)
    const setActiveDocumentId = useDocumentStore((d) => d.setActiveDocumentId)

    const handleStartAddDocument = () => {
        setActiveDocumentId(null)
        setIsAddingDocument(true)
    }

    return (
        <div className="h-full flex flex-col gap-4 overflow-hidden">
            {/* Header section */}
            <div className="flex-shrink-0">
                <Header
                    title="Quản lý tài liệu"
                    isAdding={isAddingDocument}
                    onAdd={canUpload ? handleStartAddDocument : undefined}
                    btnTitle="Thêm tài liệu"
                />
            </div>

            {/* Filter and Content layout */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch flex-1 overflow-hidden">
                {/* Left side: Users table list */}
                <div
                    className={[
                        'transition-all duration-300 ease-in-out h-full overflow-hidden flex flex-col',
                        showDetail
                            ? 'lg:col-span-7 xl:col-span-8'
                            : 'lg:col-span-12',
                    ].join(' ')}
                >
                    <DocumentTable />
                </div>

                {/* Right side: Selected user details or add user card */}
                {showDetail && (
                    <div className="lg:col-span-5 xl:col-span-4 bg-white rounded-2xl border border-[#D4D7DE]/60 shadow-lg relative animate-slide-in-right flex flex-col h-full overflow-hidden">
                        <DocumentDetail key={activeDocumentId || 'adding'} />
                    </div>
                )}
            </div>
        </div>
    )
}
