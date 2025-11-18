import { SingleAvatar } from './SingleAvatar'
import { HFlex } from './HFlex'
import { P2 } from './Text'

interface AvatarData {
  src: string
  fallback: string
}

interface AvatarStackProps {
  avatars: AvatarData[]
}

export function AvatarStack({ avatars }: AvatarStackProps) {
  const MAX_AVATARS = 3
  const displayAvatars = avatars.slice(0, MAX_AVATARS)
  const remainingCount = avatars.length - MAX_AVATARS

  return (
    <HFlex className="items-center">
      <HFlex className="-space-x-4">
        {displayAvatars.map((avatar, i) => (
          <SingleAvatar
            key={i}
            {...avatar}
            className="border-background h-6 w-6 border-2"
          />
        ))}
      </HFlex>
      {remainingCount > 0 && <P2 muted>+{remainingCount}</P2>}
    </HFlex>
  )
}
