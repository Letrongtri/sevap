import axiosClient from './axios'
import type {
    User,
    UserPaginatedResponse,
    UserSimplePaginatedResponse,
} from '../types/user'
import type { ID } from '../types/common'

/** Lấy danh sách tất cả người dùng */
export const fetchUsers = async (
    query?: string | null,
    departmentId?: ID | null,
    jobTitleId?: ID | null,
    roleId?: ID | null,
    status?: string | null,
    page?: number | null,
    limit: number = 10
): Promise<UserPaginatedResponse> => {
    const res = await axiosClient.get('/users', {
        params: {
            query,
            department_id: departmentId,
            job_title_id: jobTitleId,
            role_id: roleId,
            status,
            page,
            limit,
        },
    })
    return res.data
}

/** Lấy thông tin một người dùng theo ID */
export const fetchUserById = async (id: ID): Promise<User> => {
    const res = await axiosClient.get(`/users/${id}`)
    return res.data
}

/** Tạo người dùng mới */
export const createUser = async (payload: {
    employee_code: string
    full_name: string
    password: string
    email?: string | null
    job_title_id?: ID
    department_id?: ID
    role_ids?: ID[]
}): Promise<User> => {
    const res = await axiosClient.post('/users', payload)
    return res.data
}

/** Cập nhật thông tin người dùng */
export const updateUser = async (
    id: ID,
    payload: {
        full_name?: string | null
        email?: string | null
        job_title_id?: ID
        department_id?: ID
        role_ids?: ID[]
    }
): Promise<User> => {
    const res = await axiosClient.put(`/users/${id}`, payload)
    return res.data
}

/** Xoá người dùng */
export const deleteUser = async (id: ID): Promise<User> => {
    const res = await axiosClient.delete(`/users/${id}`)
    return res.data
}

/** Kích hoạt tài khoản người dùng */
export const activateUser = async (id: ID): Promise<User> => {
    const res = await axiosClient.patch(`/users/${id}/activate`)
    return res.data
}

/** Vô hiệu hoá tài khoản người dùng */
export const deactivateUser = async (id: ID): Promise<User> => {
    const res = await axiosClient.patch(`/users/${id}/deactivate`)
    return res.data
}

/** Đặt lại mật khẩu người dùng về mặc định */
export const resetUserPassword = async (id: ID): Promise<User> => {
    const res = await axiosClient.patch(`/users/${id}/reset-password`)
    return res.data
}

/** Lấy danh sách options rút gọn của người dùng hoạt động phục vụ tìm kiếm/chọn */
export const fetchUserOptions = async (
    query?: string | null,
    page?: number | null,
    limit: number = 10,
    departmentId?: string | null,
    jobTitleId?: string | null,
    getDepartment: boolean = false,
    getJobTitle: boolean = false
): Promise<UserSimplePaginatedResponse> => {
    const res = await axiosClient.get('/users/options', {
        params: {
            query,
            page,
            limit,
            department_id: departmentId,
            job_title_id: jobTitleId,
            get_department: getDepartment,
            get_job_title: getJobTitle,
        },
    })
    return res.data
}
