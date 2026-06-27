import axiosClient from './axios'
import type { ID } from '../types/common'
import type { RevokeUserSessionResponse } from '../types/userSession'

export const revokeUserSession = async (
    id: ID
): Promise<RevokeUserSessionResponse> => {
    const res = await axiosClient.delete(`/sessions/${id}/revoke`)
    return res.data
}
