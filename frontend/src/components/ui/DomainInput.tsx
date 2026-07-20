import React from 'react'
import { AlertCircle } from 'lucide-react'

interface DomainInputProps extends Omit<
    React.InputHTMLAttributes<HTMLInputElement>,
    'value' | 'onChange'
> {
    value: string
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => void
    label?: string
    errorText?: string
    suffix?: string
}

export const DomainInput = React.forwardRef<HTMLInputElement, DomainInputProps>(
    (
        {
            value,
            onChange,
            label,
            errorText,
            suffix = '.hrnexus.com',
            id,
            disabled,
            required,
            ...rest
        },
        ref
    ) => {
        const inputId = id ?? 'tenant_domain'
        return (
            <div className="space-y-1.5 w-full">
                {label && (
                    <label
                        htmlFor={inputId}
                        className="block text-sm font-semibold text-text-secondary"
                    >
                        {label}
                        {required && <span className="text-error ml-1">*</span>}
                    </label>
                )}
                <div
                    className={[
                        'flex rounded-xl overflow-hidden border bg-surface-raised transition-all duration-200 focus-within:ring-2',
                        errorText
                            ? 'border-error focus-within:ring-error/20 focus-within:border-error'
                            : 'border-border focus-within:ring-primary/20 focus-within:border-primary hover:border-text-placeholder',
                    ].join(' ')}
                >
                    <input
                        ref={ref}
                        id={inputId}
                        type="text"
                        disabled={disabled}
                        value={value}
                        onChange={onChange}
                        className="flex-1 min-w-0 bg-transparent px-4 py-2.5 text-sm text-text-primary placeholder:text-text-placeholder outline-none disabled:opacity-50 disabled:cursor-not-allowed"
                        {...rest}
                    />
                    <span className="bg-primary/5 border-l border-border px-3 py-2.5 text-sm text-text-secondary font-medium select-none flex items-center justify-center shrink-0 whitespace-nowrap">
                        {suffix}
                    </span>
                </div>
                {errorText && (
                    <p
                        role="alert"
                        className="mt-1.5 flex items-center gap-1.5 text-xs text-error animate-fade-in-down"
                    >
                        <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
                        {errorText}
                    </p>
                )}
            </div>
        )
    }
)

DomainInput.displayName = 'DomainInput'
export default DomainInput
