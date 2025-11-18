import React from 'react'
import { DetailedPost, isAdmin, DetailedUser } from '@paladin/shared'
import { UserRole, PostType } from '@prisma/client'
import { MoreHorizontal } from 'lucide-react'
import { HFlex } from './HFlex'
import { UpvoteCounter } from './UpvoteCounter'
import { PinButton } from './PinButton'
import { ButtonIcon } from './ButtonIcon'
import { WatchPostDropdownMenuItem } from './WatchPostDropdownMenuItem'
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from '@/components/ui/dropdown-menu'
import { DiscordLinkButton } from './DiscordLinkButton'

interface PostActionsProps {
  post: DetailedPost
  currentUser: DetailedUser | null
  canEdit: boolean
  canDelete: boolean
  onPinChange: (isPinned: boolean) => void
  onEditClick: () => void
  onDeleteClick: () => void
  onConvertType: (postType: PostType) => void
}

export function PostActions({
  post,
  currentUser,
  canEdit,
  canDelete,
  onPinChange,
  onEditClick,
  onDeleteClick,
  onConvertType,
}: PostActionsProps) {
  return (
    <HFlex className="gap-2">
      {post.discordThread && (
        <DiscordLinkButton
          guildId={post.discordThread.channel.guildId}
          threadId={post.discordThread.id}
        />
      )}
      {currentUser?.role === UserRole.ADMIN && !post.private && (
        <PinButton isPinned={post.pinned} onPinChange={onPinChange} />
      )}
      <UpvoteCounter postId={post.id} count={post._count.upvotes} />
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <ButtonIcon variant="ghost">
            <MoreHorizontal />
          </ButtonIcon>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <WatchPostDropdownMenuItem postId={post.id} />
          {canEdit && (
            <DropdownMenuItem onClick={onEditClick}>Edit Post</DropdownMenuItem>
          )}
          {(isAdmin(currentUser?.role) || canEdit) && (
            <>
              {post.type !== PostType.QUESTION && (
                <DropdownMenuItem
                  onClick={() => onConvertType(PostType.QUESTION)}
                >
                  Convert to Question
                </DropdownMenuItem>
              )}
              {post.type !== PostType.FEEDBACK && (
                <DropdownMenuItem
                  onClick={() => onConvertType(PostType.FEEDBACK)}
                >
                  Convert to Feedback
                </DropdownMenuItem>
              )}
              {post.type !== PostType.GENERAL && (
                <DropdownMenuItem
                  onClick={() => onConvertType(PostType.GENERAL)}
                >
                  Convert to General Post
                </DropdownMenuItem>
              )}
            </>
          )}
          {canDelete && (
            <DropdownMenuItem
              onClick={onDeleteClick}
              className="text-destructive focus:text-destructive"
            >
              Delete Post
            </DropdownMenuItem>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
    </HFlex>
  )
}
