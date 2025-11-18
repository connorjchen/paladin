import { Button } from '../ui/button'
import { CopyBlock } from './CopyBlock'
import { HFlex } from './HFlex'

interface DiscordInstallButtonProps {
  communityDomain?: string
  secretKey: string
}

export function DiscordInstallButton({
  communityDomain,
  secretKey,
}: DiscordInstallButtonProps) {
  const DISCORD_CLIENT_ID = import.meta.env.VITE_DISCORD_CLIENT_ID as string

  return (
    <div className="space-y-2">
      <ol className="text-foreground list-decimal space-y-2 pl-4 text-base">
        <li>
          <Button>
            <a
              href={`https://discord.com/oauth2/authorize?client_id=${DISCORD_CLIENT_ID}&permissions=328565083201&integration_type=0&scope=bot`}
              target="_blank"
              rel="noopener noreferrer"
            >
              Install Paladin Bot
            </a>
          </Button>
        </li>
        <li>
          In your Discord server, run{' '}
          <HFlex className="inline-flex gap-0">
            <code className="bg-muted rounded-l-lg px-2 py-1 text-sm">
              /connect community_domain=
            </code>
            <CopyBlock value={communityDomain ?? ''} />
            <code className="bg-muted px-2 py-1 text-sm">secret_key=</code>
            <CopyBlock value={secretKey} />
          </HFlex>
        </li>
      </ol>
    </div>
  )
}
