import { FeedbackStatus, PostType, QuestionStatus } from '@prisma/client'
import { DetailedPost } from '@paladin/shared'
import { HFlex } from './HFlex'
import { PrivateBadge } from './PrivateBadge'
import { ColoredBadge } from './ColoredBadge'
import { StatusBadge } from './StatusBadge'
import { useUserStore } from '@/stores/user'

interface PostBadgesProps {
  post: DetailedPost
  onFeedbackStatusChange?: (status: FeedbackStatus) => void
  onQuestionStatusChange?: (status: QuestionStatus) => void
}

export function PostBadges({
  post,
  onFeedbackStatusChange,
  onQuestionStatusChange,
}: PostBadgesProps) {
  const { user: currentUser } = useUserStore()

  const handleFeedbackStatusChange = (
    newStatus: FeedbackStatus | QuestionStatus
  ) => {
    if (onFeedbackStatusChange && newStatus in FeedbackStatus) {
      onFeedbackStatusChange(newStatus as FeedbackStatus)
    }
  }

  const handleQuestionStatusChange = (
    newStatus: FeedbackStatus | QuestionStatus
  ) => {
    if (onQuestionStatusChange && newStatus in QuestionStatus) {
      onQuestionStatusChange(newStatus as QuestionStatus)
    }
  }

  return (
    <HFlex className="flex-wrap gap-2">
      {post.private && <PrivateBadge />}
      {post.postTags.map((tag) => (
        <ColoredBadge
          key={tag.tagId}
          color={tag.tag.color}
          name={tag.tag.name}
        />
      ))}
      {post.type === PostType.FEEDBACK && post.feedbackStatus && (
        <StatusBadge
          status={post.feedbackStatus}
          userRole={currentUser?.role}
          onStatusChange={handleFeedbackStatusChange}
        />
      )}
      {post.type === PostType.QUESTION && post.questionStatus && (
        <StatusBadge
          status={post.questionStatus}
          userRole={currentUser?.role}
          onStatusChange={handleQuestionStatusChange}
          isQuestion={true}
        />
      )}
    </HFlex>
  )
}
