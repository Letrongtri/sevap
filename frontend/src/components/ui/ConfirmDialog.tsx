import { Modal } from './Modal'
import { Button } from './Button'
import { AlertTriangle } from 'lucide-react'

/* ============================================================
   ConfirmDialog — Generic confirmation modal.
   Wraps the existing Modal with a standardised layout:
   icon + title + description + Cancel / Confirm buttons.

   Usage:
   <ConfirmDialog
     isOpen={open}
     onClose={() => setOpen(false)}
     onConfirm={handleConfirm}
     title="Change password?"
     description="This will update your login credentials."
     confirmLabel="Yes, change it"
     variant="danger"
     isLoading={mutation.isPending}
   />
   ============================================================ */

export interface ConfirmDialogProps {
    isOpen: boolean
    onClose: () => void
    onConfirm: () => void
    title: string
    description?: string
    confirmLabel?: string
    cancelLabel?: string
    /** 'danger' renders the confirm button in red; 'primary' is the default blue. */
    variant?: 'primary' | 'danger'
    isLoading?: boolean
}

export function ConfirmDialog({
    isOpen,
    onClose,
    onConfirm,
    title,
    description,
    confirmLabel = 'Xác nhận',
    cancelLabel = 'Hủy',
    variant = 'primary',
    isLoading = false,
}: ConfirmDialogProps) {
    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            size="sm"
            closeOnBackdrop={!isLoading}
            footer={
                <>
                    <Button
                        id="confirm-dialog-cancel"
                        variant="secondary"
                        size="sm"
                        onClick={onClose}
                        disabled={isLoading}
                    >
                        {cancelLabel}
                    </Button>
                    <Button
                        id="confirm-dialog-confirm"
                        variant={variant === 'danger' ? 'danger' : 'primary'}
                        size="sm"
                        onClick={onConfirm}
                        isLoading={isLoading}
                        loadingText="Đang xử lý…"
                    >
                        {confirmLabel}
                    </Button>
                </>
            }
        >
            <div className="flex flex-col items-center text-center gap-3 py-2">
                {/* Icon */}
                <div
                    className={[
                        'w-12 h-12 rounded-full flex items-center justify-center',
                        variant === 'danger'
                            ? 'bg-error-bg text-error'
                            : 'bg-primary-light text-primary',
                    ].join(' ')}
                >
                    <AlertTriangle className="w-6 h-6" />
                </div>

                {/* Text */}
                <div>
                    <p className="text-base font-bold text-text-primary">{title}</p>
                    {description && (
                        <p className="mt-1.5 text-sm text-text-muted leading-relaxed">
                            {description}
                        </p>
                    )}
                </div>
            </div>
        </Modal>
    )
}

export default ConfirmDialog
