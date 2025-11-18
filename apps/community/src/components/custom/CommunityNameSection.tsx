import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { VFlex } from '@/components/custom/VFlex'
import { HFlex } from '@/components/custom/HFlex'
import { LoadingButton } from '@/components/custom/LoadingButton'
import { P2 } from '@/components/custom/Text'

export interface CommunityNameSectionProps {
  communityName: string
  currentName: string | undefined
  isLoading: boolean
  onNameChange: (name: string) => void
  onSave: () => void
}

export function CommunityNameSection({
  communityName,
  currentName,
  isLoading,
  onNameChange,
  onSave,
}: CommunityNameSectionProps) {
  return (
    <VFlex className="gap-2">
      <Label htmlFor="community-name">Community Name</Label>
      <P2 muted>
        This is used for SEO purposes and the title shown on the login page.
      </P2>
      <HFlex className="gap-2">
        <Input
          value={communityName}
          onChange={(e) => onNameChange(e.target.value)}
          placeholder="Enter community name"
          className="w-64"
        />
        <LoadingButton
          onClick={onSave}
          loading={isLoading}
          disabled={!communityName.trim() || communityName === currentName}
          size="sm"
        >
          Save
        </LoadingButton>
      </HFlex>
    </VFlex>
  )
}
