import { Badge } from '../ui/badge'
import { FeedbackStatus, QuestionStatus, UserRole } from '@prisma/client'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '../ui/dropdown-menu'
import { isAdmin } from '@paladin/shared'
import { cn } from '@/lib/utils'
import { P3 } from './Text'

interface StatusBadgeProps {
  status: FeedbackStatus | QuestionStatus
  userRole?: UserRole
  onStatusChange?: (newStatus: FeedbackStatus | QuestionStatus) => void
  isQuestion?: boolean
}

type StatusConfig = {
  labels: Record<string, string>
  enum: Record<string, string>
}

const statusConfigs: Record<'feedback' | 'question', StatusConfig> = {
  feedback: {
    labels: {
      UNDER_REVIEW: 'Under Review',
      PLANNED: 'Planned',
      IN_PROGRESS: 'In Progress',
      COMPLETED: 'Completed',
      WONT_DO: "Won't Do",
    },
    enum: FeedbackStatus,
  },
  question: {
    labels: {
      RESOLVED: 'Resolved',
      AWAITING_USER_RESPONSE: 'Awaiting User',
      AWAITING_ADMIN_RESPONSE: 'Awaiting Admin',
    },
    enum: QuestionStatus,
  },
}

export function StatusBadge({
  status,
  userRole,
  onStatusChange,
  isQuestion = false,
}: StatusBadgeProps) {
  const config = statusConfigs[isQuestion ? 'question' : 'feedback']
  const canEdit = isAdmin(userRole) && onStatusChange

  if (!canEdit) {
    return (
      <Badge variant="secondary">
        <P3>{config.labels[status]}</P3>
      </Badge>
    )
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Badge variant="secondary" className="cursor-pointer">
          <P3>{config.labels[status]}</P3>
        </Badge>
      </DropdownMenuTrigger>
      <DropdownMenuContent>
        {Object.entries(config.enum).map(([key, value]) => (
          <DropdownMenuItem
            key={key}
            className={value === status ? 'bg-accent' : ''}
            onClick={() =>
              onStatusChange?.(value as FeedbackStatus | QuestionStatus)
            }
          >
            {config.labels[value]}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
