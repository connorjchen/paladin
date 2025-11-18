import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../ui/dialog'
import { Button } from '../ui/button'
import { Input } from '../ui/input'
import { Switch } from '../ui/switch'
import { Label } from '../ui/label'
import { HFlex } from './HFlex'
import { VFlex } from './VFlex'
import { useState, useEffect } from 'react'
import { usePostStore } from '@/stores/post'
import { emitToast } from '@/hooks/use-toast'
import { LoadingButton } from './LoadingButton'
import { PostTag as PostTagType, PostType } from '@prisma/client'
import { MarkdownEditor } from './MarkdownEditor'
import { usePostTagStore } from '@/stores/postTag'
import { DetailedPost } from '@paladin/shared'
import { PostTagMultiSelect } from './PostTagSelect'
import { useSubpathNavigate } from '@/hooks/use-subpath-navigate'

interface NewPostModalProps {
  open: boolean
  setOpen: (open: boolean) => void
  post?: DetailedPost | null // Optional post for edit mode
  onPostUpdated?: () => void // Callback for when post is updated
}

export function NewPostModal({
  open,
  setOpen,
  post,
  onPostUpdated,
}: NewPostModalProps) {
  const navigate = useSubpathNavigate()
  const { createPost, updatePost } = usePostStore()
  const { getPostTags } = usePostTagStore()
  const [tags, setTags] = useState<PostTagType[]>([])
  const [selectedTagIds, setSelectedTagIds] = useState<string[]>([])
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [postType, setPostType] = useState<PostType>(PostType.QUESTION)
  const [isPrivate, setIsPrivate] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const isEditing = !!post

  // Initialize form with post data when editing
  useEffect(() => {
    if (post) {
      setTitle(post.title)
      setContent(post.content)
      setPostType(post.type)
      setIsPrivate(post.private)
      setSelectedTagIds(post.postTags.map((tag) => tag.tagId))
    }
  }, [post])

  useEffect(() => {
    getPostTags().then((res) => {
      if (res.data) {
        setTags(res.data.postTags)
      }
    })
  }, [getPostTags, open])

  const handleSubmit = async () => {
    const trimmedTitle = title.trim()

    if (!trimmedTitle || !content) {
      emitToast({
        title: 'Error',
        description: 'Please fill in all fields',
      })
      return
    }

    setIsSubmitting(true)

    if (isEditing && post) {
      // Edit mode
      const result = await updatePost(post.id, {
        title: trimmedTitle,
        content: content,
        type: postType,
        isPrivate,
        tagIds: selectedTagIds,
      })

      if (result.data) {
        emitToast({
          title: 'Success',
          description: 'Post updated successfully',
        })
        onPostUpdated?.()
        setOpen(false)
      }
    } else {
      // Create mode
      const result = await createPost({
        title: trimmedTitle,
        content: content,
        type: postType,
        isPrivate,
        tagIds: selectedTagIds,
      })

      if (result.data?.postId) {
        navigate(`/post/${result.data.postId}`)
        setTitle('')
        setContent('')
        setPostType(PostType.QUESTION)
        setIsPrivate(false)
        setSelectedTagIds([])
        setOpen(false)
      }
    }

    setIsSubmitting(false)
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="max-h-[90vh] max-w-xs overflow-y-auto sm:max-h-[80vh] sm:max-w-md md:max-w-lg lg:max-w-xl xl:max-w-2xl">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? 'Edit Post' : 'Create New Post'}
          </DialogTitle>
        </DialogHeader>

        <VFlex className="gap-4 py-4">
          <HFlex className="flex-wrap gap-2">
            <Button
              variant={postType === PostType.QUESTION ? 'default' : 'outline'}
              onClick={() => setPostType(PostType.QUESTION)}
            >
              Ask Question
            </Button>
            <Button
              variant={postType === PostType.FEEDBACK ? 'default' : 'outline'}
              onClick={() => setPostType(PostType.FEEDBACK)}
            >
              Feedback Request
            </Button>
            <Button
              variant={postType === PostType.GENERAL ? 'default' : 'outline'}
              onClick={() => setPostType(PostType.GENERAL)}
            >
              Post Anything
            </Button>
          </HFlex>

          <VFlex className="gap-4">
            <VFlex className="gap-2">
              <Label htmlFor="title">Title</Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder={
                  postType === PostType.QUESTION
                    ? 'What would you like to ask?'
                    : postType === PostType.FEEDBACK
                      ? 'What feedback do you have?'
                      : 'What would you like to post?'
                }
              />
            </VFlex>

            <VFlex className="gap-2">
              <Label htmlFor="description">Description</Label>
              <MarkdownEditor
                value={content}
                onChange={(markdownValue) => {
                  setContent(markdownValue)
                }}
                placeholder="Provide more details..."
                className="min-h-[120px]"
              />
            </VFlex>

            {postType === PostType.QUESTION && (
              <HFlex className="items-center gap-2">
                <Switch
                  id="private"
                  checked={isPrivate}
                  onCheckedChange={setIsPrivate}
                />
                <Label htmlFor="private">
                  Private question (only visible to moderators)
                </Label>
              </HFlex>
            )}

            <VFlex className="gap-2">
              <Label htmlFor="post-tag">Tag</Label>
              <PostTagMultiSelect
                values={selectedTagIds}
                setValues={(values) => setSelectedTagIds(values || [])}
                options={tags}
              />
            </VFlex>

            <LoadingButton
              className="w-full"
              onClick={handleSubmit}
              loading={isSubmitting}
              disabled={!title.trim() || !content.trim()}
            >
              {isEditing
                ? 'Update Post'
                : postType === PostType.QUESTION
                  ? 'Post Question'
                  : postType === PostType.FEEDBACK
                    ? 'Submit Feedback'
                    : 'Submit Post'}
            </LoadingButton>
          </VFlex>
        </VFlex>
      </DialogContent>
    </Dialog>
  )
}
