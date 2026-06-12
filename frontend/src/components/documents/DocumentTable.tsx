import DocumentTableFilters from './DocumentTableFilters'
import DocumentList from './DocumentList'

const DocumentTable = () => {
    return (
        <div className="bg-white rounded-2xl border border-[#D4D7DE]/60 shadow-sm overflow-hidden flex flex-col h-full">
            <DocumentTableFilters />
            <DocumentList />
        </div>
    )
}

export default DocumentTable
