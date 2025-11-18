import { useState } from 'react'
import { Button } from '../ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { useCommunityStore } from '@/stores/community'

interface UnlinkDiscordModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function UnlinkDiscordModal({
  open,
  onOpenChange,
}: UnlinkDiscordModalProps) {
  const { community, updateCommunity, getCommunity } = useCommunityStore()
  const [loading, setLoading] = useState(false)

  const handleUnlink = async () => {
    setLoading(true)
    await updateCommunity({ discordGuildId: null })
    await getCommunity()
    setLoading(false)
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Unlink Discord Integration</DialogTitle>
          <DialogDescription>
            Are you sure you want to unlink the Discord integration? The bot
            will no longer be able to sync forum threads to this community.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button
            variant="secondary"
            onClick={() => onOpenChange(false)}
            disabled={loading}
          >
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={handleUnlink}
            disabled={loading}
          >
            Unlink Discord
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
