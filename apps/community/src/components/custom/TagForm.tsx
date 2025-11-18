import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { HFlex } from '@/components/custom/HFlex'
import { ColorInput } from '@/components/custom/ColorInput'

interface TagFormProps {
  newTag: { name: string; color: string }
  onNewTagChange: (tag: { name: string; color: string }) => void
  onSubmit: () => void
  loading: boolean
}

export function TagForm({
  newTag,
  onNewTagChange,
  onSubmit,
  loading,
}: TagFormProps) {
  return (
    <HFlex className="gap-2">
      <Input
        className="w-64"
        placeholder="Name"
        value={newTag.name}
        onChange={(e) => onNewTagChange({ ...newTag, name: e.target.value })}
        disabled={loading}
      />
      <ColorInput
        value={newTag.color}
        onChange={(color) => onNewTagChange({ ...newTag, color })}
        disabled={loading}
      />
      <Button onClick={onSubmit} disabled={loading}>
        Add
      </Button>
    </HFlex>
  )
}
