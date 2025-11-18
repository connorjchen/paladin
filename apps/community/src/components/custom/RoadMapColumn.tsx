import { VFlex } from './VFlex'
import { HFlex } from './HFlex'
import { PostCard } from './PostCard'
import { DetailedPost } from '@paladin/shared'
import { H2, P2 } from './Text'
import { PostCardSkeleton } from './PostCardSkeleton'

interface RoadMapColumnProps {
  title: string
  items: DetailedPost[]
  loading: boolean
}

export function RoadMapColumn({ title, items, loading }: RoadMapColumnProps) {
  return (
    <VFlex className="border-sidebar-border h-full max-h-[400px] min-h-[400px] gap-4 rounded-lg border p-4 xl:max-h-[800px] xl:min-h-[800px]">
      <HFlex className="gap-2">
        <H2>{title}</H2>
        <P2 muted>({items.length})</P2>
      </HFlex>
      <VFlex className="h-full gap-4 overflow-y-auto">
        {loading ? (
          <PostCardSkeleton numSkeletons={3} />
        ) : items.length === 0 ? (
          <P2 muted>No items</P2>
        ) : (
          items.map((item) => <PostCard key={item.id} post={item} />)
        )}
      </VFlex>
    </VFlex>
  )
}
