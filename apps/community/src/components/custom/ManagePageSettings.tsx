import { useState } from 'react'
import { VFlex } from '@/components/custom/VFlex'
import { H3, P2 } from '@/components/custom/Text'
import { Card } from '../ui/card'
import { HFlex } from './HFlex'
import { Label } from '../ui/label'
import { Switch } from '../ui/switch'
import { useCommunityStore } from '@/stores/community'
import { ConfirmationDialog } from './ConfirmationDialog'

export function ManagePageSettings() {
  const { community, updateCommunity, getCommunity } = useCommunityStore()
  const [confirmDialog, setConfirmDialog] = useState<{
    open: boolean
    title: string
    description: string
    onConfirm: () => void
  }>({
    open: false,
    title: '',
    description: '',
    onConfirm: () => {
      // Empty function
    },
  })

  if (!community) return null

  const handleRoadmapToggle = () => {
    const isCurrentlyEnabled = community.isRoadmapEnabled
    setConfirmDialog({
      open: true,
      title: isCurrentlyEnabled ? 'Disable Roadmap?' : 'Enable Roadmap?',
      description: isCurrentlyEnabled
        ? 'This will remove the roadmap tab from the sidebar and the /roadmap page. This action is reversible.'
        : 'This will add the roadmap tab to the sidebar and enable the /roadmap page. This action is reversible.',
      onConfirm: async () => {
        await updateCommunity({ isRoadmapEnabled: !isCurrentlyEnabled })
        await getCommunity()
        setConfirmDialog((prev) => ({ ...prev, open: false }))
      },
    })
  }

  const handleSubmissionsToggle = () => {
    const isCurrentlyEnabled = community.isWebpageSubmissionsEnabled
    setConfirmDialog({
      open: true,
      title: isCurrentlyEnabled
        ? 'Disable Webpage Submissions?'
        : 'Enable Webpage Submissions?',
      description: isCurrentlyEnabled
        ? 'This will remove the ability for users to submit posts and comments through the webpage. Only Discord submissions will be allowed. This action is reversible.'
        : 'This will enable the ability for users to submit posts and comments through the webpage. This action is reversible.',
      onConfirm: async () => {
        await updateCommunity({
          isWebpageSubmissionsEnabled: !isCurrentlyEnabled,
        })
        await getCommunity()
        setConfirmDialog((prev) => ({ ...prev, open: false }))
      },
    })
  }

  return (
    <VFlex className="gap-4">
      <H3>Page Settings</H3>

      <Card className="p-4">
        <VFlex className="gap-4">
          <VFlex className="gap-2">
            <HFlex className="gap-2">
              <Label>Roadmap Enabled</Label>
              <Switch
                checked={community.isRoadmapEnabled}
                onPointerDown={(e) => e.preventDefault()}
                onClick={handleRoadmapToggle}
              />
            </HFlex>
            <P2 muted>
              Enabling will add the roadmap tab on the sidebar and the /roadmap
              page, which is populated with feedback posts.
            </P2>
          </VFlex>
          <VFlex className="gap-2">
            <HFlex className="gap-2">
              <Label>Webpage Post and Comment Submissions Enabled</Label>
              <Switch
                checked={community.isWebpageSubmissionsEnabled}
                onPointerDown={(e) => e.preventDefault()}
                onClick={handleSubmissionsToggle}
              />
            </HFlex>
            <P2 muted>
              Enabling will allow users to submit posts and comments through the
              webpage. This can be disabled if you only want to allow posts and
              comments through Discord.
            </P2>
          </VFlex>
        </VFlex>
      </Card>

      <ConfirmationDialog
        open={confirmDialog.open}
        onOpenChange={(open) => setConfirmDialog((prev) => ({ ...prev, open }))}
        title={confirmDialog.title}
        description={confirmDialog.description}
        onConfirm={confirmDialog.onConfirm}
      />
    </VFlex>
  )
}
