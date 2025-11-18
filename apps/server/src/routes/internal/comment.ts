import { Router, Request } from 'express'
import {
  asyncHandler,
  createValidator,
  CustomResponse,
  deleteChromaPost,
  getCommunityFromReqStrict,
  getUserFromReqStrict,
  indexChromaPost,
  requireAuth,
  sendAdminNotification,
  sendCommentNotification,
  watchPost,
} from '../../utils'
import {
  CreateCommentRequest,
  DetailedPost,
  isAdmin,
  isAuthor,
  MarkCommentAsAcceptedRequest,
  UpdateCommentRequest,
  UpdateCommentResponse,
} from '@paladin/shared'
import prisma from '../../prisma/client'
import { body, param } from 'express-validator'
import { PostType, QuestionStatus, UserRole } from '@prisma/client'
import { discordClient } from '../../clients'
import { Message } from 'discord.js'
import { DISCORD_BOT_USER_ID } from '@paladin/shared'
import { sendAdminNotificationToAllAdmins } from '../../discord/utils'

const router: Router = Router()

const createCommentValidators = createValidator([
  body('postId').notEmpty().withMessage('Post ID is required'),
  body('content').notEmpty().withMessage('Content is required'),
  body('parentId')
    .optional()
    .isString()
    .withMessage('Parent ID must be a string'),
])

const updateCommentValidators = createValidator([
  param('commentId').notEmpty().withMessage('Comment ID is required'),
  body('content').notEmpty().withMessage('Content is required'),
])

const deleteCommentValidators = createValidator([
  param('commentId').notEmpty().withMessage('Comment ID is required'),
])

const markCommentAsAcceptedValidators = createValidator([
  param('commentId').notEmpty().withMessage('Comment ID is required'),
  body('isAcceptedAnswer')
    .isBoolean()
    .withMessage('Is accepted answer must be a boolean'),
])

router.post(
  '/',
  requireAuth,
  createCommentValidators,
  asyncHandler(async (req: Request, res: CustomResponse<void>) => {
    const { postId, content, parentId } = req.body as CreateCommentRequest
    const community = await getCommunityFromReqStrict(req)
    const user = await getUserFromReqStrict(req, community.id)

    const post: DetailedPost = await prisma.post.findUniqueOrThrow({
      where: { id: postId },
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

    // If parentId is provided, verify it exists and belongs to the same post
    if (parentId) {
      await prisma.comment.findUniqueOrThrow({
        where: { id: parentId, postId },
      })
    }

    // If Discord message, send comment with link to this post
    let discordMessageId: string | null = null
    if (post.discordThread) {
      const thread = await discordClient.channels.fetch(post.discordThread.id)
      if (thread?.isThread()) {
        const postUrl = `https://${community.domain}/post/${post.id}`
        const messageContent = `On [this post](${postUrl}) — ${user.username} commented:\n\n${content}`
        let message: Message | null = null
        if (parentId) {
          const parentComment = await prisma.comment.findUnique({
            where: { id: parentId },
            select: { discordMessageId: true },
          })
          if (parentComment?.discordMessageId) {
            const parentMessage = await thread.messages.fetch(
              parentComment.discordMessageId
            )
            message = await parentMessage.reply(messageContent)
          }
        } else {
          message = await thread.send(messageContent)
        }
        if (message?.id) {
          discordMessageId = message.id
          await prisma.discordMessage.create({
            data: {
              id: message.id,
              threadId: post.discordThread.id,
              content: message.content,
              authorId: 'cmeorhzpv000107l86ah63p88', // TODO: replace with your Discord bot's DiscordUser object id
            },
          })
        }
      }
    }

    const comment = await prisma.comment.create({
      data: {
        content,
        postId,
        authorId: user.id,
        parentId,
        discordMessageId,
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

    // If admin and author, do nothing
    if (isAdmin(user.role) && isAuthor(post.authorId, user.id)) {
      return res.status(200).json()
    }

    // Update question status state if admin or author
    if (
      post.questionStatus === QuestionStatus.AWAITING_ADMIN_RESPONSE &&
      isAdmin(user.role)
    ) {
      await prisma.post.update({
        where: { id: postId },
        data: { questionStatus: QuestionStatus.AWAITING_USER_RESPONSE },
      })
    } else if (
      post.questionStatus === QuestionStatus.AWAITING_USER_RESPONSE &&
      isAuthor(post.authorId, user.id)
    ) {
      await prisma.post.update({
        where: { id: postId },
        data: { questionStatus: QuestionStatus.AWAITING_ADMIN_RESPONSE },
      })

      await sendAdminNotificationToAllAdmins(community, post)
    }

    await watchPost(post.id, user.id, true)

    // Send notifications to all users watching the post except the comment author
    const usersToNotify = await prisma.watchedPost.findMany({
      where: {
        postId,
        NOT: {
          userId: user.id,
        },
      },
      include: {
        user: true,
      },
    })

    await Promise.all(
      usersToNotify.map((watchedPost) =>
        sendCommentNotification(watchedPost.user, post, comment, community)
      )
    )

    return res.status(200).json()
  })
)

router.patch(
  '/:commentId',
  requireAuth,
  updateCommentValidators,
  asyncHandler(
    async (req: Request, res: CustomResponse<UpdateCommentResponse>) => {
      const { commentId } = req.params
      const { content } = req.body as UpdateCommentRequest
      const community = await getCommunityFromReqStrict(req)
      const user = await getUserFromReqStrict(req, community.id)

      const existingComment = await prisma.comment.findUniqueOrThrow({
        where: { id: commentId },
      })

      if (!isAdmin(user.role) && !isAuthor(existingComment.authorId, user.id)) {
        return res.status(403).json({ message: 'Forbidden' })
      }

      const comment = await prisma.comment.update({
        where: { id: commentId },
        data: {
          content,
        },
        include: {
          post: {
            include: {
              discordThread: true,
            },
          },
          discordMessage: true,
        },
      })

      // If Discord message, update the comment in the thread
      if (comment.post.discordThread && comment.discordMessage) {
        const postUrl = `https://${community.domain}/post/${comment.post.id}`

        const thread = await discordClient.channels.fetch(
          comment.post.discordThread.id
        )
        if (thread?.isThread()) {
          const message = await thread.messages.fetch(comment.discordMessage.id)
          if (message) {
            await message.edit(
              `On [this post](${postUrl}) — ${user.username} commented:\n\n${content}`
            )
            await prisma.discordMessage.update({
              where: { id: comment.discordMessage.id },
              data: {
                content: message.content,
              },
            })
          }
        }
      }

      return res.status(200).json({
        commentId: comment.id,
      })
    }
  )
)

router.delete(
  '/:commentId',
  requireAuth,
  deleteCommentValidators,
  asyncHandler(async (req: Request, res) => {
    const { commentId } = req.params
    const community = await getCommunityFromReqStrict(req)
    const user = await getUserFromReqStrict(req, community.id)

    const comment = await prisma.comment.findUniqueOrThrow({
      where: { id: commentId },
      include: {
        _count: {
          select: { children: true },
        },
        post: {
          include: {
            discordThread: true,
          },
        },
        discordMessage: true,
      },
    })

    if (!isAdmin(user.role) && !isAuthor(comment.authorId, user.id)) {
      return res.status(403).json({ message: 'Forbidden' })
    }

    // If comment has children, update it to indicate it has been deleted
    // Otherwise, delete the comment outright
    if (comment._count.children > 0) {
      await prisma.comment.update({
        where: { id: commentId },
        data: {
          content: '*This comment has been deleted*',
        },
      })
      // Update Discord message
      if (comment.discordMessage) {
        await prisma.discordMessage.update({
          where: { id: comment.discordMessage.id },
          data: {
            content: 'This comment has been deleted',
          },
        })
      }
    } else {
      await prisma.comment.delete({
        where: { id: commentId },
      })
      // Delete Discord message only if it originated from Paladin
      if (
        comment.post.discordThread &&
        comment.discordMessage &&
        comment.authorId !== DISCORD_BOT_USER_ID
      ) {
        const thread = await discordClient.channels.fetch(
          comment.post.discordThread.id
        )
        if (thread?.isThread()) {
          await thread.messages.delete(comment.discordMessage.id)
        }
      }
    }

    // If comment is an accepted answer, delete the post from Chroma
    if (comment.isAcceptedAnswer) {
      await deleteChromaPost(comment.postId)
    }

    return res.status(204).end()
  })
)

router.post(
  '/mark-as-accepted/:commentId',
  requireAuth,
  markCommentAsAcceptedValidators,
  asyncHandler(async (req: Request, res: CustomResponse<void>) => {
    const { commentId } = req.params
    const { isAcceptedAnswer } = req.body as MarkCommentAsAcceptedRequest
    const community = await getCommunityFromReqStrict(req)
    const user = await getUserFromReqStrict(req, community.id)

    // Get the comment and its associated post
    const comment = await prisma.comment.findUniqueOrThrow({
      where: { id: commentId },
      include: {
        post: {
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
        },
      },
    })

    // Check if post is a question
    if (comment.post.type !== PostType.QUESTION) {
      return res
        .status(400)
        .json({ message: 'Only questions can have accepted answers' })
    }

    // Check if user is the post author
    if (!isAuthor(comment.post.authorId, user.id) && !isAdmin(user.role)) {
      return res.status(403).json({
        message: 'Only the post author or admin can mark answers as accepted',
      })
    }

    // Unset isAcceptedAnswer for all other comments in one query
    await prisma.comment.updateMany({
      where: {
        postId: comment.postId,
        isAcceptedAnswer: true,
        id: { not: commentId },
      },
      data: { isAcceptedAnswer: false },
    })

    // Update comment with isAcceptedAnswer
    await prisma.comment.update({
      where: { id: commentId },
      data: { isAcceptedAnswer },
    })

    if (isAcceptedAnswer) {
      await prisma.post.update({
        where: { id: comment.postId },
        data: { questionStatus: QuestionStatus.RESOLVED },
      })

      await indexChromaPost(
        comment.postId,
        `${comment.post.title}\n\n${comment.post.content}`,
        comment.content,
        community.id
      )
    } else {
      await prisma.post.update({
        where: { id: comment.postId },
        data: { questionStatus: QuestionStatus.AWAITING_ADMIN_RESPONSE },
      })

      await sendAdminNotificationToAllAdmins(community, comment.post)

      await deleteChromaPost(comment.postId)
    }

    return res.status(200).json()
  })
)

export { router as commentRoutes }
