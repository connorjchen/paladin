import React from 'react'
import { ConfirmationDialog } from './ConfirmationDialog'

interface PostDeleteDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  deleting: boolean
  onConfirmDelete: () => void
}

export function PostDeleteDialog({
  open,
  onOpenChange,
  deleting,
  onConfirmDelete,
}: PostDeleteDialogProps) {
  return (
    <ConfirmationDialog
      open={open}
      onOpenChange={onOpenChange}
      title="Delete Post?"
      description="This action cannot be undone. Are you sure you want to delete this post?"
      onConfirm={onConfirmDelete}
      loading={deleting}
      confirmText={deleting ? 'Deleting...' : 'Delete'}
      variant="destructive"
    />
  )
}
