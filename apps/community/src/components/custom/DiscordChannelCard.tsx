import { Card } from '@/components/ui/card'
import { HFlex } from '@/components/custom/HFlex'
import { H3, P2 } from '@/components/custom/Text'
import { DetailedDiscordChannel, DetailedPostTag } from '@paladin/shared'
import { Label } from '../ui/label'
import { VFlex } from './VFlex'
import { Switch } from '../ui/switch'
import { PostTagMultiSelect } from './PostTagSelect'
import { LoadingButton } from './LoadingButton'
import { MessageCircleIcon } from 'lucide-react'
import { SearchableSelect } from './SearchableSelect'
import { useState } from 'react'
import { PostType } from '@prisma/client'
import { convertCapsToWords } from '@/lib/utils'
import { useDiscordStore } from '@/stores/discord'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '../ui/button'

interface DiscordChannelCardProps {
  channel: DetailedDiscordChannel
  postTags: DetailedPostTag[]
  onSuccessfulSave: () => void
}

export function DiscordChannelCard({
  channel,
  postTags,
  onSuccessfulSave,
}: DiscordChannelCardProps) {
  const [modifiedChannel, setModifiedChannel] =
    useState<DetailedDiscordChannel>(channel)
  const { updateDiscordChannel } = useDiscordStore()
  const [isSaving, setIsSaving] = useState(false)
  const [showConfirmModal, setShowConfirmModal] = useState(false)

  const handleSave = async () => {
    setIsSaving(true)
    await updateDiscordChannel(channel.id, {
      shouldSync: modifiedChannel.shouldSync,
      defaultPostType: modifiedChannel.defaultPostType,
      defaultPostTagId: modifiedChannel.defaultPostTagId || undefined,
    })
    setIsSaving(false)
    setShowConfirmModal(false)
    onSuccessfulSave()
  }

  return (
    <Card className="p-4">
      <VFlex className="gap-4">
        <HFlex className="items-center justify-between">
          <HFlex className="gap-1">
            <MessageCircleIcon className="h-4 w-4" />
            <HFlex className="gap-2">
              <H3>{channel.name}</H3>
              <P2 muted>({channel._count.threads} synced threads)</P2>
            </HFlex>
          </HFlex>
          <LoadingButton
            onClick={() => setShowConfirmModal(true)}
            loading={isSaving}
            disabled={
              modifiedChannel.name === channel.name &&
              modifiedChannel.shouldSync === channel.shouldSync &&
              modifiedChannel.defaultPostType === channel.defaultPostType &&
              modifiedChannel.defaultPostTagId === channel.defaultPostTagId
            }
          >
            Save
          </LoadingButton>
        </HFlex>
        <VFlex className="gap-2">
          <HFlex className="gap-2">
            <Label>Enabled</Label>
            <Switch
              checked={modifiedChannel.shouldSync}
              onCheckedChange={() => {
                setModifiedChannel({
                  ...modifiedChannel,
                  shouldSync: !modifiedChannel.shouldSync,
                })
              }}
            />
          </HFlex>
          <P2 muted>
            Enabling will sync posts from this channel. Disabling will stop
            syncing, but won't delete already synced posts.
          </P2>
        </VFlex>
        <VFlex className="gap-2">
          <Label> Default Post Type</Label>
          <P2 muted>
            All threads from this channel, including already synced threads,
            will have this post type.
          </P2>
          <SearchableSelect
            placeholderSelect="Select post type"
            placeholderSearch="Search post type"
            value={modifiedChannel.defaultPostType}
            setValue={(value) => {
              setModifiedChannel({
                ...modifiedChannel,
                defaultPostType: value as PostType,
              })
            }}
            options={Object.values(PostType).map((type) => ({
              value: type,
              label: convertCapsToWords(type),
            }))}
            className="w-fit"
          />
        </VFlex>
        <VFlex className="gap-2">
          <Label>Default Post Tag (optional)</Label>
          <P2 muted>
            All threads from this channel, including already synced threads,
            will have this post tag applied. A common use case to tag the name
            of the channel.
          </P2>
          <PostTagMultiSelect
            singleSelect
            placeholder="Select post tag"
            values={
              modifiedChannel.defaultPostTagId
                ? [modifiedChannel.defaultPostTagId]
                : []
            }
            setValues={(values) => {
              setModifiedChannel({
                ...modifiedChannel,
                defaultPostTagId: values[0],
              })
            }}
            options={postTags}
            className="w-64"
          />
        </VFlex>
      </VFlex>

      <Dialog open={showConfirmModal} onOpenChange={setShowConfirmModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Save Channel Settings</DialogTitle>
            <DialogDescription>
              Save changes to <b>{channel.name}</b>? This will update sync
              settings and default post configuration for all threads (
              <b>{channel._count?.threads ?? 0}</b> existing).
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="secondary"
              onClick={() => setShowConfirmModal(false)}
              disabled={isSaving}
            >
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={isSaving}>
              {isSaving ? 'Saving...' : 'Save Changes'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  )
}
