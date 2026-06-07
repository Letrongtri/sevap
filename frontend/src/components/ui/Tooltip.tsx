import React, { useState, useRef, useEffect } from 'react'

/* ============================================================
   Tooltip — Lightweight hover tooltip
   ============================================================ */

type TooltipPosition = 'top' | 'bottom' | 'left' | 'right'

interface TooltipProps {
    content: React.ReactNode
    children: React.ReactElement
    position?: TooltipPosition
    delay?: number
    className?: string
}

const positionStyles: Record<TooltipPosition, string> = {
    top:    'bottom-full left-1/2 -translate-x-1/2 mb-2',
    bottom: 'top-full  left-1/2 -translate-x-1/2 mt-2',
    left:   'right-full top-1/2 -translate-y-1/2 mr-2',
    right:  'left-full  top-1/2 -translate-y-1/2 ml-2',
}

const arrowStyles: Record<TooltipPosition, string> = {
    top:    'top-full  left-1/2 -translate-x-1/2 border-t-text-primary border-l-transparent border-r-transparent border-b-transparent',
    bottom: 'bottom-full left-1/2 -translate-x-1/2 border-b-text-primary border-l-transparent border-r-transparent border-t-transparent',
    left:   'left-full  top-1/2 -translate-y-1/2 border-l-text-primary border-t-transparent border-b-transparent border-r-transparent',
    right:  'right-full top-1/2 -translate-y-1/2 border-r-text-primary border-t-transparent border-b-transparent border-l-transparent',
}

export const Tooltip: React.FC<TooltipProps> = ({
    content,
    children,
    position = 'top',
    delay = 300,
    className = '',
}) => {
    const [visible, setVisible] = useState(false)
    const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

    const show = () => {
        timerRef.current = setTimeout(() => setVisible(true), delay)
    }
    const hide = () => {
        if (timerRef.current) clearTimeout(timerRef.current)
        setVisible(false)
    }

    useEffect(
        () => () => {
            if (timerRef.current) clearTimeout(timerRef.current)
        },
        []
    )

    return (
        <div
            className={`relative inline-flex ${className}`}
            onMouseEnter={show}
            onMouseLeave={hide}
            onFocus={show}
            onBlur={hide}
        >
            {children}

            {visible && (
                <div
                    role="tooltip"
                    className={[
                        'absolute z-tooltip whitespace-nowrap',
                        'bg-text-primary text-surface text-xs font-medium',
                        'px-2.5 py-1.5 rounded-lg shadow-lg',
                        'pointer-events-none animate-fade-in',
                        positionStyles[position],
                    ].join(' ')}
                >
                    {content}
                    {/* Arrow */}
                    <span
                        className={[
                            'absolute w-0 h-0 border-4',
                            arrowStyles[position],
                        ].join(' ')}
                    />
                </div>
            )}
        </div>
    )
}

export default Tooltip
