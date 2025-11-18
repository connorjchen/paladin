import { ChevronUp } from 'lucide-react'
import { Button } from '../ui/button'
import { useUserStore } from '@/stores/user'
import { usePostStore } from '@/stores/post'
import { cn, hasUserUpvoted } from '@/lib/utils'
import { useState } from 'react'
import { P2 } from './Text'
import { useSubpathNavigate } from '@/hooks/use-subpath-navigate'
import { useCommunityStore } from '@/stores/community'

interface UpvoteCounterProps {
  postId: string
  count: number
  className?: string
  vertical?: boolean
}

export function UpvoteCounter({
  postId,
  count,
  className = '',
  vertical = false,
}: UpvoteCounterProps) {
  const { community } = useCommunityStore()
  const { user, getUser } = useUserStore()
  const { upvotePost } = usePostStore()
  const navigate = useSubpathNavigate()
  const [optimisticCount, setOptimisticCount] = useState(count)
  const [optimisticHasUpvoted, setOptimisticHasUpvoted] = useState(
    user ? hasUserUpvoted(user, postId) : false
  )
  const [loading, setLoading] = useState(false)

  if (!community?.isWebpageSubmissionsEnabled) {
    return null
  }

  return (
    <Button
      variant={optimisticHasUpvoted ? 'default' : 'outline'}
      disabled={loading}
      onClick={async () => {
        if (user) {
          setLoading(true)
          const newUpvotedState = !optimisticHasUpvoted
          setOptimisticHasUpvoted(newUpvotedState)
          setOptimisticCount(optimisticCount + (optimisticHasUpvoted ? -1 : 1))

          await upvotePost(postId, { isUpvote: newUpvotedState })
          // DEBT: Refresh user to update upvote status (not ideal flow, but works for now)
          await getUser()
          setLoading(false)
        } else {
          navigate('/login')
        }
      }}
      className={cn(
        'border',
        {
          'flex-col py-8': vertical,
          'border-transparent': optimisticHasUpvoted, // make button size identical to outline
        },
        className
      )}
    >
      <ChevronUp />
      <P2 className={cn('min-w-[2ch] text-center text-inherit')}>
        {optimisticCount}
      </P2>
    </Button>
  )
}
