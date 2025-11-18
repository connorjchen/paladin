import { Dialog, DialogContent } from '../ui/dialog'
import { Input } from '../ui/input'
import { VFlex } from './VFlex'
import { usePostStore } from '@/stores/post'
import { useState, useEffect } from 'react'
import { DetailedPost } from '@paladin/shared'
import { useDebounce } from '@/hooks/use-debounce'
import { Loading } from './Loading'
import { PostCard } from './PostCard'
import { PostCardSkeleton } from './PostCardSkeleton'

interface SearchModalProps {
  open: boolean
  setOpen: (open: boolean) => void
}

export function SearchModal({ open, setOpen }: SearchModalProps) {
  const { getRelevantPosts } = usePostStore()
  const [search, setSearch] = useState('')
  const [posts, setPosts] = useState<DetailedPost[]>([])
  const [loading, setLoading] = useState(false)
  const debouncedSearch = useDebounce(search, 150)

  useEffect(() => {
    const fetchPosts = async () => {
      setLoading(true)
      const result = await getRelevantPosts({
        query: debouncedSearch,
      })
      if (result.data) {
        setPosts(result.data.posts)
      }
      setLoading(false)
    }

    fetchPosts()
  }, [debouncedSearch, getRelevantPosts])

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="max-w-xs p-0 duration-200 sm:max-w-md md:max-w-lg lg:max-w-xl xl:max-w-2xl">
        <VFlex className="h-[80vh] max-h-[80vh] gap-4 px-4 sm:h-[50vh] sm:max-h-[50vh]">
          <Input
            placeholder="Search posts..."
            autoFocus
            value={search}
            className="mt-8"
            onChange={(e) => setSearch(e.target.value)}
          />
          <VFlex className="flex-1 gap-4 overflow-y-auto pb-4">
            {loading ? (
              <PostCardSkeleton numSkeletons={3} />
            ) : posts.length === 0 ? (
              <div className="text-muted-foreground text-center">
                No results found
              </div>
            ) : (
              posts.map((post) => (
                <PostCard
                  post={post}
                  onClick={() => setOpen(false)}
                  key={post.id}
                />
              ))
            )}
          </VFlex>
        </VFlex>
      </DialogContent>
    </Dialog>
  )
}
