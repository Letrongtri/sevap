import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { usePromptTemplateStore } from '../store/promptTemplateStore'
import type {
    PromptTemplate,
    PromptTemplatePaginatedResponse,
} from '../types/promptTemplate'
import {
    createPromptTemplate,
    deletePromptTemplate,
    fetchPromptTemplates,
    togglePromptTemplateStatus,
    updatePromptTemplate,
} from '../api/promptTemplate'
import type { ID } from '../types/common'

export const PROMPT_TEMPLATES_QUERY_KEY = ['prompt-templates'] as const

export function usePromptTemplates() {
    const querySearch = usePromptTemplateStore((s) => s.query)
    const type = usePromptTemplateStore((s) => s.type)
    const is_active = usePromptTemplateStore((s) => s.is_active)
    const page = usePromptTemplateStore((s) => s.page)
    const limit = usePromptTemplateStore((s) => s.limit)

    const queryKey = [
        ...PROMPT_TEMPLATES_QUERY_KEY,
        {
            querySearch,
            type,
            is_active,
            page,
            limit,
        },
    ] as const

    const query = useQuery<PromptTemplatePaginatedResponse>({
        queryKey,
        queryFn: () =>
            fetchPromptTemplates(querySearch, type, is_active, page, limit),
    })

    return {
        ...query,
        prompt_templates: query.data?.prompt_templates ?? [],
        pagination: query.data?.pagination,
    }
}

/** Hook tạo prompt template mới */
export function useCreatePromptTemplate() {
    const queryClient = useQueryClient()
    return useMutation<
        PromptTemplate,
        Error,
        Parameters<typeof createPromptTemplate>[0]
    >({
        mutationFn: createPromptTemplate,
        onSuccess: () => {
            queryClient.invalidateQueries({
                queryKey: PROMPT_TEMPLATES_QUERY_KEY,
            })
        },
    })
}

/** Hook cập nhật thông tin prompt template */
export function useUpdatePromptTemplate() {
    const queryClient = useQueryClient()
    return useMutation<
        PromptTemplate,
        Error,
        { id: ID; payload: Parameters<typeof updatePromptTemplate>[1] }
    >({
        mutationFn: ({ id, payload }) => updatePromptTemplate(id, payload),
        onSuccess: () => {
            queryClient.invalidateQueries({
                queryKey: PROMPT_TEMPLATES_QUERY_KEY,
            })
        },
    })
}

/** Hook toggle trạng thái prompt template */
export function useTogglePromptTemplateStatus() {
    const queryClient = useQueryClient()
    return useMutation<PromptTemplate, Error, ID>({
        mutationFn: togglePromptTemplateStatus,
        onSuccess: () => {
            queryClient.invalidateQueries({
                queryKey: PROMPT_TEMPLATES_QUERY_KEY,
            })
        },
    })
}

/** Hook xoá prompt template */
export function useDeletePromptTemplate() {
    const queryClient = useQueryClient()
    return useMutation<PromptTemplate, Error, ID>({
        mutationFn: deletePromptTemplate,
        onSuccess: () => {
            queryClient.invalidateQueries({
                queryKey: PROMPT_TEMPLATES_QUERY_KEY,
            })
        },
    })
}
