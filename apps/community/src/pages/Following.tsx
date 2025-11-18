import { VFlex } from '../components/custom/VFlex'
import { PostCard } from '../components/custom/PostCard'
import { Container } from '../components/custom/Container'
import { useState, useEffect } from 'react'
import { usePostStore } from '@/stores/post'
import { useUserStore } from '@/stores/user'
import { DetailedPost, PostFilter, PostOrderBy } from '@paladin/shared'
import { Link, useParams } from 'react-router-dom'
import { Loading } from '@/components/custom/Loading'
import { H1, H2, P2 } from '../components/custom/Text'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { HFlex } from '@/components/custom/HFlex'
import { PostCardSkeleton } from '@/components/custom/PostCardSkeleton'
import { getSubpathPath } from '@/lib/utils'
import { SubpathLink } from '@/components/custom/SubpathLink'

export function FollowingPage() {
  const { getPosts } = usePostStore()
  const { user, updateEmailNotifications, getUser } = useUserStore()
  const [allPosts, setAllPosts] = useState<DetailedPost[]>([])
  const [loading, setLoading] = useState(false)
  const { serverSubpath } = useParams()

  useEffect(() => {
    const fetchAllMyPosts = async () => {
      setLoading(true)
      const result = await getPosts({
        orderBy: PostOrderBy.MOST_RECENT,
        filter: PostFilter.FOLLOWING,
      })
      if (result.data) {
        setAllPosts(result.data.posts)
      }
      setLoading(false)
    }
    fetchAllMyPosts()
  }, [getPosts])

  const handleEmailNotificationsToggle = async (checked: boolean) => {
    await updateEmailNotifications({
      isEmailNotificationsEnabled: checked,
    })
    await getUser()
  }

  return (
    <Container>
      <VFlex className="gap-4">
        <VFlex>
          <H1>Following</H1>
          <P2 muted>
            Your posts, posts you've explictly watched, and posts you've
            commented on
          </P2>
        </VFlex>
        <VFlex className="gap-2">
          <HFlex className="gap-2">
            <Label htmlFor="email-notifications">Email Notifications</Label>
            <Switch
              id="email-notifications"
              checked={user?.isEmailNotificationsEnabled ?? false}
              onCheckedChange={handleEmailNotificationsToggle}
            />
          </HFlex>
          <P2 muted>
            Enabling this will send you an email when there is a new comment on
            a post you're following.
          </P2>
        </VFlex>
        <VFlex className="gap-4">
          {loading ? (
            <PostCardSkeleton numSkeletons={3} />
          ) : allPosts.length === 0 ? (
            <div className="text-muted-foreground text-center">
              No posts found
            </div>
          ) : (
            allPosts.map((post) => (
              <SubpathLink key={post.id} to={`/post/${post.id}`}>
                <PostCard post={post} />
              </SubpathLink>
            ))
          )}
        </VFlex>
      </VFlex>
    </Container>
  )
}
