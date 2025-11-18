import { VFlex } from '../components/custom/VFlex'
import { PostCard } from '../components/custom/PostCard'
import { Container } from '../components/custom/Container'
import { useState, useEffect } from 'react'
import { usePostStore } from '@/stores/post'
import { DetailedPost, PostFilter, PostOrderBy } from '@paladin/shared'
import { Link, useParams } from 'react-router-dom'
import { H1 } from '../components/custom/Text'
import { PostCardSkeleton } from '@/components/custom/PostCardSkeleton'
import { getSubpathPath } from '@/lib/utils'
import { SubpathLink } from '@/components/custom/SubpathLink'

export function MyPostsPage() {
  const { getPosts } = usePostStore()
  const [allPosts, setAllPosts] = useState<DetailedPost[]>([])
  const [loading, setLoading] = useState(false)
  const { serverSubpath } = useParams()

  useEffect(() => {
    const fetchAllMyPosts = async () => {
      setLoading(true)
      const result = await getPosts({
        orderBy: PostOrderBy.MOST_RECENT,
        filter: PostFilter.MY_POSTS,
      })
      if (result.data) {
        setAllPosts(result.data.posts)
      }
      setLoading(false)
    }
    fetchAllMyPosts()
  }, [getPosts])

  return (
    <Container>
      <VFlex className="gap-4">
        <H1>My Posts</H1>

        <VFlex className="gap-4">
          {loading ? (
            <PostCardSkeleton numSkeletons={3} />
          ) : allPosts.length === 0 ? (
            <div className="text-muted-foreground text-center">
              No posts found
            </div>
          ) : (
            <>
              {allPosts.map((post) => (
                <SubpathLink
                  key={post.id}
                  to={getSubpathPath(serverSubpath, `/post/${post.id}`)}
                >
                  <PostCard post={post} />
                </SubpathLink>
              ))}
            </>
          )}
        </VFlex>
      </VFlex>
    </Container>
  )
}
