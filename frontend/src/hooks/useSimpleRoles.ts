import { useQuery } from '@tanstack/react-query'
import type { RoleSimple } from '../types/role'
import { fetchAllSimpleRoles } from '../api/role'

/** Hook lấy danh sách roles */
export function useSimpleRoles() {
    return useQuery<RoleSimple[]>({
        queryKey: ['simple-roles'],
        queryFn: fetchAllSimpleRoles,
    })
}
