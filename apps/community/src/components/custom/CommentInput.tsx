import React from 'react'
import { VFlex } from './VFlex'
import { HFlex } from './HFlex'
import { MarkdownEditor } from './MarkdownEditor'
import { Button } from '@/components/ui/button'
import { P2 } from './Text'
import { useUserStore } from '@/stores/user'

interface CommentInputProps {
  comment: string
  replyingTo: { id: string; author: string } | null
  commentSubmitting: boolean
  onCommentChange: (markdownValue: string) => void
  onCommentSubmit: () => void
  onCancelReply: () => void
}

export function CommentInput({
  comment,
  replyingTo,
  commentSubmitting,
  onCommentChange,
  onCommentSubmit,
  onCancelReply,
}: CommentInputProps) {
  const { isAuthed } = useUserStore()

  return (
    <VFlex className="border-sidebar-border gap-2 border-t py-4">
      {replyingTo && (
        <HFlex className="gap-2">
          <P2 muted>Replying to {replyingTo.author}</P2>
          <Button variant="ghost" size="sm" onClick={onCancelReply}>
            Cancel
          </Button>
        </HFlex>
      )}
      {isAuthed ? (
        <>
          <MarkdownEditor
            value={comment}
            onChange={onCommentChange}
            placeholder={
              replyingTo
                ? `Reply to ${replyingTo.author}...`
                : 'Write a comment...'
            }
            onCmdEnter={onCommentSubmit}
          />
          <Button
            onClick={onCommentSubmit}
            className="w-fit self-end"
            disabled={commentSubmitting || !comment}
          >
            {replyingTo ? 'Reply' : 'Comment'} ⌘+Enter
          </Button>
        </>
      ) : (
        <P2 muted className="text-center">
          You must be logged in to comment
        </P2>
      )}
    </VFlex>
  )
}
