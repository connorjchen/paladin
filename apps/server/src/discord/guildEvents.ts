import { Client, Guild, GuildMember } from 'discord.js'
import {
  captureDiscordError,
  requireCommunityLinked,
  updateDiscordGuild,
  upsertDiscordUser,
} from '.'

// Guild create (bot added) and delete (bot removed) events are ignored
export function setupGuildEvents(discordClient: Client) {
  discordClient.on('guildUpdate', async (guild: Guild) => {
    try {
      await requireCommunityLinked(guild.id)
      await updateDiscordGuild(guild)
    } catch (error) {
      await captureDiscordError('guildUpdate', error, {
        guild,
      })
    }
  })

  discordClient.on('guildMemberAdd', async (member: GuildMember) => {
    try {
      await requireCommunityLinked(member.guild.id)
      await upsertDiscordUser(member.user)
    } catch (error) {
      await captureDiscordError('guildMemberAdd', error, { member })
    }
  })
}
