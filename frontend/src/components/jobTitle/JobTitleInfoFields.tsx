import Input from '../ui/Input'
import { Briefcase, Hash } from 'lucide-react'

interface JobTitleInfoFieldsProps {
    editJobTitleName: string
    setEditJobTitleName: (val: string) => void
    editCode: string
    setEditCode: (val: string) => void
    editDescription: string
    setEditDescription: (val: string) => void
    mode?: 'create' | 'edit'
}

const JobTitleInfoFields = ({
    editJobTitleName,
    setEditJobTitleName,
    editCode,
    setEditCode,
    editDescription,
    setEditDescription,
    mode = 'create',
}: JobTitleInfoFieldsProps) => {
    return (
        <div className="space-y-4">
            <Input
                label="Tên chức danh"
                placeholder="Tên chức danh"
                value={editJobTitleName}
                onChange={(e) => setEditJobTitleName(e.target.value)}
                leftIcon={<Briefcase className="w-4 h-4" />}
            />
            <Input
                label="Mã chức danh"
                placeholder="Mã chức danh"
                value={editCode}
                onChange={(e) => setEditCode(e.target.value)}
                leftIcon={<Hash className="w-4 h-4" />}
                disabled={mode === 'edit'}
            />

            <Input
                label="Mô tả chức danh"
                placeholder="Mô tả chức danh"
                value={editDescription}
                onChange={(e) => setEditDescription(e.target.value)}
            />
        </div>
    )
}

export default JobTitleInfoFields
