import { Client, REST, Routes, SlashCommandBuilder } from 'discord.js'
import { captureDiscordError } from '.'

const DISCORD_BOT_TOKEN = process.env.DISCORD_BOT_TOKEN

const connectCommunityCommand = new SlashCommandBuilder()
  .setName('connect')
  .setDescription('Connect a community to this Discord server')
  .addStringOption((option) =>
    option
      .setName('community_domain')
      .setDescription(
        'The community domain to connect (e.g., yourname.community.trypaladin.com)'
      )
      .setRequired(true)
  )
  .addStringOption((option) =>
    option
      .setName('secret_key')
      .setDescription(
        'The secret key from your Paladin settings (e.g., 27379419)'
      )
      .setRequired(true)
  )

const syncCommunityCommand = new SlashCommandBuilder()
  .setName('sync')
  .setDescription('Sync your community')

const commands = [
  connectCommunityCommand.toJSON(),
  syncCommunityCommand.toJSON(),
]

export function setupClientEvents(discordClient: Client) {
  discordClient.on('ready', async () => {
    try {
      console.log(`🤖 Discord bot logged in as ${discordClient.user?.tag}`)

      // Register slash commands
      if (!DISCORD_BOT_TOKEN) {
        throw new Error('DISCORD_BOT_TOKEN is not set')
      }

      if (!discordClient.user?.id) {
        throw new Error('Discord bot user ID is not set')
      }

      const rest = new REST({ version: '10' }).setToken(DISCORD_BOT_TOKEN)

      await rest.put(Routes.applicationCommands(discordClient.user.id), {
        body: commands,
      })
    } catch (error) {
      await captureDiscordError('ready', error, {
        user: discordClient.user,
      })
    }
  })
}
