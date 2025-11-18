import {
  ChannelType,
  Client,
  DMChannel,
  NonThreadGuildBasedChannel,
} from 'discord.js'
import prisma from '../prisma/client'
import { captureDiscordError, upsertDiscordChannel } from '.'

export function setupChannelEvents(discordClient: Client) {
  discordClient.on(
    'channelCreate',
    async (channel: NonThreadGuildBasedChannel) => {
      try {
        if (channel.type === ChannelType.GuildForum) {
          await upsertDiscordChannel(channel)
        }
      } catch (error) {
        await captureDiscordError('channelCreate', error, { channel })
      }
    }
  )

  discordClient.on(
    'channelUpdate',
    async (
      oldChannel: NonThreadGuildBasedChannel | DMChannel,
      newChannel: NonThreadGuildBasedChannel | DMChannel
    ) => {
      try {
        if (newChannel.type === ChannelType.GuildForum) {
          await upsertDiscordChannel(newChannel)
        }
      } catch (error) {
        await captureDiscordError('channelUpdate', error, {
          oldChannel,
          newChannel,
        })
      }
    }
  )

  discordClient.on(
    'channelDelete',
    async (channel: NonThreadGuildBasedChannel | DMChannel) => {
      try {
        if (channel.type === ChannelType.GuildForum) {
          const exists = await prisma.discordChannel.findUnique({
            where: { id: channel.id },
          })
          if (exists) {
            await prisma.discordChannel.delete({ where: { id: channel.id } })
          }
        }
      } catch (error) {
        await captureDiscordError('channelDelete', error, { channel })
      }
    }
  )
}
