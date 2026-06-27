import Input from '../ui/Input'
import { Shield } from 'lucide-react'
import SearchableSelect from '../ui/SearchableSelect'

interface RoleInfoFieldsProps {
    editRoleName: string
    setEditRoleName: (val: string) => void
    editDescription: string
    setEditDescription: (val: string) => void
    editAccessLevel: string
    setEditAccessLevel: (val: string) => void
    accessLevelOptions: { value: string; label: string }[]
}

const RoleInfoFields = ({
    editRoleName,
    setEditRoleName,
    editDescription,
    setEditDescription,
    editAccessLevel,
    setEditAccessLevel,
    accessLevelOptions,
}: RoleInfoFieldsProps) => {
    return (
        <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Input
                    label="Role Name"
                    placeholder="Role name"
                    value={editRoleName}
                    onChange={(e) => setEditRoleName(e.target.value)}
                    leftIcon={<Shield className="w-4 h-4" />}
                />

                <SearchableSelect
                    options={accessLevelOptions}
                    value={editAccessLevel}
                    onChange={setEditAccessLevel}
                    placeholder="Select Access Level"
                    label="Access Level"
                />
            </div>

            <Input
                label="Role Description"
                placeholder="Role description"
                value={editDescription}
                onChange={(e) => setEditDescription(e.target.value)}
            />
        </div>
    )
}

export default RoleInfoFields
