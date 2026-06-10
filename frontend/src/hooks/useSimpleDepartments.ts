import { useQuery } from '@tanstack/react-query'
import type { DepartmentSimple } from '../types/department'
import { fetchAllSimpleDepartments } from '../api/department'

/** Hook lấy danh sách departments */
export function useSimpleDepartments() {
    return useQuery<DepartmentSimple[]>({
        queryKey: ['simple-departments'],
        queryFn: fetchAllSimpleDepartments,
    })
}
