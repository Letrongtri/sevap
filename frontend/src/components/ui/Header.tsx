import { Plus } from 'lucide-react'
import Button from './Button'

const Header = ({
    title,
    icon,
    btnTitle,
    isAdding,
    onAdd,
}: {
    title: string
    icon?: React.ReactNode
    btnTitle?: string
    isAdding?: boolean
    onAdd?: () => void
}) => {
    return (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-2">
                {icon && (
                    <div className="p-2 rounded-xl bg-primary/10 text-primary">
                        {icon}
                    </div>
                )}
                <h1 className="text-2xl font-bold text-[#1A1D23]">{title}</h1>
            </div>
            {onAdd && !isAdding && (
                <Button
                    variant="primary"
                    leftIcon={<Plus className="w-4 h-4" />}
                    onClick={onAdd}
                >
                    {btnTitle || 'Add'}
                </Button>
            )}
        </div>
    )
}

export default Header
