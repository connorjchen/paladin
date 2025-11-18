import {
  Client,
  DMChannel,
  Message,
  NewsChannel,
  OmitPartialGroupDMChannel,
  PartialDMChannel,
  PartialMessage,
  StageChannel,
  TextChannel,
  PublicThreadChannel,
  PrivateThreadChannel,
  VoiceChannel,
} from 'discord.js'
import prisma from '../prisma/client'
import { captureDiscordError, upsertDiscordMessage, isForumMessage } from '.'

export function setupMessageEvents(discordClient: Client) {
  discordClient.on('messageCreate', async (message: Message) => {
    try {
      await upsertDiscordMessage(discordClient, message)
    } catch (error) {
      await captureDiscordError('messageCreate', error, {
        message,
      })
    }
  })

  discordClient.on(
    'messageUpdate',
    async (
      oldMessage: OmitPartialGroupDMChannel<Message<boolean> | PartialMessage>,
      newMessage: OmitPartialGroupDMChannel<Message<boolean> | PartialMessage>
    ) => {
      try {
        await upsertDiscordMessage(discordClient, newMessage)
      } catch (error) {
        await captureDiscordError('messageUpdate', error, {
          oldMessage,
          newMessage,
        })
      }
    }
  )

  discordClient.on(
    'messageDelete',
    async (
      message: OmitPartialGroupDMChannel<Message<boolean> | PartialMessage>
    ) => {
      try {
        if (!isForumMessage(message)) {
          return
        }

        if (!message.guildId) {
          return
        }

        const discordMessage = await prisma.discordMessage.findUnique({
          where: { id: message.id },
          select: {
            _count: {
              select: { children: true },
            },
          },
        })

        if (!discordMessage) {
          return
        }

        // If comment has children, update it to indicate it has been deleted
        // Otherwise, delete the comment outright
        if (discordMessage._count.children > 0) {
          await prisma.discordMessage.update({
            where: { id: message.id },
            data: {
              content: 'This comment has been deleted',
            },
          })
        } else {
          const exists = await prisma.discordMessage.findUnique({
            where: { id: message.id },
          })
          if (exists) {
            // Post deleted via cascade
            await prisma.discordMessage.delete({
              where: { id: message.id },
            })
          }
        }
      } catch (error) {
        // Try to fetch channel for error reporting if not present
        let channel = message.channel
        if (!channel && message.channelId) {
          try {
            const fetchedChannel = await discordClient.channels.fetch(
              message.channelId
            )
            if (fetchedChannel && fetchedChannel.isTextBased?.()) {
              channel = fetchedChannel as
                | DMChannel
                | PartialDMChannel
                | NewsChannel
                | StageChannel
                | TextChannel
                | PublicThreadChannel<boolean>
                | PrivateThreadChannel
                | VoiceChannel
            }
          } catch (error) {
            console.log('Failed to fetch channel:', error)
          }
        }
        await captureDiscordError('messageDelete', error, {
          message,
        })
      }
    }
  )
}
