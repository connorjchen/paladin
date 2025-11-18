import {
  CacheType,
  ChannelType,
  ChatInputCommandInteraction,
  Collection,
  ForumChannel,
  GuildMember,
  Message,
  NonThreadGuildBasedChannel,
} from 'discord.js'
import prisma from '../prisma/client'
import {
  upsertDiscordUser,
  upsertDiscordThread,
  upsertDiscordMessage,
  updateDiscordGuild,
  upsertDiscordChannel,
  requireCommunityLinked,
} from '.'
import { discordClient } from '../clients'
import { BasicCommunity, simpleHash } from '@paladin/shared'
import pLimit from 'p-limit'

export async function handleConnectCommunity(
  interaction: ChatInputCommandInteraction<CacheType>
) {
  if (!interaction.guild) {
    await interaction.reply({
      content: 'This command can only be used in a server',
    })
    return
  }

  const communityDomain =
    interaction.options.getString('community_domain') || ''
  const secretKey = interaction.options.getString('secret_key') || ''

  const community = await prisma.community.findUnique({
    where: {
      domain: communityDomain,
    },
    include: {
      discordGuild: true,
    },
  })

  if (!community) {
    await interaction.reply({
      content: `Community not found with domain ${communityDomain}`,
    })
    return
  }
  if (simpleHash(community.id) !== secretKey) {
    await interaction.reply({
      content: 'Invalid secret key',
    })
    return
  }

  if (community.discordGuild) {
    await interaction.reply({
      content:
        'This community is already linked to a Discord server. If you would like to link it to a different Discord server, please unlink it first in the Paladin settings.',
    })
    return
  }

  // Create guild
  await prisma.discordGuild.create({
    data: {
      id: interaction.guild.id,
      name: interaction.guild.name,
      icon: interaction.guild.icon,
      communityId: community.id,
    },
  })
  // Sync rest of data
  await handleSync(interaction)
}

export async function handleSync(
  interaction: ChatInputCommandInteraction<CacheType>
) {
  await interaction.deferReply()
  await interaction.editReply('Syncing guild data...')

  const guild = interaction.guild
  if (!guild) {
    await interaction.editReply({
      content: 'This command can only be used in a server',
    })
    return
  }

  let community: BasicCommunity
  try {
    community = await requireCommunityLinked(guild.id)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (error: any) {
    await interaction.editReply({
      content: error.message,
    })
    return
  }

  try {
    // Sync guild
    await interaction.editReply('🔍 Fetching guilds...')
    await updateDiscordGuild(guild)

    // Sync all forum channels
    await interaction.editReply('🔍 Fetching forum channels...')
    const allChannels = await guild.channels.fetch()
    const forumChannels = allChannels.filter(
      (channel): channel is NonThreadGuildBasedChannel =>
        typeof channel === 'object' &&
        channel !== null &&
        'type' in channel &&
        (channel as NonThreadGuildBasedChannel).type === ChannelType.GuildForum
    ) as Collection<string, ForumChannel>

    await interaction.editReply(
      `📁 Found ${forumChannels.size} forum channels. Syncing channels...`
    )
    for (const channel of forumChannels.values()) {
      await upsertDiscordChannel(channel)
    }

    // Sync all users
    await interaction.editReply('👥 Syncing users...')

    // Paginate through all members
    let after: string | undefined = undefined
    const batchSize = 1000
    let fetchedCount = 0
    let totalUsersProcessed = 0

    do {
      const options: {
        limit: number
        after?: string
      } = { limit: batchSize }
      if (after) options.after = after
      const members = await guild.members.list(options)
      fetchedCount = members.size

      // Batch upsert
      await Promise.all(
        Array.from(members.values()).map((member: GuildMember) =>
          upsertDiscordUser(member.user)
        )
      )

      if (fetchedCount > 0) {
        after = Array.from(members.values())[members.size - 1]?.id
        totalUsersProcessed += fetchedCount
        await interaction.editReply(`👥 Synced ${totalUsersProcessed} users...`)
      }
    } while (fetchedCount === batchSize)

    // Sync all threads
    let totalThreads = 0
    let totalMessages = 0
    const errors: string[] = []

    for (const [, forumChannel] of forumChannels) {
      try {
        const {
          totalThreads: channelTotalThreads,
          totalMessages: channelTotalMessages,
          errors: channelErrors,
        } = await handleSyncChannel(forumChannel.id, interaction)
        totalThreads += channelTotalThreads
        totalMessages += channelTotalMessages
        errors.push(...channelErrors)
      } catch (channelError: unknown) {
        errors.push(
          `Failed to process forum channel ${forumChannel.id}: ${channelError}`
        )
      }
    }

    await interaction.editReply('✅ Sync completed! Preparing summary...')

    // Prepare response, truncate to 2000 chars max
    let response = `✅ Sync completed!\n\n📊 **Summary:**\n• Forum channels synced: ${forumChannels.size}\n• Threads processed: ${totalThreads}\n• Messages synced: ${totalMessages}\n• Users synced: ${totalUsersProcessed}`

    if (errors.length > 0) {
      response += `\n\n⚠️ **Errors encountered:**\n${errors
        .slice(0, 5)
        .map((err) => `• ${err}`)
        .join('\n')}`
      if (errors.length > 5) {
        response += `\n... and ${errors.length - 5} more errors`
      }
    }

    if (response.length > 2000) {
      response = response.slice(0, 1997) + '...'
    }

    response += `\n\n🔗 [Manage Discord Integration](https://community.trypaladin.com/s/${community.domain}/settings#discord)`

    if (interaction.replied) {
      await interaction.followUp({ content: response })
    } else {
      await interaction.reply({ content: response })
    }
  } catch (error) {
    await interaction.editReply(`❌ Sync failed: ${error}`)
    throw error
  }
}

export async function handleSyncChannel(
  forumChannelId: string,
  interaction?: ChatInputCommandInteraction<CacheType>
): Promise<{ totalThreads: number; totalMessages: number; errors: string[] }> {
  let totalThreads = 0
  let totalMessages = 0
  const errors: string[] = []

  // Use p-limit to control concurrency for threads and messages
  const threadLimit = pLimit(2)
  const messageLimit = pLimit(3)

  const discordChannel = await prisma.discordChannel.findUniqueOrThrow({
    where: { id: forumChannelId },
  })

  if (!discordChannel.shouldSync) {
    return { totalThreads, totalMessages, errors }
  }

  const forumChannel = await discordClient.channels.fetch(forumChannelId)
  if (!forumChannel || !(forumChannel instanceof ForumChannel)) {
    throw new Error('Forum channel not found')
  }

  await interaction?.editReply(
    `📝 Processing forum channel: ${forumChannel.name}...`
  )

  // Get all threads in this forum
  const threads = await forumChannel.threads.fetchActive()
  const archivedThreads = await forumChannel.threads.fetchArchived()

  const allThreads = [
    ...threads.threads.values(),
    ...archivedThreads.threads.values(),
  ]

  await interaction?.editReply(
    `📝 Found ${allThreads.length} threads in ${forumChannel.name}. Syncing threads and messages...`
  )

  // Process threads with concurrency limit
  await Promise.all(
    allThreads.map((thread) =>
      threadLimit(async () => {
        try {
          await upsertDiscordThread(thread)
          totalThreads++

          // Fetch all messages for this thread (pagination)
          const messages: Message[] = []
          let lastId: string | undefined = undefined
          while (true) {
            const fetched: Collection<string, Message> =
              await thread.messages.fetch({
                limit: 100,
                ...(lastId ? { before: lastId } : {}),
              })
            if (fetched.size === 0) break
            messages.push(...fetched.values())
            lastId = (Array.from(fetched.values()).pop() as Message | undefined)
              ?.id
            if (fetched.size < 100) break
          }
          messages.sort((a, b) => a.createdTimestamp - b.createdTimestamp)

          // Process messages with concurrency limit
          await Promise.all(
            messages.map((message) =>
              messageLimit(async () => {
                try {
                  await upsertDiscordMessage(discordClient, message)
                  totalMessages++
                } catch (messageError: any) {
                  if (messageError.code === 10008) {
                    console.log(`Message ${message.id} not found -- skipping`)
                  } else {
                    errors.push(
                      `Failed to sync message ${message.id}: ${messageError}`
                    )
                  }
                }
              })
            )
          )
        } catch (threadError: any) {
          if (threadError.code === 10008) {
            console.log(`Thread ${thread.id} not found -- skipping`)
          } else {
            errors.push(`Failed to sync thread ${thread.id}: ${threadError}`)
          }
        }
      })
    )
  )

  return { totalThreads, totalMessages, errors }
}
