import { PostFilter as PostFilterType } from '@paladin/shared'
import { Badge } from '../ui/badge'
import { HFlex } from './HFlex'
import {
  ListIcon,
  MessageCircleIcon,
  MessageCircleQuestionIcon,
  TagIcon,
} from 'lucide-react'
import { PostTagMultiSelect } from './PostTagSelect'
import { useEffect, useState } from 'react'
import { usePostTagStore } from '@/stores/postTag'
import { PostTag as PostTagType } from '@prisma/client'
import { VFlex } from './VFlex'

interface PostFilterProps {
  activeFilter: PostFilterType
  onFilterChange: (filter: PostFilterType) => void
  selectedTagIds: string[]
  setSelectedTagIds: (tagIds: string[]) => void
}

export function PostFilter({
  activeFilter,
  onFilterChange,
  selectedTagIds,
  setSelectedTagIds,
}: PostFilterProps) {
  const { getPostTags } = usePostTagStore()
  const [tags, setTags] = useState<PostTagType[]>([])

  useEffect(() => {
    getPostTags().then((res) => {
      if (res.data) {
        setTags(res.data.postTags)
      }
    })
  }, [getPostTags])

  return (
    <VFlex className="justify-between gap-2 sm:flex-row">
      <HFlex className="gap-2">
        <Badge
          variant={
            activeFilter === PostFilterType.ALL ? 'secondary' : 'outline'
          }
          className="cursor-pointer gap-1 hover:opacity-80"
          onClick={() => onFilterChange(PostFilterType.ALL)}
        >
          <ListIcon className="h-3 w-3" />
          Everything
        </Badge>
        <Badge
          variant={
            activeFilter === PostFilterType.QUESTION ? 'secondary' : 'outline'
          }
          className="cursor-pointer gap-1 hover:opacity-80"
          onClick={() => onFilterChange(PostFilterType.QUESTION)}
        >
          <MessageCircleQuestionIcon className="h-3 w-3" />
          Questions
        </Badge>
        <Badge
          variant={
            activeFilter === PostFilterType.FEEDBACK ? 'secondary' : 'outline'
          }
          className="cursor-pointer gap-1 hover:opacity-80"
          onClick={() => onFilterChange(PostFilterType.FEEDBACK)}
        >
          <MessageCircleIcon className="h-3 w-3" />
          Feedback
        </Badge>
      </HFlex>
      <PostTagMultiSelect
        values={selectedTagIds}
        setValues={setSelectedTagIds}
        options={tags}
        className="min-w-64"
      />
    </VFlex>
  )
}
