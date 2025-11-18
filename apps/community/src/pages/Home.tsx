import { VFlex } from '../components/custom/VFlex'
import { HFlex } from '../components/custom/HFlex'
import { PostCard } from '../components/custom/PostCard'
import { PostFilter as PostFilterComponent } from '../components/custom/PostFilter'
import { OrderByTabs } from '../components/custom/OrderByTabs'
import { Pagination } from '../components/custom/Pagination'
import { Container } from '../components/custom/Container'
import { useState, useEffect, useRef, useCallback } from 'react'
import { useSearchParams } from 'react-router-dom'
import { usePostStore } from '@/stores/post'
import { DetailedPost, PostFilter, PostOrderBy } from '@paladin/shared'
import { Loading } from '@/components/custom/Loading'
import { H1 } from '../components/custom/Text'
import { cn } from '@/lib/utils'
import { PostCardSkeleton } from '@/components/custom/PostCardSkeleton'

export function HomePage() {
  const [searchParams, setSearchParams] = useSearchParams()
  // Parse URL params into state
  const parseUrlParams = useCallback(() => {
    const defaultPage = Math.max(
      1,
      parseInt(searchParams.get('page') || '1', 10) || 1
    )
    const defaultOrderBy = Object.values(PostOrderBy).includes(
      searchParams.get('orderBy') as PostOrderBy
    )
      ? (searchParams.get('orderBy') as PostOrderBy)
      : PostOrderBy.MOST_RECENT
    const defaultFilter = Object.values(PostFilter).includes(
      searchParams.get('filter') as PostFilter
    )
      ? (searchParams.get('filter') as PostFilter)
      : PostFilter.ALL

    const defaultTagIdsRaw = searchParams.getAll('tagIds')
    const defaultTagIds = defaultTagIdsRaw
      .flatMap((v) => v.split(','))
      .filter(Boolean)

    return {
      defaultPage,
      defaultOrderBy,
      defaultFilter,
      defaultTagIds,
    }
  }, [searchParams])
  const { defaultPage, defaultOrderBy, defaultFilter, defaultTagIds } =
    parseUrlParams()

  const { getPosts } = usePostStore()
  const [activeFilter, setActiveFilter] = useState<PostFilter>(defaultFilter)
  const [orderBy, setOrderBy] = useState<PostOrderBy>(defaultOrderBy)
  const [pinnedPosts, setPinnedPosts] = useState<DetailedPost[]>([])
  const [posts, setPosts] = useState<DetailedPost[]>([])
  const [totalPosts, setTotalPosts] = useState(0)
  const [pinnedPostsLoading, setPinnedPostsLoading] = useState(false)
  const [allPostsLoading, setAllPostsLoading] = useState(false)
  const [selectedTagIds, setSelectedTagIds] = useState<string[]>(defaultTagIds)
  const [currentPage, setCurrentPage] = useState(defaultPage)
  const initialized = useRef(false)
  const postsPerPage = 20

  // Fetch pinned posts
  useEffect(() => {
    const fetchPinnedPosts = async () => {
      setPinnedPostsLoading(true)
      const result = await getPosts({
        orderBy: PostOrderBy.MOST_UPVOTED,
        filter: PostFilter.PINNED,
      })
      if (result.data) {
        setPinnedPosts(result.data.posts)
      }
      setPinnedPostsLoading(false)
    }
    fetchPinnedPosts()
  }, [getPosts])

  // Reset to first page when filters change
  useEffect(() => {
    if (!initialized.current) {
      initialized.current = true
      return
    }
    setCurrentPage(1)
  }, [orderBy, activeFilter, selectedTagIds])

  // Sync state to URL params
  useEffect(() => {
    const params = new URLSearchParams(searchParams)
    let changed = false

    if (params.get('page') !== String(currentPage)) {
      params.set('page', String(currentPage))
      changed = true
    }
    if (params.get('orderBy') !== orderBy) {
      params.set('orderBy', orderBy)
      changed = true
    }
    if (params.get('filter') !== activeFilter) {
      params.set('filter', activeFilter)
      changed = true
    }

    const existingTags = params.getAll('tagIds')
    const tagsEqual =
      existingTags.length === selectedTagIds.length &&
      existingTags.every((tag, i) => tag === selectedTagIds[i])
    if (!tagsEqual) {
      params.delete('tagIds')
      selectedTagIds.forEach((id) => params.append('tagIds', id))
      changed = true
    }

    if (changed) setSearchParams(params)
  }, [
    currentPage,
    orderBy,
    activeFilter,
    selectedTagIds,
    searchParams,
    setSearchParams,
  ])

  // Fetch all posts
  useEffect(() => {
    const fetchAllPosts = async () => {
      setAllPostsLoading(true)
      const limit = postsPerPage
      const offset = (currentPage - 1) * limit
      const result = await getPosts({
        orderBy,
        filter: activeFilter,
        limit,
        offset,
        tagIds: selectedTagIds,
      })
      if (result.data) {
        setPosts(result.data.posts)
        setTotalPosts(result.data.totalItems)
      }
      setAllPostsLoading(false)
    }

    fetchAllPosts()
  }, [getPosts, orderBy, activeFilter, currentPage, selectedTagIds])

  if (pinnedPostsLoading) {
    return <Loading />
  }

  return (
    <Container>
      {/* Pinned Posts */}
      {pinnedPosts.length > 0 && (
        <VFlex className="gap-2">
          <H1>Pinned Posts</H1>
          <div
            className={cn('grid items-stretch gap-4', {
              'grid-cols-1': pinnedPosts.length === 1,
              'grid-cols-1 sm:grid-cols-2': pinnedPosts.length !== 1,
            })}
          >
            {pinnedPosts.map((post) => (
              <PostCard key={post.id} post={post} />
            ))}
          </div>
        </VFlex>
      )}

      {/* All Posts */}
      <VFlex className="gap-2">
        <HFlex className="justify-between">
          <H1>All Posts</H1>
          <OrderByTabs value={orderBy} onChange={setOrderBy} />
        </HFlex>

        <PostFilterComponent
          activeFilter={activeFilter}
          onFilterChange={setActiveFilter}
          selectedTagIds={selectedTagIds}
          setSelectedTagIds={setSelectedTagIds}
        />

        <VFlex className="gap-4">
          {allPostsLoading ? (
            <PostCardSkeleton numSkeletons={postsPerPage} />
          ) : posts.length === 0 ? (
            <div className="text-muted-foreground text-center">
              No posts found
            </div>
          ) : (
            <>
              {posts.map((post) => (
                <PostCard key={post.id} post={post} />
              ))}
            </>
          )}
        </VFlex>

        <Pagination
          currentPage={currentPage}
          totalItems={totalPosts}
          itemsPerPage={postsPerPage}
          onPageChange={setCurrentPage}
        />
      </VFlex>
    </Container>
  )
}
