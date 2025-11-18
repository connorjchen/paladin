import React from 'react'
import {
  DetailedPost,
  DISCORD_BOT_USER_ID,
  getDiscordAvatarIfExists,
  getDiscordUsernameIfExists,
} from '@paladin/shared'
import { UserRole, FeedbackStatus, QuestionStatus } from '@prisma/client'
import { VFlex } from './VFlex'
import { HFlex } from './HFlex'
import { SingleAvatar } from './SingleAvatar'
import { AdminBadge } from './AdminBadge'
import { DiscordLinkButton } from './DiscordLinkButton'
import { PostBadges } from './PostBadges'
import { H1, P2 } from './Text'
import { dateToHumanFriendlyString } from '@/lib/utils'

interface PostHeaderProps {
  post: DetailedPost
  onFeedbackStatusChange: (status: FeedbackStatus) => void
  onQuestionStatusChange: (status: QuestionStatus) => void
}

export function PostHeader({
  post,
  onFeedbackStatusChange,
  onQuestionStatusChange,
}: PostHeaderProps) {
  return (
    <VFlex>
      <VFlex className="gap-2">
        <PostBadges
          post={post}
          onFeedbackStatusChange={onFeedbackStatusChange}
          onQuestionStatusChange={onQuestionStatusChange}
        />
        <H1 className="break-words">{post.title}</H1>
      </VFlex>
      <HFlex className="gap-2">
        <SingleAvatar
          src={getDiscordAvatarIfExists(post)}
          fallback={getDiscordUsernameIfExists(post).charAt(0)}
        />
        <VFlex>
          <HFlex className="gap-2">
            <P2 muted>{getDiscordUsernameIfExists(post)}</P2>
            {post.authorId !== DISCORD_BOT_USER_ID &&
              post.author.role === UserRole.ADMIN && <AdminBadge />}
          </HFlex>
          <P2 muted>
            {dateToHumanFriendlyString(post.createdAt)}
            {post.createdAt.getTime() !== post.updatedAt.getTime() &&
              ' (edited)'}
          </P2>
        </VFlex>
      </HFlex>
    </VFlex>
  )
}
