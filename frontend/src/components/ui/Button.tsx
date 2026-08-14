import React from 'react'
import { Loader2 } from 'lucide-react'

/* ============================================================
   Button — Primary reusable button component
   Variants: primary | secondary | ghost | danger | outline
   Sizes:    sm | md | lg
   ============================================================ */

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'outline'
type ButtonSize = 'sm' | 'md' | 'lg'

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: ButtonVariant
    size?: ButtonSize
    isLoading?: boolean
    loadingText?: string
    leftIcon?: React.ReactNode
    rightIcon?: React.ReactNode
    fullWidth?: boolean
}

const variantStyles: Record<ButtonVariant, string> = {
    primary: [
        'bg-primary text-white',
        'hover:bg-primary-hover active:bg-primary-active',
        'shadow-lg shadow-primary-glow hover:shadow-xl',
        'disabled:bg-primary/60 disabled:shadow-none',
    ].join(' '),

    secondary: [
        'bg-surface text-text-secondary border border-border',
        'hover:bg-surface-raised hover:border-text-placeholder',
        'shadow-sm',
        'disabled:opacity-50',
    ].join(' '),

    ghost: [
        'bg-transparent text-text-secondary',
        'hover:bg-bg',
        'disabled:opacity-50',
    ].join(' '),

    danger: [
        'bg-error text-white',
        'hover:bg-error-text active:bg-error-text/80',
        'shadow-lg shadow-error/20',
        'disabled:opacity-60 disabled:shadow-none',
    ].join(' '),

    outline: [
        'bg-transparent text-primary border border-primary',
        'hover:bg-primary/5',
        'disabled:opacity-50',
    ].join(' '),
}

const sizeStyles: Record<ButtonSize, string> = {
    sm: 'px-3 py-1.5 text-xs gap-1.5 rounded-lg',
    md: 'px-4 py-2.5 text-sm gap-2   rounded-xl',
    lg: 'px-6 py-3.5 text-sm gap-2.5 rounded-xl',
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
    (
        {
            variant = 'primary',
            size = 'md',
            isLoading = false,
            loadingText,
            leftIcon,
            rightIcon,
            fullWidth = false,
            disabled,
            children,
            className = '',
            ...rest
        },
        ref
    ) => {
        const isDisabled = disabled || isLoading

        return (
            <button
                ref={ref}
                disabled={isDisabled}
                className={[
                    'inline-flex items-center justify-center font-semibold whitespace-nowrap',
                    'transition-all duration-200',
                    'focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:ring-offset-2',
                    'disabled:cursor-not-allowed',
                    variantStyles[variant],
                    sizeStyles[size],
                    fullWidth ? 'w-full' : '',
                    className,
                ]
                    .filter(Boolean)
                    .join(' ')}
                {...rest}
            >
                {isLoading ? (
                    <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>{loadingText ?? children}</span>
                    </>
                ) : (
                    <>
                        {leftIcon && (
                            <span className="flex-shrink-0">{leftIcon}</span>
                        )}
                        {children && <span>{children}</span>}
                        {rightIcon && (
                            <span className="flex-shrink-0">{rightIcon}</span>
                        )}
                    </>
                )}
            </button>
        )
    }
)

Button.displayName = 'Button'
export default Button
