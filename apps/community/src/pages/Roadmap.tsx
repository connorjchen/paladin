import { VFlex } from '../components/custom/VFlex'
import { HFlex } from '../components/custom/HFlex'
import { PostCard } from '../components/custom/PostCard'
import { Container } from '../components/custom/Container'
import { useEffect, useState } from 'react'
import { OrderByTabs } from '../components/custom/OrderByTabs'
import { DetailedPost, PostOrderBy } from '@paladin/shared'
import { RoadMapColumn } from '../components/custom/RoadMapColumn'
import { usePostStore } from '../stores/post'
import { H1, H2, P2 } from '../components/custom/Text'
import { PostCardSkeleton } from '@/components/custom/PostCardSkeleton'
import SEO from '@/components/custom/SEO'
import { useCommunityStore } from '@/stores/community'

export function RoadmapPage() {
  const { community } = useCommunityStore()
  const [orderBy, setOrderBy] = useState<PostOrderBy>(PostOrderBy.MOST_RECENT)
  const { getRoadmap } = usePostStore()
  const [loading, setLoading] = useState(false)
  const [planned, setPlanned] = useState<DetailedPost[]>([])
  const [inProgress, setInProgress] = useState<DetailedPost[]>([])
  const [completed, setCompleted] = useState<DetailedPost[]>([])
  const [underReview, setUnderReview] = useState<DetailedPost[]>([])

  useEffect(() => {
    setLoading(true)
    getRoadmap({ orderBy }).then((result) => {
      if (result.data) {
        setPlanned(result.data.planned)
        setInProgress(result.data.inProgress)
        setCompleted(result.data.completed)
        setUnderReview(result.data.underReview)
      }
      setLoading(false)
    })
  }, [orderBy, getRoadmap])

  if (!community) {
    throw new Error('Community type-safe check')
  }

  if (!community.isRoadmapEnabled) {
    return null
  }

  return (
    <>
      <SEO
        title={`${community.name} CommunityRoadmap`}
        description={`See what's planned, in progress, and recently completed for ${community.name}. Stay up to date on new features, improvements, and community-driven initiatives.`}
      />
      <Container>
        <HFlex className="items-center justify-between">
          <H1>Roadmap</H1>
          <OrderByTabs value={orderBy} onChange={setOrderBy} />
        </HFlex>

        <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
          <RoadMapColumn title="Planned" items={planned} loading={loading} />
          <RoadMapColumn
            title="In Progress"
            items={inProgress}
            loading={loading}
          />
          <RoadMapColumn
            title="Completed"
            items={completed}
            loading={loading}
          />
        </div>

        <VFlex className="gap-4">
          <HFlex className="gap-2">
            <H2>Under Review</H2>
            <P2 muted>({underReview.length})</P2>
          </HFlex>
          <VFlex className="gap-4">
            {loading ? (
              <PostCardSkeleton numSkeletons={3} />
            ) : underReview.length === 0 ? (
              <P2 muted>No items</P2>
            ) : (
              <>
                {underReview.map((item) => (
                  <PostCard key={item.id} post={item} />
                ))}
              </>
            )}
          </VFlex>
        </VFlex>
      </Container>
    </>
  )
}
