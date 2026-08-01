import Input from '../ui/Input'
import { Building2, Hash } from 'lucide-react'

interface DepartmentInfoFieldsProps {
    editDepartmentName: string
    setEditDepartmentName: (val: string) => void
    editCode: string
    setEditCode: (val: string) => void
    editDescription: string
    setEditDescription: (val: string) => void
    mode?: 'create' | 'edit'
}

const DepartmentInfoFields = ({
    editDepartmentName,
    setEditDepartmentName,
    editCode,
    setEditCode,
    editDescription,
    setEditDescription,
    mode = 'create',
}: DepartmentInfoFieldsProps) => {
    return (
        <div className="space-y-4">
            <Input
                label="Tên phòng ban"
                placeholder="Tên phòng ban"
                value={editDepartmentName}
                onChange={(e) => setEditDepartmentName(e.target.value)}
                leftIcon={<Building2 className="w-4 h-4" />}
            />
            <Input
                label="Mã phòng ban"
                placeholder="Mã phòng ban"
                value={editCode}
                onChange={(e) => setEditCode(e.target.value)}
                leftIcon={<Hash className="w-4 h-4" />}
                disabled={mode === 'edit'}
            />

            <Input
                label="Mô tả phòng ban"
                placeholder="Mô tả phòng ban"
                value={editDescription}
                onChange={(e) => setEditDescription(e.target.value)}
            />
        </div>
    )
}

export default DepartmentInfoFields
