import {
  CacheType,
  ChatInputCommandInteraction,
  Client,
  Events,
  Interaction,
} from 'discord.js'
import {
  captureDiscordError,
  handleConnectCommunity,
  handleSync,
  sendReply,
} from '.'

export function setupInteractionEvents(discordClient: Client) {
  discordClient.on(
    Events.InteractionCreate,
    async (interaction: Interaction<CacheType>) => {
      try {
        if (!interaction.isChatInputCommand()) return
        const commandInteraction =
          interaction as ChatInputCommandInteraction<CacheType>

        if (commandInteraction.commandName === 'connect') {
          await handleConnectCommunity(commandInteraction)
        }

        if (commandInteraction.commandName === 'sync') {
          await handleSync(commandInteraction)
        }
      } catch (error) {
        const errorMsg = (
          err: any // eslint-disable-line @typescript-eslint/no-explicit-any
        ) =>
          `${err?.message ? `\nError: ${err.message}` : 'An error occurred while processing your command.'}\n\nPlease reach out to Paladin support at community.trypaladin.com.`
        await sendReply(interaction, errorMsg(error))

        await captureDiscordError('interactionCreate', error, {
          interaction,
        })
      }
    }
  )
}
