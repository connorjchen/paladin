import { Tabs, TabsList, TabsTrigger } from '../ui/tabs'
import { PostOrderBy } from '@paladin/shared'

interface OrderByTabsProps {
  value: PostOrderBy
  onChange: (value: PostOrderBy) => void
}

export function OrderByTabs({ value, onChange }: OrderByTabsProps) {
  return (
    <Tabs
      value={value}
      onValueChange={(value) => onChange(value as PostOrderBy)}
    >
      <TabsList>
        <TabsTrigger value={PostOrderBy.MOST_RECENT}>Recent</TabsTrigger>
        <TabsTrigger value={PostOrderBy.MOST_UPVOTED}>
          Highest Votes
        </TabsTrigger>
      </TabsList>
    </Tabs>
  )
}
