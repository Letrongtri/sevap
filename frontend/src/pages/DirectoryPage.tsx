import { useEffect } from 'react'
import {
    Building2,
    Users,
    Briefcase,
    FileText,
    ShieldOff,
    type LucideIcon,
} from 'lucide-react'
import { useDirectoryStore } from '../store/directoryStore'
import { DirectoryTab } from '../types/directory'
import { useDirectoryOverview } from '../hooks/useDirectory'
import { useDirectoryPermissions } from '../hooks/useDirectoryPermissions'
import Header from '../components/ui/Header'
import LoadingSpinner from '../components/ui/LoadingSpinner'
import DirectoryTable from '../components/directory/DirectoryTable'
import { usePageTitle } from '../hooks/usePageTitle'

const TabItem = ({
    label,
    icon: Icon,
    value,
    count,
    activeTab,
    setActiveTab,
}: {
    label: string
    icon: LucideIcon
    value: DirectoryTab
    count: number
    activeTab: DirectoryTab
    setActiveTab: (value: DirectoryTab) => void
}) => {
    return (
        <div
            key={label}
            className={`bg-surface rounded-2xl border p-4 flex items-center gap-3 ${
                activeTab === value
                    ? 'border-primary'
                    : 'border-border hover:border-primary/50 transition-colors cursor-pointer'
            }`}
            onClick={() => setActiveTab(value)}
        >
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                <Icon className="w-5 h-5 text-primary" />
            </div>
            <div>
                <p className="text-lg font-bold text-text-primary">{count}</p>
                <p className="text-xs text-text-muted">{label}</p>
            </div>
        </div>
    )
}

const AccessDenied = () => (
    <div className="flex flex-col items-center justify-center min-h-[400px] text-center p-8 space-y-3">
        <div className="w-16 h-16 rounded-2xl bg-error/10 flex items-center justify-center">
            <ShieldOff className="w-8 h-8 text-error" />
        </div>
        <h3 className="text-lg font-semibold text-text-primary">
            Truy cập bị từ chối
        </h3>
        <p className="text-sm text-text-placeholder max-w-sm">
            Bạn không có quyền xem Danh bạ công ty. Vui lòng liên hệ quản trị
            viên.
        </p>
    </div>
)

export default function DirectoryPage() {
    usePageTitle('Danh bạ công ty')
    const activeTab = useDirectoryStore((t) => t.activeTab)
    const setActiveTab = useDirectoryStore((t) => t.setActiveTab)

    const { data: directoryOverview, isLoading, error } = useDirectoryOverview()
    const {
        canViewUsers,
        canViewDepartments,
        canViewJobTitles,
        canViewDocuments,
        allowedTabs,
        hasAnyAccess,
    } = useDirectoryPermissions()

    // Nếu tab đang active không có quyền, tự động chuyển sang tab hợp lệ đầu tiên
    useEffect(() => {
        if (allowedTabs.length > 0 && !allowedTabs.includes(activeTab)) {
            setActiveTab(allowedTabs[0])
        }
    }, [allowedTabs, activeTab, setActiveTab])

    if (isLoading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[400px] space-y-3">
                <LoadingSpinner />
                <p className="text-sm text-text-placeholder">
                    Đang tải danh bạ...
                </p>
            </div>
        )
    }

    if (error) {
        return <div>Lỗi: {error.message}</div>
    }

    if (!hasAnyAccess) {
        return (
            <div className="h-full flex flex-col gap-4 overflow-hidden">
                <div className="flex-shrink-0">
                    <Header title="Danh bạ công ty" />
                </div>
                <AccessDenied />
            </div>
        )
    }

    return (
        <div className="h-full flex flex-col gap-4 overflow-hidden">
            {/* Header section */}
            <div className="flex-shrink-0">
                <Header title="Danh bạ công ty" />
            </div>

            {/* Stats — only show tabs user has permission to view */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {canViewUsers && (
                    <TabItem
                        label="Tài khoản"
                        icon={Users}
                        value={DirectoryTab.Users}
                        count={directoryOverview?.users_count || 0}
                        activeTab={activeTab}
                        setActiveTab={setActiveTab}
                    />
                )}
                {canViewDepartments && (
                    <TabItem
                        label="Phòng ban"
                        icon={Building2}
                        value={DirectoryTab.Departments}
                        count={directoryOverview?.departments_count || 0}
                        activeTab={activeTab}
                        setActiveTab={setActiveTab}
                    />
                )}
                {canViewJobTitles && (
                    <TabItem
                        label="Chức danh"
                        icon={Briefcase}
                        value={DirectoryTab.JobTitles}
                        count={directoryOverview?.job_titles_count || 0}
                        activeTab={activeTab}
                        setActiveTab={setActiveTab}
                    />
                )}
                {canViewDocuments && (
                    <TabItem
                        label="Tài liệu"
                        icon={FileText}
                        value={DirectoryTab.Documents}
                        count={directoryOverview?.documents_count || 0}
                        activeTab={activeTab}
                        setActiveTab={setActiveTab}
                    />
                )}
            </div>

            {/* Filter and Content layout */}
            <div className="transition-all duration-300 ease-in-out h-full overflow-hidden flex flex-col">
                <DirectoryTable />
            </div>
        </div>
    )
}
