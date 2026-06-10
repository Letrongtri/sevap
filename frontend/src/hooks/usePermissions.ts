import { useQuery } from '@tanstack/react-query'
import { fetchPermissions } from '../api/permission'
import type { Permission } from '../types/permission'

/** Hook lấy danh sách permissions */
export function usePermissions() {
    return useQuery<Permission[]>({
        queryKey: ['permissions'],
        queryFn: fetchPermissions,
    })
}
