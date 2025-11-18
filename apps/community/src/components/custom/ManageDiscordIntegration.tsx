import { VFlex } from '@/components/custom/VFlex'
import { H2, H3, P2 } from './Text'
import { useCommunityStore } from '@/stores/community'
import { DiscordInstallButton } from './DiscordInstallButton'
import {
  DetailedDiscordChannel,
  DetailedPostTag,
  simpleHash,
} from '@paladin/shared'
import { DiscordChannelCard } from './DiscordChannelCard'
import { useEffect, useState } from 'react'
import { useDiscordStore } from '@/stores/discord'
import { usePostTagStore } from '@/stores/postTag'
import { Loading } from './Loading'

export function ManageDiscordIntegration() {
  const { community } = useCommunityStore()
  const { getDiscordChannels } = useDiscordStore()
  const { getPostTags } = usePostTagStore()
  const [loading, setLoading] = useState(false)
  const [discordChannels, setDiscordChannels] = useState<
    DetailedDiscordChannel[]
  >([])
  const [postTags, setPostTags] = useState<DetailedPostTag[]>([])
  const isSetUp = !!community?.discordGuild
  const secretKey = simpleHash(community?.id || '')

  const populateDiscordChannels = () => {
    setLoading(true)
    getDiscordChannels().then((response) => {
      if (response.data) {
        setDiscordChannels(response.data.discordChannels)
      }
      setLoading(false)
    })
  }

  const populatePostTags = () => {
    getPostTags().then((response) => {
      if (response.data) {
        setPostTags(response.data.postTags)
      }
    })
  }

  useEffect(() => {
    populateDiscordChannels()
    populatePostTags()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <VFlex className="gap-4">
      <VFlex className="gap-2">
        <H2>Manage Discord Integration</H2>
        <P2 muted>
          The Discord integration allows you to ingest forum threads into your
          Paladin community.
        </P2>
      </VFlex>
      {!isSetUp && (
        <>
          <DiscordInstallButton
            communityDomain={community?.domain}
            secretKey={secretKey}
          />
          <VFlex className="gap-2">
            <H3>Requested Discord permissions</H3>
            <P2 muted>
              These allow the bot to index forum threads and respond to your
              commands.
            </P2>
            <ul className="text-foreground list-disc pl-6">
              <li>
                <strong>Create Invite</strong>: Create channel invites to allow
                webpage users to join the Discord server
              </li>
              <li>
                <strong>View Channels</strong>: See channels that the bot can
                index
              </li>
              <li>
                <strong>Send Messages</strong>: Reply with status and results to
                your command runs
              </li>
              <li>
                <strong>Send Messages in Threads</strong>: Post updates and
                answers in forum threads
              </li>
              <li>
                <strong>Create Public Threads</strong>: Start threads when
                needed to organize responses
              </li>
              <li>
                <strong>Manage Threads</strong>: Update thread state (tag/close)
                if configured to do so
              </li>
              <li>
                <strong>Embed Links</strong>: Share rich links and previews in
                bot responses
              </li>
              <li>
                <strong>Read Message History</strong>: Index past messages from
                selected channels
              </li>
              <li>
                <strong>Add Reactions</strong>: Acknowledge and mark processed
                items with reactions
              </li>
              <li>
                <strong>Use Application Commands</strong>: Enable slash commands
                like /connect
              </li>
            </ul>
          </VFlex>
        </>
      )}
      {isSetUp && (
        <VFlex className="gap-2">
          <H3>Forum Channels</H3>
          <P2 muted>Only forum channels are supported at the moment.</P2>
          <VFlex className="gap-4">
            {loading ? (
              <Loading />
            ) : discordChannels.length === 0 ? (
              // No channels
              <P2 muted>No channels</P2>
            ) : (
              discordChannels.map((channel) => (
                <DiscordChannelCard
                  key={channel.id}
                  channel={channel}
                  postTags={postTags}
                  onSuccessfulSave={populateDiscordChannels} // Refresh list of channels to reset saved state
                />
              ))
            )}
          </VFlex>
        </VFlex>
      )}
    </VFlex>
  )
}
