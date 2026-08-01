const SystemBranding = ({ collapsed }: { collapsed: boolean }) => {
    return (
        <div
            className={[
                'flex items-center gap-3 px-4 border-b border-border/60 flex-shrink-0',
                'h-[var(--topbar-height)]',
                collapsed ? 'justify-center' : '',
            ].join(' ')}
        >
            <img
                src="/app-logo.svg"
                alt="Logo"
                className="w-8 h-8 rounded-xl flex-shrink-0"
            />
            {!collapsed && (
                <div className="overflow-hidden">
                    <p className="text-sm font-bold text-text-primary leading-none whitespace-nowrap">
                        SEVAP
                    </p>
                </div>
            )}
        </div>
    )
}

export default SystemBranding
