import { Badge } from '../ui/badge'
import { ShieldCheck } from 'lucide-react'

export function AdminBadge() {
  return (
    <Badge className="gap-1">
      <ShieldCheck className="h-3 w-3" />
      Admin
    </Badge>
  )
}
