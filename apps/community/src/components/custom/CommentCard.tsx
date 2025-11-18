import React from 'react'
import { HFlex } from './HFlex'
import { VFlex } from './VFlex'
import { SingleAvatar } from './SingleAvatar'
import { AdminBadge } from './AdminBadge'
import { Button } from '../ui/button'
import { cn, dateToHumanFriendlyString } from '@/lib/utils'
import { MarkdownRenderer } from './MarkdownRenderer'
import { MoreHorizontal } from 'lucide-react'
import {
  DetailedComment,
  DetailedPost,
  getDiscordAvatarIfExists,
  getDiscordUsernameIfExists,
  DISCORD_BOT_USER_ID,
  isAdmin,
  isAuthor,
} from '@paladin/shared'
import { UserRole } from '@prisma/client'
import { ButtonIcon } from './ButtonIcon'
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from '../ui/dropdown-menu'
import { useUserStore } from '@/stores/user'
import { P2 } from './Text'
import { DiscordLinkButton } from './DiscordLinkButton'
import { useIsMobile } from '@/hooks/use-mobile'
import { DiscordMessageAttachments } from './DiscordMessageAttachments'
import { useCommunityStore } from '@/stores/community'

interface CommentCardProps {
  post: DetailedPost
  comment: DetailedComment
  onReplyClick: (commentId: string, author: string) => void
  isReplying?: boolean
  depth: number
  showAcceptButton: boolean
  onAcceptAnswerClick: (commentId: string, isAcceptedAnswer: boolean) => void
  onEditClick?: (comment: DetailedComment) => void
  onDeleteClick?: (commentId: string) => void
}

export function CommentCard({
  post,
  comment,
  onReplyClick,
  isReplying,
  depth,
  showAcceptButton,
  onAcceptAnswerClick,
  onEditClick,
  onDeleteClick,
}: CommentCardProps) {
  const { user: currentUser } = useUserStore()
  const { community } = useCommunityStore()
  const isMobile = useIsMobile()
  const authorName = getDiscordUsernameIfExists(comment)

  // Author
  const canEdit = isAuthor(comment.authorId, currentUser?.id)

  // Author or admin
  const canDelete =
    isAuthor(comment.authorId, currentUser?.id) || isAdmin(currentUser?.role)

  const buttonSection = (
    <HFlex className="justify-end gap-2">
      {comment.discordMessage && post.discordThread && (
        <DiscordLinkButton
          guildId={post.discordThread.channel.guildId}
          threadId={post.discordThread.id}
          messageId={comment.discordMessage.id}
        />
      )}
      {community?.isWebpageSubmissionsEnabled && (
        <Button
          variant="outline"
          size="sm"
          onClick={() => onReplyClick(comment.id, authorName)}
        >
          {isReplying ? 'Cancel Reply' : 'Reply'}
        </Button>
      )}
      {showAcceptButton && (
        <Button
          variant="outline"
          size="sm"
          className={cn(
            comment.isAcceptedAnswer &&
              'border-green-500 text-green-500 hover:bg-green-50 dark:hover:bg-green-950'
          )}
          onClick={() =>
            onAcceptAnswerClick?.(comment.id, !comment.isAcceptedAnswer)
          }
        >
          {comment.isAcceptedAnswer ? 'Unmark as Accepted' : 'Mark as Accepted'}
        </Button>
      )}
      {(canEdit || canDelete) && (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <ButtonIcon variant="ghost" size="sm">
              <MoreHorizontal className="h-4 w-4" />
            </ButtonIcon>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {canEdit && (
              <DropdownMenuItem onClick={() => onEditClick?.(comment)}>
                Edit Comment
              </DropdownMenuItem>
            )}
            {canDelete && (
              <DropdownMenuItem
                onClick={() => onDeleteClick?.(comment.id)}
                className="text-destructive focus:text-destructive"
              >
                Delete Comment
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      )}
    </HFlex>
  )

  return (
    <HFlex className="w-full items-stretch">
      {/* Thread lines for each depth level with spacing */}
      {Array.from({ length: depth }, (_, index) => (
        <div
          key={index}
          className={cn(
            'bg-border w-[2px]',
            index > 0 && 'ml-8',
            isMobile && 'hidden'
          )}
        />
      ))}

      {/* Comment content */}
      <VFlex
        className={cn(
          'border-sidebar-border my-2 flex-1 gap-2 rounded-lg border p-4',
          !isMobile && depth > 0 && 'ml-8', // Fixed gap between line and content
          comment.isAcceptedAnswer && 'border-green-500'
        )}
      >
        <HFlex className="justify-between gap-2">
          <HFlex className="gap-2">
            <SingleAvatar
              src={getDiscordAvatarIfExists(comment)}
              alt={authorName}
              fallback={authorName[0]}
            />
            <VFlex>
              <HFlex className="gap-2">
                <P2>{authorName}</P2>
                {comment.authorId !== DISCORD_BOT_USER_ID &&
                  comment.author.role === UserRole.ADMIN && <AdminBadge />}
              </HFlex>
              <P2 muted>
                {dateToHumanFriendlyString(comment.createdAt)}
                {comment.createdAt.getTime() !== comment.updatedAt.getTime() &&
                  ' (edited)'}
              </P2>
            </VFlex>
          </HFlex>
          {!isMobile && buttonSection}
        </HFlex>
        <MarkdownRenderer content={comment.content} />
        <DiscordMessageAttachments
          attachments={comment.discordMessage?.attachments || []}
        />
        {isMobile && buttonSection}
      </VFlex>
    </HFlex>
  )
}
