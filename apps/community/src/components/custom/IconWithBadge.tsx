import { LucideIcon } from 'lucide-react'

interface IconWithBadgeProps {
  Icon: LucideIcon
  showDot?: boolean
}

export function IconWithBadge({ Icon, showDot }: IconWithBadgeProps) {
  return (
    <div className="relative">
      <Icon />
      {showDot && (
        <div className="absolute -right-1 -top-1 h-2 w-2 rounded-full bg-red-500" />
      )}
    </div>
  )
}
