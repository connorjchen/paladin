import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { FaDiscord } from 'react-icons/fa'

interface DiscordLinkButtonProps {
  guildId: string
  threadId: string
  messageId?: string
  className?: string
}

export function DiscordLinkButton({
  guildId,
  threadId,
  messageId,
  className,
}: DiscordLinkButtonProps) {
  const link = messageId
    ? `https://discord.com/channels/${guildId}/${threadId}/${messageId}`
    : `https://discord.com/channels/${guildId}/${threadId}`

  return (
    <Button variant="discord" size="icon" className={cn(className)} asChild>
      <a href={link} target="_blank" rel="noopener noreferrer">
        <FaDiscord />
      </a>
    </Button>
  )
}
