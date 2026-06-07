import React from 'react'
import { AlertCircle } from 'lucide-react'

/* ============================================================
   Input — Reusable text / password / email input
   Supports: label, helper text, error state, icons, sizes
   ============================================================ */

type InputSize = 'sm' | 'md' | 'lg'

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
    label?: string
    helperText?: string
    errorText?: string
    leftIcon?: React.ReactNode
    rightElement?: React.ReactNode // e.g. password toggle button
    inputSize?: InputSize
    fullWidth?: boolean
    /** Show error styling without a message (e.g. when the parent handles error display) */
    hasError?: boolean
}

const sizeMap: Record<InputSize, string> = {
    sm: 'py-2 text-xs',
    md: 'py-2.5 text-sm',
    lg: 'py-3.5 text-base',
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
    (
        {
            label,
            helperText,
            errorText,
            leftIcon,
            rightElement,
            inputSize = 'md',
            fullWidth = true,
            hasError = false,
            id,
            className = '',
            disabled,
            ...rest
        },
        ref
    ) => {
        const inputId = id ?? `input-${Math.random().toString(36).slice(2, 9)}`
        const isError = hasError || !!errorText
        const sizeInput = sizeMap[inputSize]

        return (
            <div className={fullWidth ? 'w-full' : ''}>
                {/* Label */}
                {label && (
                    <label
                        htmlFor={inputId}
                        className="block text-sm font-semibold text-text-secondary mb-1.5"
                    >
                        {label}
                    </label>
                )}

                {/* Input wrapper */}
                <div className="relative group">
                    {/* Left icon */}
                    {leftIcon && (
                        <div
                            className="absolute inset-y-0 left-3.5 flex items-center pointer-events-none"
                            aria-hidden="true"
                        >
                            <span
                                className={[
                                    'flex items-center justify-center',
                                    'transition-colors duration-200',
                                    isError
                                        ? 'text-error'
                                        : 'text-text-placeholder group-focus-within:text-primary',
                                ].join(' ')}
                            >
                                {leftIcon}
                            </span>
                        </div>
                    )}

                    <input
                        ref={ref}
                        id={inputId}
                        disabled={disabled}
                        className={[
                            'block bg-surface-raised border rounded-xl',
                            'text-text-primary placeholder:text-text-placeholder',
                            'transition-all duration-200',
                            'focus:outline-none focus:ring-2',
                            'disabled:opacity-50 disabled:cursor-not-allowed',
                            sizeInput,
                            leftIcon ? 'pl-10' : 'pl-4',
                            rightElement ? 'pr-11' : 'pr-4',
                            isError
                                ? 'border-error focus:border-error focus:ring-error/20'
                                : 'border-border hover:border-text-placeholder focus:border-primary focus:ring-primary/20',
                            fullWidth ? 'w-full' : '',
                            className,
                        ]
                            .filter(Boolean)
                            .join(' ')}
                        aria-invalid={isError}
                        aria-describedby={
                            errorText
                                ? `${inputId}-error`
                                : helperText
                                  ? `${inputId}-helper`
                                  : undefined
                        }
                        {...rest}
                    />

                    {/* Right element (e.g. eye toggle) */}
                    {rightElement && (
                        <div className="absolute inset-y-0 right-0 flex items-center pr-3.5">
                            {rightElement}
                        </div>
                    )}
                </div>

                {/* Error message */}
                {errorText && (
                    <p
                        id={`${inputId}-error`}
                        role="alert"
                        className="mt-1.5 flex items-center gap-1.5 text-xs text-error animate-fade-in-down"
                    >
                        <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
                        {errorText}
                    </p>
                )}

                {/* Helper text */}
                {helperText && !errorText && (
                    <p
                        id={`${inputId}-helper`}
                        className="mt-1.5 text-xs text-text-placeholder"
                    >
                        {helperText}
                    </p>
                )}
            </div>
        )
    }
)

Input.displayName = 'Input'
export default Input
