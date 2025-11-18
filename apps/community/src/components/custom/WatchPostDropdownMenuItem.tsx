import { useEffect } from 'react'
import { usePostStore } from '@/stores/post'
import { BasicWatchedPost } from '@paladin/shared'
import { useUserStore } from '@/stores/user'
import { DropdownMenuItem } from '../ui/dropdown-menu'

interface WatchPostDropdownMenuItemProps {
  postId: string
}

export function WatchPostDropdownMenuItem({
  postId,
}: WatchPostDropdownMenuItemProps) {
  const { watchPost } = usePostStore()
  const { getUser, user: currentUser } = useUserStore()
  const userIsWatching =
    currentUser?.watchedPosts?.some(
      (watchedPost: BasicWatchedPost) => watchedPost.postId === postId
    ) ?? false

  useEffect(() => {
    getUser()
  }, [getUser])

  return (
    <DropdownMenuItem
      onClick={async () => {
        await watchPost(postId, { isWatching: !userIsWatching })
        await getUser()
      }}
    >
      {userIsWatching ? 'Unwatch Post' : 'Watch Post'}
    </DropdownMenuItem>
  )
}
