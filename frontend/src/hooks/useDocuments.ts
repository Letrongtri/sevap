import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useDocumentStore } from '../store/documentStore'
import type { Document, DocumentPaginatedResponse } from '../types/document'
import {
    deleteDocument,
    fetchDocuments,
    fetchDocumentById,
    updateDocument,
    uploadDocument,
    downloadDocumentFile,
    fetchDocumentFileBlob,
} from '../api/document'
import type { ID } from '../types/common'

export const DOCUMENTS_QUERY_KEY = ['documents'] as const

/**
 * useDocuments — Fetch và cache danh sách documents từ server.
 *
 * - Server state được quản lý bởi TanStack Query (cache, refetch, loading).
 * - Tự động refetch khi các state tìm kiếm/phân trang trong Zustand thay đổi.
 */
export function useDocuments() {
    const querySearch = useDocumentStore((s) => s.query)
    const departmentId = useDocumentStore((s) => s.departmentId)
    const jobTitleId = useDocumentStore((s) => s.jobTitleId)
    const accessLevel = useDocumentStore((s) => s.accessLevel)
    const effectiveDate = useDocumentStore((s) => s.effectiveDate)
    const roleAccess = useDocumentStore((s) => s.roleAccess)
    const targetUserId = useDocumentStore((s) => s.targetUserId)
    const page = useDocumentStore((s) => s.page)
    const limit = useDocumentStore((s) => s.limit)

    const queryKey = [
        ...DOCUMENTS_QUERY_KEY,
        {
            querySearch,
            departmentId,
            jobTitleId,
            accessLevel,
            effectiveDate,
            roleAccess,
            targetUserId,
            page,
            limit,
        },
    ] as const

    const query = useQuery<DocumentPaginatedResponse>({
        queryKey,
        queryFn: () =>
            fetchDocuments({
                query: querySearch,
                department_id: departmentId,
                job_title_id: jobTitleId,
                access_level: accessLevel,
                effective_date: effectiveDate,
                role_id: roleAccess,
                user_id: targetUserId,
                page,
                limit,
            }),
    })

    return {
        ...query,
        documents: query.data?.documents ?? [],
        pagination: query.data?.pagination,
    }
}

/** Hook lấy thông tin tài liệu chi tiết theo ID */
export function useDocument(id: ID | null) {
    return useQuery<Document, Error>({
        queryKey: [...DOCUMENTS_QUERY_KEY, id],
        queryFn: () => fetchDocumentById(id!),
        enabled: !!id,
        refetchInterval: (query) => {
            const doc = query.state.data as Document | undefined
            return doc &&
                (doc.status === 'processing' || doc.status === 'pending')
                ? 3000
                : false
        },
    })
}

/** Hook tạo người dùng mới */
export function useUploadDocument() {
    const queryClient = useQueryClient()
    return useMutation<Document, Error, Parameters<typeof uploadDocument>[0]>({
        mutationFn: uploadDocument,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: DOCUMENTS_QUERY_KEY })
        },
    })
}

/** Hook cập nhật thông tin tài liệu */
export function useUpdateDocument() {
    const queryClient = useQueryClient()
    return useMutation<
        Document,
        Error,
        { id: ID; payload: Parameters<typeof updateDocument>[1] }
    >({
        mutationFn: ({ id, payload }) => updateDocument(id, payload),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: DOCUMENTS_QUERY_KEY })
        },
    })
}

/** Hook xoá document */
export function useDeleteDocument() {
    const queryClient = useQueryClient()
    return useMutation<Document, Error, ID>({
        mutationFn: deleteDocument,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: DOCUMENTS_QUERY_KEY })
        },
    })
}

/** Hook tải xuống file document */
export function useDownloadDocument() {
    return useMutation<void, Error, { id: ID; fileName: string }>({
        mutationFn: ({ id, fileName }) => downloadDocumentFile(id, fileName),
    })
}

/** Hook lấy file Blob của tài liệu để preview */
export function useDocumentFileBlob(id: ID | null) {
    return useQuery<Blob, Error>({
        queryKey: [...DOCUMENTS_QUERY_KEY, id, 'file'],
        queryFn: () => fetchDocumentFileBlob(id!),
        enabled: !!id,
        staleTime: 5 * 60 * 1000,
    })
}
