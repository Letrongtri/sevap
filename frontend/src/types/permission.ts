import type { ID } from './common'

export interface Permission {
    id: ID
    resource: string
    action: string
    description: string
}
