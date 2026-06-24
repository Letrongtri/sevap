import { lazy, Suspense, type ComponentType } from 'react'
import LoadingSpinner from '../components/ui/LoadingSpinner'

/**
 * Wraps a dynamic component import with React.lazy and Suspense fallback.
 * Keeps bundle sizes small and provides consistent loading states during page navigation.
 */
export function lazyPage(importFn: () => Promise<{ default: ComponentType }>) {
    const Comp = lazy(importFn)
    return function LazyPageWrapper() {
        return (
            <Suspense fallback={<LoadingSpinner />}>
                <Comp />
            </Suspense>
        )
    }
}
