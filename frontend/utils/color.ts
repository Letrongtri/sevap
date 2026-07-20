import { ACTION_STYLES } from '../src/types/common'

export function getActionColor(action: string): string {
    const key = Object.keys(ACTION_STYLES).find((k) =>
        action.toUpperCase().includes(k)
    )
    return key ? ACTION_STYLES[key] : 'text-text-secondary'
}
