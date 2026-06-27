import { useMutation, useQueryClient } from '@tanstack/react-query'
import { revokeUserSession } from '../api/userSession'
import { userKeys } from './useUsers'
import type { ID } from '../types/common'
import type { RevokeUserSessionResponse } from '../types/userSession'
import { toast } from 'sonner'
import { useAuth } from './useAuth'

export function useRevokeUserSession() {
    const queryClient = useQueryClient()
    const { logout } = useAuth()
    return useMutation<RevokeUserSessionResponse, Error, ID>({
        mutationFn: revokeUserSession,
        onSuccess: (data) => {
            queryClient.invalidateQueries({ queryKey: userKeys.mySessions() })
            toast.success('Session revoked successfully')
            if (data.is_current_session) {
                logout()
            }
            return data
        },
        onError: (error) => {
            toast.error('Failed to revoke session')
            return error
        },
    })
}
