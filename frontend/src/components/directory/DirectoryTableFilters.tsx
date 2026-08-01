import { useState, useEffect } from 'react'
import { Search } from 'lucide-react'
import { useDirectoryStore } from '../../store/directoryStore'
import { DirectoryTab } from '../../types/directory'
import { useSimpleDepartments } from '../../hooks/useSimpleDepartments'
import { useSimpleJobTitles } from '../../hooks/useSimpleJobTitles'
import SearchableSelect from '../ui/SearchableSelect'

const DirectoryTableFilters = () => {
    const activeTab = useDirectoryStore((s) => s.activeTab)
    const query = useDirectoryStore((s) => s.query)
    const setQuery = useDirectoryStore((s) => s.setQuery)
    const setPage = useDirectoryStore((s) => s.setPage)

    const departmentId = useDirectoryStore((s) => s.departmentId)
    const setDepartmentId = useDirectoryStore((s) => s.setDepartmentId)
    const jobTitleId = useDirectoryStore((s) => s.jobTitleId)
    const setJobTitleId = useDirectoryStore((s) => s.setJobTitleId)

    const [localSearch, setLocalSearch] = useState(query || '')

    // Debounce search query update to Zustand store
    useEffect(() => {
        const handler = setTimeout(() => {
            setQuery(localSearch)
            setPage(1) // Reset page to 1 on search
        }, 300)
        return () => clearTimeout(handler)
    }, [localSearch, setQuery, setPage])

    const { data: departmentsData } = useSimpleDepartments()
    const { data: jobTitlesData } = useSimpleJobTitles()

    const departmentOptions = [
        { value: null, label: 'Tất cả phòng ban' },
        ...(departmentsData || []).map((d) => ({ value: d.id, label: d.name })),
    ]

    const jobTitleOptions = [
        { value: null, label: 'Tất cả chức danh' },
        ...(jobTitlesData || []).map((j) => ({
            value: j.id,
            label: j.title_name,
        })),
    ]

    const getPlaceholder = () => {
        switch (activeTab) {
            case DirectoryTab.Users:
                return 'Tìm kiếm tài khoản theo tên, mã nhân viên, email...'
            case DirectoryTab.Departments:
                return 'Tìm kiếm phòng ban theo tên hoặc mã...'
            case DirectoryTab.JobTitles:
                return 'Tìm kiếm chức danh theo tên hoặc mã...'
            default:
                return 'Tìm kiếm...'
        }
    }

    return (
        <div className="p-4 border-b border-[#D4D7DE]/40 flex flex-col gap-4 bg-bg/20 flex-shrink-0">
            <div className="flex flex-col sm:flex-row gap-3 justify-between items-stretch sm:items-center">
                <div className="relative flex-1 max-w-md">
                    <Search className="w-4 h-4 text-text-placeholder absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                        type="text"
                        placeholder={getPlaceholder()}
                        value={localSearch}
                        onChange={(e) => setLocalSearch(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 text-sm bg-surface-raised border border-border rounded-xl focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all placeholder:text-text-placeholder"
                    />
                </div>

                {activeTab === DirectoryTab.Users && (
                    <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center min-w-[320px]">
                        <div className="w-full sm:w-48">
                            <SearchableSelect
                                options={departmentOptions}
                                value={departmentId}
                                onChange={(val) => {
                                    setDepartmentId(val)
                                    setPage(1)
                                }}
                                placeholder="Tất cả phòng ban"
                            />
                        </div>
                        <div className="w-full sm:w-48">
                            <SearchableSelect
                                options={jobTitleOptions}
                                value={jobTitleId}
                                onChange={(val) => {
                                    setJobTitleId(val)
                                    setPage(1)
                                }}
                                placeholder="Tất cả chức danh"
                            />
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}

export default DirectoryTableFilters
