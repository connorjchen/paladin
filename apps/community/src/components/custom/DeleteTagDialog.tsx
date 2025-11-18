import { DetailedPostTag } from '@paladin/shared'
import { pluralize } from '@/lib/utils'
import { ConfirmationDialog } from './ConfirmationDialog'

interface DeleteTagDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  tagToDelete: DetailedPostTag | null
  onDelete: () => void
  loading: boolean
}

export function DeleteTagDialog({
  open,
  onOpenChange,
  tagToDelete,
  onDelete,
  loading,
}: DeleteTagDialogProps) {
  return (
    <ConfirmationDialog
      open={open}
      onOpenChange={onOpenChange}
      title="Delete Post Tag"
      description={`Are you sure you want to delete the post tag "${tagToDelete?.name}"? This tag is currently associated with ${pluralize(tagToDelete?._count?.posts ?? 0, 'post')}. This action cannot be undone.`}
      onConfirm={onDelete}
      loading={loading}
      confirmText="Delete Tag"
      variant="destructive"
    />
  )
}
