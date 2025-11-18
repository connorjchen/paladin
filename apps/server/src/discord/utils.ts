import {
  AnyThreadChannel,
  Attachment,
  ChannelType,
  Client,
  ForumChannel,
  Guild,
  GuildForumTag,
  Message,
  OmitPartialGroupDMChannel,
  PartialMessage,
  User,
} from 'discord.js'
import axios from 'axios'
import prisma from '../prisma/client'
import { discordClient, posthogClient, s3Client } from '../clients'
import {
  isProduction,
  indexAlgoliaPost,
  sendCommentNotification,
  sendAdminNotification,
  deleteR2Object,
} from '../utils'
import {
  BasicCommunity,
  DetailedDiscordThread,
  DetailedPost,
  DISCORD_BOT_USER_ID,
} from '@paladin/shared'
import path from 'path'
import mime from 'mime-types'
import {
  FeedbackStatus,
  PostType,
  QuestionStatus,
  UserRole,
} from '@prisma/client'
import { PutObjectCommand } from '@aws-sdk/client-s3'

const COMMUNITY_NOT_LINKED_ERROR_MESSAGE =
  'This Discord server is not linked to a Paladin community. Use /connect to link one.'

export async function captureDiscordError(
  eventName: string,
  error: unknown,
  additionalData: Record<string, unknown> = {}
) {
  const transformedError =
    error instanceof Error ? error : new Error(String(error))
  console.log('transformedError', transformedError)

  let isCriticalError = true

  if (transformedError.message === COMMUNITY_NOT_LINKED_ERROR_MESSAGE) {
    isCriticalError = false
  }

  if (transformedError.stack?.includes('DiscordAPIError[10008]')) {
    isCriticalError = false
  }

  if (isProduction()) {
    posthogClient.capture({
      distinctId: 'discord-bot',
      event: isCriticalError ? 'server-error' : 'server-non-critical-error',
      properties: {
        eventName,
        message: transformedError.message,
        stack: transformedError.stack,
        timestamp: new Date().toISOString(),
        ...additionalData,
      },
    })
  }
}

export async function sendReply(
  replyObject: any, // eslint-disable-line @typescript-eslint/no-explicit-any
  content: string
) {
  if (!replyObject) {
    return
  }

  try {
    try {
      await replyObject.reply?.({ content })
    } catch {
      try {
        await replyObject.send?.({ content })
      } catch {
        try {
          await replyObject.followUp?.({ content })
        } catch {
          try {
            await replyObject.editReply?.({ content })
          } catch {
            try {
              await replyObject.author?.send?.({ content })
            } catch {
              await replyObject.message?.reply?.({ content })
            }
          }
        }
      }
    }
  } catch (error) {
    console.error('Failed to send message:', error)
  }
}

export function isForumThread(thread: AnyThreadChannel): boolean {
  return thread.parent?.type === ChannelType.GuildForum
}

export function isForumMessage(
  message:
    | Message
    | OmitPartialGroupDMChannel<Message<boolean> | PartialMessage>
): boolean {
  const channel = message.channel
  // Ignore DM messages
  if (!channel || channel.isDMBased()) {
    return false
  }

  const isThread = channel.isThread?.()
  const isForumParent = channel.parent?.type === ChannelType.GuildForum
  return Boolean(isThread && isForumParent)
}

/**
 * Replace Discord user mentions like <@123> or <@!123> with @username.
 * Looks up usernames from the database via prisma.discordUser.
 * If any mentioned user is missing, logs an error and returns original content.
 */
export async function normalizeDiscordUserMentions(
  content: string
): Promise<string> {
  if (!content.includes('<@')) {
    return content
  }

  const mentionRegex = /<@!?([0-9]+)>/g
  const ids = new Set<string>()

  let match: RegExpExecArray | null
  while ((match = mentionRegex.exec(content)) !== null) {
    ids.add(match[1])
  }

  if (ids.size === 0) {
    return content
  }

  try {
    const users = await prisma.discordUser.findMany({
      where: { id: { in: Array.from(ids) } },
      select: { id: true, username: true },
    })

    const idToUsername = new Map(users.map((u) => [u.id, u.username]))

    const missingIds = Array.from(ids).filter((id) => !idToUsername.has(id))
    if (missingIds.length > 0) {
      await captureDiscordError(
        'normalizeDiscordUserMentions',
        new Error('Missing Discord users for mentions'),
        { missingIds }
      )
    }

    return content.replace(mentionRegex, (_full, id: string) => {
      const username = idToUsername.get(id)
      return username ? `@${username}` : `@${id}`
    })
  } catch (error) {
    await captureDiscordError('normalizeDiscordUserMentions', error, {
      content,
    })
    return content
  }
}

export async function requireCommunityLinked(
  guildId: string
): Promise<BasicCommunity> {
  const discordGuild = await prisma.discordGuild.findUnique({
    where: {
      id: guildId,
    },
    include: {
      community: true,
    },
  })

  if (!discordGuild) {
    const msg = COMMUNITY_NOT_LINKED_ERROR_MESSAGE
    throw new Error(msg)
  }

  return discordGuild.community
}

export async function blockingGetThread(
  threadId: string
): Promise<DetailedDiscordThread & { starterMessageId: string }> {
  let thread = null
  let attempt = 0
  const maxAttempts = 5
  while (!thread && attempt < maxAttempts) {
    thread = await prisma.discordThread.findUnique({
      where: {
        id: threadId,
      },
      include: {
        post: true,
      },
    })
    if (!thread) {
      const delay = Math.pow(2, attempt) * 100 // 100ms, 200ms, 400ms, 800ms, 1600ms
      await new Promise((res) => setTimeout(res, delay))
      attempt++
    }
  }

  // If still no thread found, create it
  if (!thread) {
    const discordThread = await discordClient.channels.fetch(threadId)
    await upsertDiscordThread(discordThread as AnyThreadChannel)
    thread = await prisma.discordThread.findUnique({
      where: {
        id: threadId,
      },
      include: {
        post: true,
      },
    })
  }

  if (!thread || !thread.post) {
    throw new Error('Thread or post not found')
  }

  return thread
}

// Assumes guild and channel are already created
export async function upsertDiscordThread(
  thread: AnyThreadChannel
): Promise<void> {
  if (!isForumThread(thread)) {
    return
  }

  const community = await requireCommunityLinked(thread.guildId)

  const starterMessage = await thread.fetchStarterMessage()

  if (!starterMessage) {
    throw new Error('Starter message not found')
  }

  if (!thread.parent?.id) {
    throw new Error('Thread parent channel not found')
  }

  // Upsert the user
  await upsertDiscordUser(starterMessage.author)

  // Normalize mentions in starter message content
  const normalizedStarterContent = await normalizeDiscordUserMentions(
    starterMessage.content
  )

  // Upsert tags
  const tags = (thread.parent as ForumChannel).availableTags
  for (const tag of tags) {
    await upsertDiscordTag(community.id, tag)
  }

  // DEBT: might be better to filter top-level outside this function
  const discordChannel = await prisma.discordChannel.findUniqueOrThrow({
    where: { id: thread.parent.id },
  })
  if (!discordChannel.shouldSync) {
    return
  }

  // Upsert the thread and post transactionally
  const post = await prisma.$transaction(async (tx) => {
    if (!thread.parent?.id) {
      throw new Error('Thread parent channel not found')
    }

    console.log('starterMessage.createdAt', starterMessage.createdAt)
    console.log('starterMessage.editedAt', starterMessage.editedAt)
    console.log(
      'starterCombined',
      starterMessage.editedAt ?? starterMessage.createdAt
    )

    await tx.discordThread.upsert({
      where: { id: thread.id },
      update: {
        channelId: thread.parent.id,
        title: thread.name,
        starterMessageId: starterMessage.id,
        starterMessageContent: normalizedStarterContent,
        authorId: starterMessage.author.id,
        createdAt: starterMessage.createdAt,
        updatedAt: starterMessage.editedAt ?? starterMessage.createdAt,
      },
      create: {
        id: thread.id,
        channelId: thread.parent.id,
        title: thread.name,
        starterMessageId: starterMessage.id,
        starterMessageContent: normalizedStarterContent,
        authorId: starterMessage.author.id,
        createdAt: starterMessage.createdAt,
        updatedAt: starterMessage.editedAt ?? starterMessage.createdAt,
      },
    })

    const existingPost = await tx.post.findUnique({
      where: { discordThreadId: thread.id },
    })

    // If new post or post type is different from default, set default statuses
    let statusUpdates:
      | {
          questionStatus: QuestionStatus | null
          feedbackStatus: FeedbackStatus | null
        }
      | undefined = {
      questionStatus:
        discordChannel.defaultPostType === PostType.QUESTION
          ? QuestionStatus.AWAITING_ADMIN_RESPONSE
          : null,
      feedbackStatus:
        discordChannel.defaultPostType === PostType.FEEDBACK
          ? FeedbackStatus.UNDER_REVIEW
          : null,
    }
    if (existingPost) {
      // If post already exists, don't overwrite statuses
      if (existingPost.type === discordChannel.defaultPostType) {
        statusUpdates = {
          questionStatus: existingPost.questionStatus,
          feedbackStatus: existingPost.feedbackStatus,
        }
      }
    }

    return tx.post.upsert({
      where: { discordThreadId: thread.id },
      update: {
        title: thread.name,
        content: normalizedStarterContent,
        type: discordChannel.defaultPostType,
        createdAt: starterMessage.createdAt,
        updatedAt: starterMessage.editedAt ?? starterMessage.createdAt,
        ...statusUpdates,
      },
      create: {
        title: thread.name,
        content: normalizedStarterContent,
        type: discordChannel.defaultPostType,
        communityId: community.id,
        authorId: DISCORD_BOT_USER_ID,
        private: false,
        discordThreadId: thread.id,
        createdAt: starterMessage.createdAt,
        updatedAt: starterMessage.editedAt ?? starterMessage.createdAt,
        ...statusUpdates,
      },
    })
  })

  // Upsert the starter message attachments
  await upsertDiscordMessageAttachments(
    null,
    starterMessage.id,
    Array.from(starterMessage.attachments.values())
  )

  const postTags = await prisma.postTag.findMany({
    where: {
      communityId: community.id,
      discordTagId: { in: thread.appliedTags },
    },
    select: { id: true },
  })
  if (discordChannel.defaultPostTagId) {
    postTags.push({ id: discordChannel.defaultPostTagId })
  }

  // Upsert the post tag relationships transactionally
  await prisma.$transaction(async (tx) => {
    await tx.postTagOnPost.deleteMany({ where: { postId: post.id } })

    if (postTags.length) {
      await tx.postTagOnPost.createMany({
        data: postTags.map(({ id }) => ({ postId: post.id, tagId: id })),
        skipDuplicates: true,
      })
    }
  })

  await indexAlgoliaPost(post)
}

// Assumes guild and channel are already created
export async function upsertDiscordMessage(
  discordClient: Client,
  message:
    | Message
    | OmitPartialGroupDMChannel<Message<boolean> | PartialMessage>
): Promise<void> {
  // Assertions
  if (!message.guildId || message.content === null || !message.author) {
    return
  }

  // Ignore messages from the bot itself
  if (message.author.id === discordClient.user?.id) {
    return
  }

  // Ignore system messages
  if (message.system) {
    return
  }

  if (!isForumMessage(message)) {
    return
  }

  const community = await requireCommunityLinked(message.guildId)

  // TODO: this logic is really ugly
  let parentChannelId
  if (message.channel.isThread()) {
    parentChannelId = message.channel.parentId
  }
  if (!parentChannelId) {
    throw new Error('Parent channel ID not found')
  }
  // DEBT: might be better to filter top-level outside this function
  const discordChannel = await prisma.discordChannel.findUniqueOrThrow({
    where: { id: parentChannelId },
  })
  if (!discordChannel.shouldSync) {
    return
  }

  // For thread starter messages, defer to upsertDiscordThread
  if (message.id === message.channel.id) {
    // This will actually double trigger upsertDiscordThread on thread creation (affecting edited flag)
    const thread = await discordClient.channels.fetch(message.channel.id)
    await upsertDiscordThread(thread as AnyThreadChannel)
    return
  }

  // Upsert the user
  await upsertDiscordUser(message.author)

  // Get or upsert the thread
  const thread = await blockingGetThread(message.channel.id)

  if (!thread.post) {
    throw new Error('Thread post not found')
  }

  // If post is a question in AWAITING_USER_RESPONSE and message author is OP, update it to AWAITING_ADMIN_RESPONSE
  // NOTE: We don't currently sync Paladin users with Discord users, so we can't tell if a Discord user is an admin or not
  if (
    thread.post.questionStatus === QuestionStatus.AWAITING_USER_RESPONSE &&
    thread.authorId === message.author.id
  ) {
    const post: DetailedPost = await prisma.post.update({
      where: { id: thread.post.id },
      data: { questionStatus: QuestionStatus.AWAITING_ADMIN_RESPONSE },
      include: {
        author: true,
        discordThread: {
          include: {
            channel: true,
            author: true,
            starterMessageAttachments: true,
          },
        },
        postTags: {
          include: {
            tag: true,
          },
        },
        comments: {
          include: {
            author: true,
            discordMessage: {
              include: {
                author: true,
                attachments: true,
              },
            },
          },
        },
        _count: {
          select: {
            comments: true,
            upvotes: true,
          },
        },
      },
    })
    await sendAdminNotificationToAllAdmins(community, post)
  }

  // If parent message is from bot, system, or is the thread starter message, ignore it (set it to null)
  if (message.reference?.messageId) {
    const referenced = await message.channel.messages.fetch(
      message.reference.messageId
    )

    // If parent message is from system, ignore it
    if (referenced.system) {
      message.reference = null
    }

    // If parent message is the thread starter message, ignore it
    if (referenced.id === thread.starterMessageId) {
      message.reference = null
    }

    // If parent message is from bot, only ignore if not in system (we want to avoid replies on syncs or error messages, but allow on real bot messages from Paladin users)
    if (referenced.author.id === discordClient.user?.id) {
      const existsInSystem = await prisma.comment.findUnique({
        where: { discordMessageId: referenced.id },
      })
      if (!existsInSystem) {
        message.reference = null
      }
    }
  }

  // Normalize mentions in message content
  const normalizedContent = await normalizeDiscordUserMentions(message.content)

  // Upsert the message
  await prisma.discordMessage.upsert({
    where: { id: message.id },
    update: {
      threadId: message.channel.id,
      content: normalizedContent,
      authorId: message.author.id,
      parentId: message.reference?.messageId ?? null,
      createdAt: message.createdAt,
      updatedAt: message.editedAt ?? message.createdAt,
    },
    create: {
      id: message.id,
      threadId: message.channel.id,
      content: normalizedContent,
      authorId: message.author.id,
      parentId: message.reference?.messageId ?? null,
      createdAt: message.createdAt,
      updatedAt: message.editedAt ?? message.createdAt,
    },
  })

  // Upsert the starter message attachments
  await upsertDiscordMessageAttachments(
    message.id,
    null,
    Array.from(message.attachments.values())
  )

  // Get parent comment if exists
  let parentCommentId: string | null = null
  if (message.reference?.messageId) {
    const parentComment = await prisma.comment.findUnique({
      where: { discordMessageId: message.reference.messageId },
    })
    parentCommentId = parentComment?.id ?? null
  }

  // Upsert the comment
  const comment = await prisma.comment.upsert({
    where: { discordMessageId: message.id },
    update: {
      content: normalizedContent,
      authorId: DISCORD_BOT_USER_ID,
      parentId: parentCommentId,
      postId: thread.post.id,
      createdAt: message.createdAt,
      updatedAt: message.editedAt ?? message.createdAt,
    },
    create: {
      id: message.id,
      content: normalizedContent,
      authorId: DISCORD_BOT_USER_ID,
      parentId: parentCommentId,
      postId: thread.post.id,
      discordMessageId: message.id,
      createdAt: message.createdAt,
      updatedAt: message.editedAt ?? message.createdAt,
    },
    include: {
      author: true,
      discordMessage: {
        include: {
          author: true,
          attachments: true,
        },
      },
    },
  })

  // Send notifications to all users watching the post
  const usersToNotify = await prisma.watchedPost.findMany({
    where: {
      postId: thread.post.id,
    },
    include: {
      user: true,
      post: true,
    },
  })

  await Promise.all(
    usersToNotify.map((watchedPost) =>
      sendCommentNotification(
        watchedPost.user,
        watchedPost.post,
        comment,
        community
      )
    )
  )
}

export async function upsertDiscordMessageAttachments(
  messageId: string | null,
  threadId: string | null,
  attachments: Attachment[]
): Promise<void> {
  if (messageId === null && threadId === null) {
    throw new Error('Message ID or thread ID is required')
  }
  if (messageId !== null && threadId !== null) {
    throw new Error('Only one of message ID or thread ID is required')
  }

  const messageOrThreadId = messageId ? { messageId } : { threadId }

  const existingAttachments = await prisma.discordMessageAttachment.findMany({
    where: messageOrThreadId,
  })

  const attachmentsToDelete = existingAttachments.filter(
    (attachment) => !attachments.some((a) => a.id === attachment.id)
  )

  const attachmentsToInsert = attachments.filter(
    (attachment) => !existingAttachments.some((a) => a.id === attachment.id)
  )

  for (const attachment of attachmentsToDelete) {
    await deleteR2Object(attachment.attachmentR2Key)
    await prisma.discordMessageAttachment.delete({
      where: { id: attachment.id },
    })
  }

  for (const attachment of attachmentsToInsert) {
    const getAttachmentExt = (attachment: Attachment) => {
      if (attachment.name) {
        return path.extname(attachment.name)
      }
      return attachment.contentType
        ? '.' + (mime.extension(attachment.contentType) || '')
        : ''
    }

    const ext = getAttachmentExt(attachment)
    const r2Key = `discord/attachments/${attachment.id}${ext}`
    try {
      const response = await axios.get(attachment.url, {
        responseType: 'arraybuffer',
      })

      const upload = await s3Client.send(
        new PutObjectCommand({
          Bucket: process.env.R2_BUCKET_NAME,
          Key: r2Key,
          Body: response.data,
          ContentType: attachment.contentType ?? undefined,
          CacheControl: 'public, max-age=31536000', // 1 year
        })
      )
      if (upload.$metadata.httpStatusCode !== 200) {
        console.log(`Failed to upload ${r2Key}`)
        continue
      }
    } catch (error) {
      captureDiscordError('upsertDiscordMessageAttachments', error, {
        attachment,
        messageId,
        threadId,
      })
      continue
    }

    await prisma.discordMessageAttachment.create({
      data: {
        id: attachment.id,
        ...messageOrThreadId,
        name: attachment.name,
        contentType: attachment.contentType,
        size: attachment.size,
        url: attachment.url,
        attachmentR2Key: r2Key,
      },
    })
  }
}

export async function upsertDiscordTag(
  communityId: string,
  tag: GuildForumTag
): Promise<void> {
  await prisma.postTag.upsert({
    where: { discordTagId: tag.id },
    update: {
      name: tag.name,
    },
    create: {
      name: tag.name,
      color: '#000000',
      communityId,
      discordTagId: tag.id,
    },
  })
}

export async function upsertDiscordUser(user: User): Promise<void> {
  const avatarUrl = user.displayAvatarURL()

  await prisma.discordUser.upsert({
    where: { id: user.id },
    update: {
      username: user.username,
      discriminator: user.discriminator,
      avatar: avatarUrl,
    },
    create: {
      id: user.id,
      username: user.username,
      discriminator: user.discriminator,
      avatar: avatarUrl,
    },
  })
}

export async function updateDiscordGuild(guild: Guild): Promise<void> {
  await prisma.discordGuild.update({
    where: { id: guild.id },
    data: {
      name: guild.name,
      icon: guild.icon,
    },
  })
}

export async function upsertDiscordChannel(
  channel: ForumChannel
): Promise<void> {
  const community = await requireCommunityLinked(channel.guildId)

  await prisma.discordChannel.upsert({
    where: { id: channel.id },
    update: {
      name: channel.name,
      type: channel.type,
      guildId: channel.guildId,
    },
    create: {
      id: channel.id,
      name: channel.name,
      type: channel.type,
      guildId: channel.guildId,
    },
  })

  for (const availableTag of channel.availableTags) {
    await upsertDiscordTag(community.id, availableTag)
  }
}

export async function sendAdminNotificationToAllAdmins(
  community: BasicCommunity,
  post: DetailedPost
) {
  const admins = await prisma.user.findMany({
    where: { communityId: community.id, role: UserRole.ADMIN },
  })
  await Promise.all(
    admins.map((admin) => sendAdminNotification(admin, post, community))
  )
}
