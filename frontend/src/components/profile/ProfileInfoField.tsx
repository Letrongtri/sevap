import type { ReactNode } from 'react'
import { AlertCircle } from 'lucide-react'

/* ============================================================
   ProfileInfoField — Always-visible input field for profile page.
   Appears as a styled read-only box in view mode,
   and becomes a focusable editable input in edit mode.
   Reuses the project's existing Input visual language.
   ============================================================ */

interface ProfileInfoFieldProps {
    id: string
    label: string
    type?: string
    value: string
    placeholder?: string
    required?: boolean
    errorText?: string
    editMode: boolean
    leftIcon: ReactNode
    onChange: (value: string) => void
}

export function ProfileInfoField({
    id,
    label,
    type = 'text',
    value,
    placeholder,
    required,
    errorText,
    editMode,
    leftIcon,
    onChange,
}: ProfileInfoFieldProps) {
    return (
        <div>
            <label
                htmlFor={id}
                className="block text-xs font-semibold text-text-secondary mb-1.5"
            >
                {label}
                {required && editMode && (
                    <span className="text-error ml-1">*</span>
                )}
            </label>

            <div className="relative group">
                {/* Left icon */}
                <span
                    className={[
                        'absolute inset-y-0 left-3.5 flex items-center pointer-events-none transition-colors duration-200',
                        editMode
                            ? errorText
                                ? 'text-error'
                                : 'text-text-placeholder group-focus-within:text-primary'
                            : 'text-text-placeholder',
                    ].join(' ')}
                >
                    {leftIcon}
                </span>

                <input
                    id={id}
                    type={type}
                    disabled={!editMode}
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                    placeholder={placeholder}
                    aria-invalid={!!errorText}
                    aria-describedby={errorText ? `${id}-error` : undefined}
                    className={[
                        'w-full pl-10 pr-4 py-2.5 text-sm rounded-xl border',
                        'transition-all duration-200 focus:outline-none focus:ring-2',
                        editMode
                            ? errorText
                                ? 'bg-surface-raised border-error focus:border-error focus:ring-error/20 text-text-primary'
                                : 'bg-surface-raised border-border hover:border-text-placeholder focus:border-primary focus:ring-primary/20 text-text-primary'
                            : 'bg-bg border-transparent text-text-primary cursor-default select-none',
                    ].join(' ')}
                />
            </div>

            {errorText && (
                <p
                    id={`${id}-error`}
                    role="alert"
                    className="mt-1.5 flex items-center gap-1.5 text-xs text-error"
                >
                    <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
                    {errorText}
                </p>
            )}
        </div>
    )
}
