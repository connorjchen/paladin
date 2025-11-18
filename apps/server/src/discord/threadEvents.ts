import { Client, AnyThreadChannel } from 'discord.js'
import prisma from '../prisma/client'
import { captureDiscordError, upsertDiscordThread } from '.'

export function setupThreadEvents(discordClient: Client) {
  discordClient.on('threadCreate', async (thread: AnyThreadChannel) => {
    try {
      await upsertDiscordThread(thread)
    } catch (error) {
      await captureDiscordError('threadCreate', error, {
        thread,
      })
    }
  })

  discordClient.on(
    'threadUpdate',
    async (oldThread: AnyThreadChannel, newThread: AnyThreadChannel) => {
      try {
        await upsertDiscordThread(newThread)
      } catch (error) {
        await captureDiscordError('threadUpdate', error, {
          oldThread,
          newThread,
        })
      }
    }
  )

  discordClient.on('threadDelete', async (thread: AnyThreadChannel) => {
    try {
      const exists = await prisma.discordThread.findUnique({
        where: { id: thread.id },
      })
      if (exists) {
        // Post deleted via cascade
        await prisma.discordThread.delete({
          where: { id: thread.id },
        })
      }
    } catch (error) {
      await captureDiscordError('threadDelete', error, {
        thread,
      })
    }
  })
}
