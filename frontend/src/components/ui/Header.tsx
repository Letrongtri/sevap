import { Plus } from 'lucide-react'
import Button from './Button'

const Header = ({
    title,
    btnTitle,
    isAdding,
    onAdd,
}: {
    title: string
    btnTitle?: string
    isAdding?: boolean
    onAdd?: () => void
}) => {
    return (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
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
