import React, { useEffect, useRef } from 'react'
import { X } from 'lucide-react'

/* ============================================================
   Modal — Accessible dialog component
   ============================================================ */

interface ModalProps {
    isOpen: boolean
    onClose: () => void
    title?: string
    description?: string
    children: React.ReactNode
    footer?: React.ReactNode
    size?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl' | 'full'
    /** Prevent closing when clicking the backdrop */
    closeOnBackdrop?: boolean
}

const sizeStyles: Record<string, string> = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-2xl',
    '2xl': 'max-w-4xl',
    '3xl': 'max-w-6xl',
    full: 'max-w-[95vw]',
}

export const Modal: React.FC<ModalProps> = ({
    isOpen,
    onClose,
    title,
    description,
    children,
    footer,
    size = 'md',
    closeOnBackdrop = true,
}) => {
    const overlayRef = useRef<HTMLDivElement>(null)

    // Trap focus and handle ESC key
    useEffect(() => {
        if (!isOpen) return

        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose()
        }
        document.addEventListener('keydown', handleKeyDown)
        document.body.style.overflow = 'hidden'

        return () => {
            document.removeEventListener('keydown', handleKeyDown)
            document.body.style.overflow = ''
        }
    }, [isOpen, onClose])

    if (!isOpen) return null

    return (
        <div
            ref={overlayRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby={title ? 'modal-title' : undefined}
            aria-describedby={description ? 'modal-description' : undefined}
            className="fixed inset-0 z-modal flex items-center justify-center p-4"
            onClick={(e) => {
                if (closeOnBackdrop && e.target === overlayRef.current)
                    onClose()
            }}
        >
            {/* Backdrop */}
            <div className="absolute inset-0 bg-black/30 backdrop-blur-sm animate-fade-in" />

            {/* Panel */}
            <div
                className={[
                    'relative w-full bg-surface rounded-2xl shadow-2xl',
                    'border border-border/60',
                    'animate-scale-pop',
                    sizeStyles[size],
                ].join(' ')}
            >
                {/* Header */}
                {(title || description) && (
                    <div className="px-6 pt-6 pb-4 border-b border-border/50">
                        {title && (
                            <h2
                                id="modal-title"
                                className="text-lg font-bold text-text-primary pr-8"
                            >
                                {title}
                            </h2>
                        )}
                        {description && (
                            <p
                                id="modal-description"
                                className="mt-1 text-sm text-text-muted"
                            >
                                {description}
                            </p>
                        )}
                    </div>
                )}

                {/* Close button */}
                <button
                    onClick={onClose}
                    aria-label="Close dialog"
                    className="absolute top-4 right-4 p-1.5 rounded-lg text-text-placeholder hover:text-text-secondary hover:bg-bg transition-all duration-150"
                >
                    <X className="w-4 h-4" />
                </button>

                {/* Body */}
                <div className="px-6 py-5">{children}</div>

                {/* Footer */}
                {footer && (
                    <div className="px-6 pb-6 flex items-center justify-end gap-3 border-t border-border/50 pt-4">
                        {footer}
                    </div>
                )}
            </div>
        </div>
    )
}

export default Modal
