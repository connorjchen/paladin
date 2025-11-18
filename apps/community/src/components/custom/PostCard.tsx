import { Card } from '../ui/card'
import { VFlex } from './VFlex'
import { HFlex } from './HFlex'
import { AvatarStack } from './AvatarStack'
import { UpvoteCounter } from './UpvoteCounter'
import {
  DetailedComment,
  DetailedPost,
  getDiscordAvatarIfExists,
  getDiscordUsernameIfExists,
  DISCORD_BOT_USER_ID,
} from '@paladin/shared'
import {
  dateToHumanFriendlyString,
  pluralize,
  stripMarkdown,
} from '@/lib/utils'
import { H3, P2 } from './Text'
import { PostBadges } from './PostBadges'
import { SubpathLink } from './SubpathLink'

interface PostCardProps {
  post: DetailedPost
  onClick?: () => void
}

export function PostCard({ post, onClick }: PostCardProps) {
  // Compute the display identity for the post author (Discord bot if posted via Discord)
  const postDisplayIdentityId =
    post.authorId === DISCORD_BOT_USER_ID
      ? post.discordThread?.author?.id || post.author.id
      : post.author.id

  // Build a unique list of comment authors by display identity (Discord bot if via Discord)
  const uniqueCommentAuthors: DetailedComment[] = []
  if (post.comments && post.comments.length > 0) {
    const seenDisplayIdentityIds = new Set<string>()
    for (const comment of post.comments) {
      const commentDisplayIdentityId =
        comment.authorId === DISCORD_BOT_USER_ID
          ? comment.discordMessage?.author?.id || comment.author.id
          : comment.author.id

      if (
        commentDisplayIdentityId !== postDisplayIdentityId &&
        !seenDisplayIdentityIds.has(commentDisplayIdentityId)
      ) {
        seenDisplayIdentityIds.add(commentDisplayIdentityId)
        uniqueCommentAuthors.push(comment)
      }
    }
  }

  return (
    <SubpathLink to={`/post/${post.id}`} className="block">
      <Card
        className="flex cursor-pointer items-center p-4 transition-[filter] duration-150 hover:brightness-95 dark:hover:brightness-110"
        onClick={(e) => {
          // Prevent navigation if clicking on upvote counter
          if ((e.target as HTMLElement).closest('.upvote-counter')) {
            e.preventDefault()
          } else {
            onClick?.()
          }
        }}
      >
        <HFlex className="w-full gap-4">
          <UpvoteCounter
            postId={post.id}
            count={post._count.upvotes}
            vertical
            className="upvote-counter"
          />
          <VFlex className="flex-1 gap-1">
            <PostBadges post={post} />
            <H3 className="line-clamp-1 break-all">{post.title}</H3>
            <P2 muted className="line-clamp-1 break-all">
              {stripMarkdown(post.content)}
            </P2>
            <P2 muted>{`${dateToHumanFriendlyString(post.createdAt)} • ${
              post._count.comments === 0
                ? 'No replies yet'
                : pluralize(post._count.comments, 'comment')
            }`}</P2>
          </VFlex>
          <AvatarStack
            avatars={[
              {
                src: getDiscordAvatarIfExists(post),
                fallback: getDiscordUsernameIfExists(post).charAt(0),
              },
              ...uniqueCommentAuthors.map((comment) => ({
                src: getDiscordAvatarIfExists(comment),
                fallback: getDiscordUsernameIfExists(comment).charAt(0),
              })),
            ]}
          />
        </HFlex>
      </Card>
    </SubpathLink>
  )
}
