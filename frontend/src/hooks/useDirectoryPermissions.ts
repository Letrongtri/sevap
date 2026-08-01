import { useMemo } from 'react'
import { useAuthStore } from '../store/authStore'
import { DirectoryTab } from '../types/directory'

/**
 * Hook trả về các quyền truy cập tab trên Directory page.
 * Permissions được lưu dưới dạng "resource:action", ví dụ "users:read".
 */
export function useDirectoryPermissions() {
    const permissions = useAuthStore((s) => s.user?.permissions ?? [])

    const canViewUsers = useMemo(
        () => permissions.includes('users:read'),
        [permissions]
    )

    const canViewDepartments = useMemo(
        () => permissions.includes('departments:read'),
        [permissions]
    )

    const canViewJobTitles = useMemo(
        () => permissions.includes('job_titles:read'),
        [permissions]
    )

    const canViewDocuments = useMemo(
        () => permissions.includes('documents:read'),
        [permissions]
    )

    const canDownloadDocuments = useMemo(
        () => permissions.includes('documents:download'),
        [permissions]
    )

    /** Danh sách các tab mà user có quyền xem, theo thứ tự ưu tiên */
    const allowedTabs = useMemo(() => {
        const tabs: DirectoryTab[] = []
        if (canViewUsers) tabs.push(DirectoryTab.Users)
        if (canViewDepartments) tabs.push(DirectoryTab.Departments)
        if (canViewJobTitles) tabs.push(DirectoryTab.JobTitles)
        if (canViewDocuments) tabs.push(DirectoryTab.Documents)
        return tabs
    }, [canViewUsers, canViewDepartments, canViewJobTitles, canViewDocuments])

    return {
        canViewUsers,
        canViewDepartments,
        canViewJobTitles,
        canViewDocuments,
        canDownloadDocuments,
        allowedTabs,
        hasAnyAccess: allowedTabs.length > 0,
    }
}
