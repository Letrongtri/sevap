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
    disabled?: boolean
}

const RoleInfoFields = ({
    editRoleName,
    setEditRoleName,
    editDescription,
    setEditDescription,
    editAccessLevel,
    setEditAccessLevel,
    accessLevelOptions,
    disabled = false,
}: RoleInfoFieldsProps) => {
    return (
        <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Input
                    label="Tên vai trò"
                    placeholder="Tên vai trò"
                    value={editRoleName}
                    onChange={(e) => setEditRoleName(e.target.value)}
                    leftIcon={<Shield className="w-4 h-4" />}
                    disabled={disabled}
                />

                <SearchableSelect
                    options={accessLevelOptions}
                    value={editAccessLevel}
                    onChange={setEditAccessLevel}
                    placeholder="Chọn cấp độ truy cập"
                    label="Cấp độ truy cập"
                    disabled={disabled}
                />
            </div>

            <Input
                label="Mô tả vai trò"
                placeholder="Mô tả vai trò"
                value={editDescription}
                onChange={(e) => setEditDescription(e.target.value)}
                disabled={disabled}
            />
        </div>
    )
}

export default RoleInfoFields
