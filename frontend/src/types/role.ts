import type { ID, Timestamp } from './common'

export interface RoleSimple {
    id: ID
    name: string
}

export interface RoleSimple {
    id: ID
    name: string
    description: string
    access_level: string
    is_system: boolean
    created_at: Timestamp
    updated_at: Timestamp
}
