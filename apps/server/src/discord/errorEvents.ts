import { Client } from 'discord.js'
import { captureDiscordError } from '.'

export function setupErrorEvents(discordClient: Client) {
  discordClient.on('error', async (error) => {
    await captureDiscordError('discordClientError', error, {})
  })

  discordClient.on('warn', async (warning) => {
    await captureDiscordError('discordWarning', warning, {})
  })
}
