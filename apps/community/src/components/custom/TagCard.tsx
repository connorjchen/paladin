import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { HFlex } from '@/components/custom/HFlex'
import { P2 } from '@/components/custom/Text'
import { ColoredBadge } from '@/components/custom/ColoredBadge'
import { ColorInput } from '@/components/custom/ColorInput'
import { DetailedPostTag } from '@paladin/shared'
import { pluralize } from '@/lib/utils'
import { Badge } from '../ui/badge'

interface TagCardProps {
  tag: DetailedPostTag
  editingId: string | null
  editTag: { name: string; color: string }
  onEditTagChange: (tag: { name: string; color: string }) => void
  onEdit: (id: string) => void
  onEditSave: (id: string) => void
  onEditCancel: () => void
  onDelete: (tag: DetailedPostTag) => void
  loading: boolean
}

export function TagCard({
  tag,
  editingId,
  editTag,
  onEditTagChange,
  onEdit,
  onEditSave,
  onEditCancel,
  onDelete,
  loading,
}: TagCardProps) {
  const isEditing = editingId === tag.id

  return (
    <Card className="p-4">
      <HFlex className="items-center justify-between gap-2">
        {isEditing ? (
          <HFlex className="w-full gap-2">
            <Input
              className="w-1/2"
              value={editTag.name}
              onChange={(e) =>
                onEditTagChange({ ...editTag, name: e.target.value })
              }
              placeholder="Name"
              disabled={loading || !!tag.discordTagId}
              style={{ maxWidth: 160 }}
            />
            <ColorInput
              value={editTag.color}
              onChange={(color) => onEditTagChange({ ...editTag, color })}
              disabled={loading}
            />
          </HFlex>
        ) : (
          <HFlex className="items-center gap-2">
            <ColoredBadge color={tag.color} name={tag.name} />
            <P2 muted>{pluralize(tag._count?.posts ?? 0, 'post')}</P2>
            {tag.discordTagId && <Badge variant="discord">via Discord</Badge>}
          </HFlex>
        )}
        <HFlex className="gap-2">
          <Button
            size="sm"
            variant="secondary"
            onClick={isEditing ? onEditCancel : () => onEdit(tag.id)}
            disabled={loading}
          >
            {isEditing ? 'Cancel' : 'Edit'}
          </Button>
          <Button
            size="sm"
            variant={isEditing ? 'default' : 'destructive'}
            onClick={isEditing ? () => onEditSave(tag.id) : () => onDelete(tag)}
            disabled={loading}
          >
            {isEditing ? 'Save' : 'Delete'}
          </Button>
        </HFlex>
      </HFlex>
    </Card>
  )
}
