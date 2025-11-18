import { Router, Request } from 'express'
import prisma from '../../prisma/client'
import {
  asyncHandler,
  requireAuth,
  requireAdmin,
  CustomResponse,
  getCommunityFromReqStrict,
  getUserFromReqStrict,
  createValidator,
  isProduction,
} from '../../utils'
import {
  GetDiscordChannelsResponse,
  GetDiscordInviteLinkResponse,
  UpdateDiscordChannelRequest,
} from '@paladin/shared'
import { body, param } from 'express-validator'
import { discordClient, posthogClient } from '../../clients'
import { handleSyncChannel } from '../../discord'
import { ChannelType } from 'discord.js'

const router: Router = Router()

const updateDiscordChannelValidators = createValidator([
  param('discordChannelId')
    .notEmpty()
    .withMessage('Discord channel ID is required'),
  body('shouldSync').notEmpty().withMessage('Should sync is required'),
  body('defaultPostType')
    .notEmpty()
    .withMessage('Default post type is required'),
  body('defaultPostTagId')
    .optional()
    .isString()
    .withMessage('Default post tag ID must be a string'),
])

router.get(
  '/channel',
  requireAuth,
  asyncHandler(
    async (req: Request, res: CustomResponse<GetDiscordChannelsResponse>) => {
      const community = await getCommunityFromReqStrict(req)
      const user = await getUserFromReqStrict(req, community.id)

      requireAdmin(user)

      const guild = await prisma.discordGuild.findUnique({
        where: {
          communityId: community.id,
        },
        select: {
          id: true,
        },
      })
      if (!guild) {
        return res.status(200).json({ discordChannels: [] })
      }

      const channels = await prisma.discordChannel.findMany({
        where: { guildId: guild.id },
        orderBy: { name: 'asc' },
        include: {
          _count: {
            select: { threads: true },
          },
        },
      })

      return res.status(200).json({ discordChannels: channels })
    }
  )
)

router.patch(
  '/channel/:discordChannelId',
  updateDiscordChannelValidators,
  requireAuth,
  asyncHandler(async (req: Request, res: CustomResponse<void>) => {
    const updateData = req.body as UpdateDiscordChannelRequest
    const { discordChannelId } = req.params
    const existingCommunity = await getCommunityFromReqStrict(req)
    const user = await getUserFromReqStrict(req, existingCommunity.id)

    requireAdmin(user)

    const discordChannel = await prisma.discordChannel.update({
      where: { id: discordChannelId },
      data: updateData,
    })

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    handleSyncChannel(discordChannelId).catch((err: any) => {
      if (isProduction()) {
        posthogClient.capture({
          distinctId: user.id,
          event: 'server-error',
          properties: {
            origin: req.headers.origin,
            communityId: existingCommunity.id,
            message: err.message,
            stack: err.stack,
            path: req.path,
            method: req.method,
            query: req.query,
            body: req.body,
            ip: req.ip,
            userAgent: req.headers['user-agent'],
            timestamp: new Date().toISOString(),
            statusCode: res.statusCode,
            referer: req.headers.referer,
          },
        })
      }
    })

    const channel = await discordClient.channels.fetch(discordChannelId)
    if (!channel || channel.type !== ChannelType.GuildForum) {
      return res.status(404).json({ message: 'Channel not found' })
    }
    // If no invite link, create one
    if (!discordChannel.inviteLink && discordChannel.shouldSync) {
      const invite = await channel.createInvite({
        maxAge: 0,
        maxUses: 0,
        unique: true,
      })
      await prisma.discordChannel.update({
        where: { id: discordChannelId },
        data: { inviteLink: invite.url },
      })
    }

    // If not syncing, delete invite link if exists
    if (!discordChannel.shouldSync && discordChannel.inviteLink) {
      // DEBT: Should delete invite from Discord, but Discord invites annoying in forum channels
      await prisma.discordChannel.update({
        where: { id: discordChannelId },
        data: { inviteLink: null },
      })
    }

    return res.status(200).json()
  })
)

router.get(
  '/invite-link',
  asyncHandler(
    async (req: Request, res: CustomResponse<GetDiscordInviteLinkResponse>) => {
      const community = await getCommunityFromReqStrict(req)

      const guild = await prisma.discordGuild.findUnique({
        where: { communityId: community.id },
      })

      if (!guild) {
        return res.status(200).json({ inviteLink: undefined })
      }

      const discordChannel = await prisma.discordChannel.findFirst({
        where: { guildId: guild.id, inviteLink: { not: null } },
      })

      if (!discordChannel?.inviteLink) {
        return res.status(200).json({ inviteLink: undefined })
      }

      return res.status(200).json({ inviteLink: discordChannel.inviteLink })
    }
  )
)

export { router as discordRoutes }
