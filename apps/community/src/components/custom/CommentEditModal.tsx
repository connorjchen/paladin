import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../ui/dialog'
import { Button } from '../ui/button'
import { VFlex } from './VFlex'
import { useState, useEffect } from 'react'
import { useCommentStore } from '@/stores/comment'
import { emitToast } from '@/hooks/use-toast'
import { LoadingButton } from './LoadingButton'
import { MarkdownEditor } from './MarkdownEditor'
import { DetailedComment } from '@paladin/shared'
import { HFlex } from './HFlex'

interface CommentEditModalProps {
  open: boolean
  setOpen: (open: boolean) => void
  comment: DetailedComment | null
  onCommentUpdated?: () => void
}

export function CommentEditModal({
  open,
  setOpen,
  comment,
  onCommentUpdated,
}: CommentEditModalProps) {
  const { updateComment } = useCommentStore()
  const [content, setContent] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Initialize form with comment data when modal opens
  useEffect(() => {
    if (comment && open) {
      setContent(comment.content)
    }
  }, [comment, open])

  const handleSubmit = async () => {
    if (!comment) return

    if (!content.trim()) {
      emitToast({
        title: 'Error',
        description: 'Please enter some content',
      })
      return
    }

    setIsSubmitting(true)
    const result = await updateComment(comment.id, {
      content: content,
    })

    if (result.data?.commentId) {
      emitToast({
        title: 'Success',
        description: 'Comment updated successfully',
      })
      onCommentUpdated?.()
      setOpen(false)
    }

    setIsSubmitting(false)
  }

  if (!comment) return null

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Edit Comment</DialogTitle>
        </DialogHeader>

        <VFlex className="gap-4 py-4">
          <VFlex className="gap-2">
            <MarkdownEditor
              value={content}
              onChange={(markdownValue) => {
                setContent(markdownValue)
              }}
              placeholder="Edit your comment..."
            />
          </VFlex>

          <HFlex className="gap-2">
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => setOpen(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <LoadingButton
              className="flex-1"
              onClick={handleSubmit}
              loading={isSubmitting}
              disabled={!content.trim()}
            >
              Update Comment
            </LoadingButton>
          </HFlex>
        </VFlex>
      </DialogContent>
    </Dialog>
  )
}
