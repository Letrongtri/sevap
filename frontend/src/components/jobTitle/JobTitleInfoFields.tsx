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
                label="Job Title Name"
                placeholder="Job title name"
                value={editJobTitleName}
                onChange={(e) => setEditJobTitleName(e.target.value)}
                leftIcon={<Briefcase className="w-4 h-4" />}
            />
            <Input
                label="Job Title Code"
                placeholder="Job title code"
                value={editCode}
                onChange={(e) => setEditCode(e.target.value)}
                leftIcon={<Hash className="w-4 h-4" />}
                disabled={mode === 'edit'}
            />

            <Input
                label="Job Title Description"
                placeholder="Job title description"
                value={editDescription}
                onChange={(e) => setEditDescription(e.target.value)}
            />
        </div>
    )
}

export default JobTitleInfoFields
