import { stringToColor } from '../../../utils/utils'

type AvatarProps = {
    id: string
    fullName: string
    size?: number
}

export const Avatar = ({ id, fullName, size = 28 }: AvatarProps) => {
    const nameSplit = fullName.split(' ')
    const userInitial =
        nameSplit.length > 1
            ? nameSplit[0].charAt(0).toUpperCase() +
              nameSplit[nameSplit.length - 1].charAt(0).toUpperCase()
            : fullName.charAt(0).toUpperCase()

    const color = stringToColor(id)
    return (
        <div
            style={{
                width: size,
                height: size,
                fontSize: size * 0.4,
                borderRadius: size / 2,
                backgroundColor: color.backgroundColor,
                color: color.color,
            }}
            className="flex items-center justify-center font-bold select-none flex-shrink-0"
        >
            {userInitial}
        </div>
    )
}
