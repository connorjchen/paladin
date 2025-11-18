import { VFlex } from '../components/custom/VFlex'
import { PostCard } from '../components/custom/PostCard'
import { Container } from '../components/custom/Container'
import { useState, useEffect } from 'react'
import { usePostStore } from '@/stores/post'
import { DetailedPost } from '@paladin/shared'
import { Link } from 'react-router-dom'
import { H1, H2, P2 } from '../components/custom/Text'
import { PostCardSkeleton } from '@/components/custom/PostCardSkeleton'
import { HFlex } from '@/components/custom/HFlex'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { useUserStore } from '@/stores/user'

export function ReviewPostsPage() {
  const { getReviewPosts } = usePostStore()
  const { user, updateAdminEmailNotifications, getUser } = useUserStore()
  const [feedbackPosts, setFeedbackPosts] = useState<DetailedPost[]>([])
  const [questionPosts, setQuestionPosts] = useState<DetailedPost[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const fetchPosts = async () => {
      setLoading(true)
      const result = await getReviewPosts()
      if (result.data) {
        setFeedbackPosts(result.data.feedback)
        setQuestionPosts(result.data.questions)
      }
      setLoading(false)
    }
    fetchPosts()
  }, [getReviewPosts])

  const handleAdminEmailNotificationsToggle = async (checked: boolean) => {
    await updateAdminEmailNotifications({
      isAdminEmailNotificationsEnabled: checked,
    })
    await getUser()
  }

  return (
    <Container>
      <VFlex className="gap-4">
        <H1>Review Posts</H1>

        <VFlex className="gap-2">
          <HFlex className="gap-2">
            <Label htmlFor="email-notifications">
              Admin Email Notifications
            </Label>
            <Switch
              id="email-notifications"
              checked={user?.isAdminEmailNotificationsEnabled ?? false}
              onCheckedChange={handleAdminEmailNotificationsToggle}
            />
          </HFlex>
          <P2 muted>
            Enabling this will send you an email when there is a new post under
            review.
          </P2>
        </VFlex>

        <VFlex className="gap-4">
          {/* Questions Awaiting Admin Response */}
          <H2>Questions Awaiting Response</H2>
          {loading ? (
            <PostCardSkeleton numSkeletons={3} />
          ) : questionPosts.length === 0 ? (
            <P2 muted>No questions awaiting response</P2>
          ) : (
            <VFlex className="gap-4">
              {questionPosts.map((post) => (
                <Link key={post.id} to={`/post/${post.id}`}>
                  <PostCard post={post} />
                </Link>
              ))}
            </VFlex>
          )}

          {/* Feedback Under Review */}
          <H2>Feedback Under Review</H2>
          {loading ? (
            <PostCardSkeleton numSkeletons={3} />
          ) : feedbackPosts.length === 0 ? (
            <P2 muted>No feedback under review</P2>
          ) : (
            <VFlex className="gap-4">
              {feedbackPosts.map((post) => (
                <Link key={post.id} to={`/post/${post.id}`}>
                  <PostCard post={post} />
                </Link>
              ))}
            </VFlex>
          )}
        </VFlex>
      </VFlex>
    </Container>
  )
}
