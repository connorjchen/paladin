import { Card } from '../ui/card'
import { VFlex } from './VFlex'
import { HFlex } from './HFlex'
import { cn } from '@/lib/utils'
import { Skeleton } from '../ui/skeleton'

interface PostCardSkeletonProps {
  className?: string
  numSkeletons?: number
}

export function PostCardSkeleton({
  className,
  numSkeletons = 1,
}: PostCardSkeletonProps) {
  return Array.from({ length: numSkeletons }, (_, index) => (
    <Card key={index} className={cn('flex items-center p-4', className)}>
      <HFlex className="w-full gap-4">
        {/* Upvote counter skeleton */}
        <Skeleton className="h-[66px] w-[52px]" />

        <VFlex className="flex-1 gap-2">
          {/* Post badges skeleton */}
          <HFlex className="gap-2">
            <Skeleton className="h-[18px] w-[60px]" />
            <Skeleton className="h-[18px] w-[113px]" />
          </HFlex>

          {/* Title skeleton */}
          <Skeleton className="h-[24px] w-1/4" />

          {/* Content skeleton */}
          <Skeleton className="h-[18px] w-3/4" />

          {/* Meta info skeleton */}
          <HFlex className="gap-2">
            <Skeleton className="h-[18px] w-[80px]" />
            <Skeleton className="h-[18px] w-[80px]" />
          </HFlex>
        </VFlex>

        {/* Avatar stack skeleton */}
        <HFlex className="-space-x-4">
          <Skeleton className="border-background h-6 w-6 rounded-full border-2" />
          <Skeleton className="border-background h-6 w-6 rounded-full border-2" />
          <Skeleton className="border-background h-6 w-6 rounded-full border-2" />
        </HFlex>
      </HFlex>
    </Card>
  ))
}
