import { BasicDiscordMessageAttachment } from '@paladin/shared'
import { Card } from '../ui/card'
import { P1 } from './Text'
import { ButtonIcon } from './ButtonIcon'
import { ExternalLink } from 'lucide-react'
import { getR2Url } from '@/lib/utils'
import { HFlex } from './HFlex'
import { VFlex } from './VFlex'
import { ImagesGrid } from './ImagesGrid'

interface DiscordMessageAttachmentsProps {
  attachments: BasicDiscordMessageAttachment[]
}

export function DiscordMessageAttachments({
  attachments,
}: DiscordMessageAttachmentsProps) {
  const images = attachments.filter((attachment) =>
    attachment.contentType?.startsWith('image/')
  )
  const nonImages = attachments.filter(
    (attachment) => !attachment.contentType?.startsWith('image/')
  )

  if (attachments.length === 0) return null

  return (
    <VFlex className="gap-2">
      {images.length > 0 && (
        <ImagesGrid
          images={images.map((attachment) => ({
            src: getR2Url(attachment.attachmentR2Key),
            alt: attachment.name || 'Image',
          }))}
        />
      )}
      {nonImages.map((attachment) => (
        <Card
          key={attachment.id}
          className="flex items-center justify-between p-4"
        >
          <P1>{attachment.name}</P1>
          <HFlex className="items-center gap-2">
            <ButtonIcon
              variant="ghost"
              onClick={() => {
                window.open(getR2Url(attachment.attachmentR2Key), '_blank')
              }}
            >
              <ExternalLink className="h-4 w-4" />
            </ButtonIcon>
          </HFlex>
        </Card>
      ))}
    </VFlex>
  )
}
