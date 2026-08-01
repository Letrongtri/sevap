import { useDirectoryStore } from '../../store/directoryStore'
import DirectoryTableFilters from './DirectoryTableFilters'
import UserDirectoryTable from './UserDirectoryTable'
import DepartmentDirectoryTable from './DepartmentDirectoryTable'
import JobTitleDirectoryTable from './JobTitleDirectoryTable'
import DocumentDirectoryTable from './DocumentDirectoryTable'
import { DirectoryTab } from '../../types/directory'

const DirectoryTable = () => {
    const activeTab = useDirectoryStore((s) => s.activeTab)

    const renderTable = () => {
        switch (activeTab) {
            case DirectoryTab.Users:
                return <UserDirectoryTable />
            case DirectoryTab.Departments:
                return <DepartmentDirectoryTable />
            case DirectoryTab.JobTitles:
                return <JobTitleDirectoryTable />
            case DirectoryTab.Documents:
                return <DocumentDirectoryTable />
            default:
                return null
        }
    }

    return (
        <div className="bg-white rounded-2xl border border-[#D4D7DE]/60 shadow-sm overflow-hidden flex flex-col h-full">
            {/* Search Filter Header */}
            <DirectoryTableFilters />

            {/* List/Table content */}
            <div className="overflow-hidden flex-1">{renderTable()}</div>
        </div>
    )
}

export default DirectoryTable
