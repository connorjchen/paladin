import { Badge } from '../ui/badge'
import { Lock } from 'lucide-react'
import { P3 } from './Text'

interface PrivateBadgeProps {
  className?: string
}

export function PrivateBadge({ className = '' }: PrivateBadgeProps) {
  return (
    <Badge variant="destructive" className={`w-fit text-xs ${className}`}>
      <Lock className="mr-1 h-3 w-3" />
      <P3 className="text-white">Private</P3>
    </Badge>
  )
}
