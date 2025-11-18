import { Badge } from '../ui/badge'
import { P2, P3 } from './Text'

interface ColoredBadgeProps {
  color: string
  name: string
  className?: string
}

export function ColoredBadge({
  color,
  name,
  className = '',
}: ColoredBadgeProps) {
  return (
    <Badge
      className={className}
      style={{
        background: `linear-gradient(to bottom, ${color}cc, ${color}, ${color}b3)`,
      }}
    >
      <P3 className="text-white">{name}</P3>
    </Badge>
  )
}
