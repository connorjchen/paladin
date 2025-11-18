import { Router, Request } from 'express'
import {
  asyncHandler,
  createValidator,
  CustomResponse,
  deleteAlgoliaPost,
  indexAlgoliaPost,
  requireAuth,
  requireAdmin,
  ALGOLIA_POST_INDEX,
  generateSupportAgentResponse,
  getCommunityFromReqStrict,
  getUserFromReq,
  getUserFromReqStrict,
  watchPost,
  getPaginationParams,
} from '../../utils'
import { algoliaClient } from '../../clients'
import {
  CreatePostRequest,
  CreatePostResponse,
  GetPostResponse,
  GetPostsRequest,
  GetPostsResponse,
  GetRelevantPostsRequest,
  GetRelevantPostsResponse,
  GetRoadmapRequest,
  GetRoadmapResponse,
  PostFilter,
  PostOrderBy,
  UpvotePostRequest,
  UpdateQuestionStatusRequest,
  PinPostRequest,
  GetReviewPostsResponse,
  UpdatePostRequest,
  DetailedPost,
  AlgoliaPost,
  WatchPostRequest,
  isAuthor,
  isAdmin,
} from '@paladin/shared'
import prisma from '../../prisma/client'
import { body, param, query } from 'express-validator'
import { FeedbackStatus, PostType, QuestionStatus } from '@prisma/client'
import { SearchResponse } from 'algoliasearch'
import { sendAdminNotificationToAllAdmins } from '../../discord'

const router: Router = Router()

const getPostsValidators = createValidator([
  query('orderBy').notEmpty().withMessage('Order by is required'),
  query('filter').notEmpty().withMessage('Filter is required'),
  query('limit').optional().isInt().withMessage('Limit must be an integer'),
  query('offset').optional().isInt().withMessage('Offset must be an integer'),
])

const getRoadmapValidators = createValidator([
  query('orderBy').notEmpty().withMessage('Order by is required'),
])

const getReviewPostsValidators = createValidator([])

const getRelevantPostsValidators = createValidator([
  query('query').optional().isString().withMessage('Query must be a string'),
])

const getPostValidators = createValidator([
  param('postId').notEmpty().withMessage('Post ID is required'),
])

const createPostValidators = createValidator([
  body('title').notEmpty().withMessage('Title is required'),
  body('content').notEmpty().withMessage('Content is required'),
  body('type').notEmpty().withMessage('Type is required'),
  body('isPrivate').notEmpty().withMessage('Is private is required'),
  body('tagIds').optional().isArray().withMessage('Tag IDs must be an array'),
])

const updatePostValidators = createValidator([
  param('postId').notEmpty().withMessage('Post ID is required'),
  body('title').optional().isString().withMessage('Title must be a string'),
  body('content').optional().isString().withMessage('Content must be a string'),
  body('type').optional().isString().withMessage('Type must be a string'),
  body('isPrivate')
    .optional()
    .isBoolean()
    .withMessage('Is private must be a boolean'),
  body('tagIds').optional().isArray().withMessage('Tag IDs must be an array'),
])

const upvotePostValidators = createValidator([
  param('postId').notEmpty().withMessage('Post ID is required'),
  body('isUpvote').notEmpty().withMessage('Is upvote is required'),
])

const watchPostValidators = createValidator([
  param('postId').notEmpty().withMessage('Post ID is required'),
  body('isWatching').notEmpty().withMessage('Is watching is required'),
])

const pinPostValidators = createValidator([
  param('postId').notEmpty().withMessage('Post ID is required'),
  body('isPinned').notEmpty().withMessage('Is pinned is required'),
])

const updateFeedbackStatusValidators = createValidator([
  param('postId').notEmpty().withMessage('Post ID is required'),
  body('status').notEmpty().withMessage('Status is required'),
])

const updateQuestionStatusValidators = createValidator([
  param('postId').notEmpty().withMessage('Post ID is required'),
  body('status').notEmpty().withMessage('Status is required'),
])

const deletePostValidators = createValidator([
  param('postId').notEmpty().withMessage('Post ID is required'),
])

router.get(
  '/',
  getPostsValidators,
  asyncHandler(async (req: Request, res: CustomResponse<GetPostsResponse>) => {
    const {
      orderBy,
      filter,
      limit: reqLimit,
      offset: reqOffset,
      tagIds,
    } = req.query as unknown as GetPostsRequest
    const limit =
      typeof reqLimit === 'string' ? parseInt(reqLimit, 10) : reqLimit
    const offset =
      typeof reqOffset === 'string' ? parseInt(reqOffset, 10) : reqOffset
    const community = await getCommunityFromReqStrict(req)
    const user = await getUserFromReq(req, community.id)

    if (
      !user &&
      (filter === PostFilter.MY_POSTS || filter === PostFilter.FOLLOWING)
    ) {
      return res.status(401).json({
        message: 'My posts and following posts require authentication',
      })
    }

    let followingPostIds: string[] = []
    if (filter === PostFilter.FOLLOWING) {
      const detailedUser = await prisma.user.findUniqueOrThrow({
        where: { id: user!.id }, // eslint-disable-line @typescript-eslint/no-non-null-assertion
        include: {
          watchedPosts: {
            select: {
              postId: true,
            },
          },
        },
      })

      followingPostIds = detailedUser.watchedPosts.map(
        (watchedPost) => watchedPost.postId
      )
    }

    // All other queries
    const whereClause = {
      communityId: community.id,
      private: filter === PostFilter.MY_POSTS ? undefined : false,
      pinned: filter === PostFilter.PINNED ? true : undefined,
      ...(filter === PostFilter.MY_POSTS && {
        authorId: user!.id, // eslint-disable-line @typescript-eslint/no-non-null-assertion
      }),
      ...(filter === PostFilter.QUESTION && { type: PostType.QUESTION }),
      ...(filter === PostFilter.FEEDBACK && { type: PostType.FEEDBACK }),
      ...(filter === PostFilter.FOLLOWING && {
        id: { in: followingPostIds },
      }),
      ...(tagIds &&
        tagIds.length > 0 && {
          postTags: {
            some: {
              tagId: { in: tagIds },
            },
          },
        }),
    }

    const totalItems = await prisma.post.count({
      where: whereClause,
    })

    const pagination = getPaginationParams(limit, offset, totalItems)

    const posts = await prisma.post.findMany({
      where: whereClause,
      orderBy:
        orderBy === PostOrderBy.MOST_UPVOTED
          ? [{ upvotes: { _count: 'desc' } }, { createdAt: 'desc' }]
          : [{ createdAt: 'desc' }],
      ...(pagination.limit && { take: pagination.limit }),
      skip: pagination.actualOffset,
      include: {
        author: true,
        postTags: {
          include: {
            tag: true,
          },
        },
        discordThread: {
          include: {
            channel: true,
            author: true,
            starterMessageAttachments: true,
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

    return res.status(200).json({
      posts,
      page: pagination.page,
      limit: pagination.limit,
      totalPages: pagination.totalPages,
      totalItems,
    })
  })
)

router.get(
  '/roadmap',
  getRoadmapValidators,
  asyncHandler(
    async (req: Request, res: CustomResponse<GetRoadmapResponse>) => {
      const { orderBy } = req.query as GetRoadmapRequest
      const community = await getCommunityFromReqStrict(req)

      const posts = await prisma.post.findMany({
        where: {
          communityId: community.id,
          private: false,
          type: PostType.FEEDBACK,
        },
        orderBy:
          orderBy === PostOrderBy.MOST_UPVOTED
            ? [{ upvotes: { _count: 'desc' } }, { createdAt: 'desc' }]
            : [{ createdAt: 'desc' }],
        include: {
          author: true,
          postTags: {
            include: {
              tag: true,
            },
          },
          discordThread: {
            include: {
              channel: true,
              author: true,
              starterMessageAttachments: true,
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

      return res.status(200).json({
        planned: posts.filter(
          (post) => post.feedbackStatus === FeedbackStatus.PLANNED
        ),
        inProgress: posts.filter(
          (post) => post.feedbackStatus === FeedbackStatus.IN_PROGRESS
        ),
        completed: posts.filter(
          (post) => post.feedbackStatus === FeedbackStatus.COMPLETED
        ),
        underReview: posts.filter(
          (post) => post.feedbackStatus === FeedbackStatus.UNDER_REVIEW
        ),
      })
    }
  )
)

router.get(
  '/review',
  requireAuth,
  getReviewPostsValidators,
  asyncHandler(
    async (req: Request, res: CustomResponse<GetReviewPostsResponse>) => {
      const community = await getCommunityFromReqStrict(req)
      const user = await getUserFromReqStrict(req, community.id)

      requireAdmin(user)

      const posts = await prisma.post.findMany({
        where: {
          communityId: community.id,
          OR: [
            {
              feedbackStatus: FeedbackStatus.UNDER_REVIEW,
              type: PostType.FEEDBACK,
            },
            {
              questionStatus: QuestionStatus.AWAITING_ADMIN_RESPONSE,
              type: PostType.QUESTION,
            },
          ],
        },
        orderBy: [{ createdAt: 'desc' }],
        include: {
          author: true,
          postTags: {
            include: {
              tag: true,
            },
          },
          discordThread: {
            include: {
              channel: true,
              author: true,
              starterMessageAttachments: true,
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

      return res.status(200).json({
        feedback: posts.filter((post) => post.type === PostType.FEEDBACK),
        questions: posts.filter((post) => post.type === PostType.QUESTION),
      })
    }
  )
)

router.get(
  '/relevant',
  getRelevantPostsValidators,
  asyncHandler(
    async (req: Request, res: CustomResponse<GetRelevantPostsResponse>) => {
      const { query } = req.query as unknown as GetRelevantPostsRequest
      const community = await getCommunityFromReqStrict(req)

      // Search Algolia for relevant posts (first 5 results)
      const searchResponse = await algoliaClient.searchSingleIndex({
        indexName: ALGOLIA_POST_INDEX,
        searchParams: {
          query,
          filters: `communityId:${community.id}`,
          hitsPerPage: 5,
          page: 0,
        },
      })

      const searchResult = searchResponse as SearchResponse<AlgoliaPost>
      const postIds = searchResult.hits.map((hit: AlgoliaPost) => hit.objectID)

      if (postIds.length === 0) {
        return res.status(200).json({
          posts: [],
        })
      }

      // Fetch full post data from database using object IDs
      const posts = await prisma.post.findMany({
        where: {
          id: { in: postIds },
        },
        include: {
          author: true,
          postTags: {
            include: {
              tag: true,
            },
          },
          discordThread: {
            include: {
              channel: true,
              author: true,
              starterMessageAttachments: true,
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

      // Maintain Algolia's relevance order
      const orderedPosts = postIds
        .map((id: string) => posts.find((post: DetailedPost) => post.id === id))
        .filter(
          (post: DetailedPost | undefined): post is DetailedPost =>
            post !== undefined
        )

      return res.status(200).json({
        posts: orderedPosts,
      })
    }
  )
)

router.get(
  '/:postId',
  getPostValidators,
  asyncHandler(async (req: Request, res: CustomResponse<GetPostResponse>) => {
    const { postId } = req.params
    const community = await getCommunityFromReqStrict(req)
    const user = await getUserFromReq(req, community.id)

    const post = await prisma.post.findUniqueOrThrow({
      where: {
        id: postId,
      },
      include: {
        author: true,
        postTags: {
          include: {
            tag: true,
          },
        },
        discordThread: {
          include: {
            channel: true,
            author: true,
            starterMessageAttachments: true,
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
          orderBy: [{ createdAt: 'asc' }],
        },
        _count: {
          select: {
            upvotes: true,
            comments: true,
          },
        },
      },
    })

    const userAuthorizedToSeePost =
      !post.private ||
      (!!user && (isAdmin(user.role) || isAuthor(post.author.id, user.id)))

    res.status(200).json({
      post: userAuthorizedToSeePost ? post : null,
      userAuthorizedToSeePost,
    })
  })
)

router.post(
  '/',
  requireAuth,
  createPostValidators,
  asyncHandler(
    async (req: Request, res: CustomResponse<CreatePostResponse>) => {
      const { title, content, type, isPrivate, tagIds } =
        req.body as CreatePostRequest
      const community = await getCommunityFromReqStrict(req)
      const user = await getUserFromReqStrict(req, community.id)

      const post = await prisma.post.create({
        data: {
          title,
          content,
          type,
          private: isPrivate,
          authorId: user.id,
          communityId: community.id,
          questionStatus:
            type === PostType.QUESTION
              ? QuestionStatus.AWAITING_ADMIN_RESPONSE
              : undefined,
          feedbackStatus:
            type === PostType.FEEDBACK
              ? FeedbackStatus.UNDER_REVIEW
              : undefined,
          postTags: {
            createMany: {
              data:
                tagIds?.map((tagId) => ({
                  tagId,
                })) ?? [],
            },
          },
        },
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

      await indexAlgoliaPost(post)

      if (community.isSupportAgentEnabled && post.type === PostType.QUESTION) {
        const supportAgentAnswer = await generateSupportAgentResponse(
          `${post.title}\n\n${post.content}`,
          community.id
        )
        await prisma.comment.create({
          data: {
            content: supportAgentAnswer.answer,
            postId: post.id,
            authorId: 'cmdkzne4300013envq7k9r3wu', // Support Agent - community.trypaladin.com
            parentId: null,
          },
        })
      }

      await watchPost(post.id, user.id, true)

      await sendAdminNotificationToAllAdmins(community, post)

      return res.status(200).json({
        postId: post.id,
      })
    }
  )
)

router.patch(
  '/:postId',
  requireAuth,
  updatePostValidators,
  asyncHandler(async (req: Request, res: CustomResponse<void>) => {
    const { postId } = req.params
    const { title, content, type, isPrivate, tagIds } =
      req.body as UpdatePostRequest
    const community = await getCommunityFromReqStrict(req)
    const user = await getUserFromReqStrict(req, community.id)

    const existingPost = await prisma.post.findUniqueOrThrow({
      where: { id: postId },
      include: { author: true },
    })

    if (!isAdmin(user.role) && !isAuthor(existingPost.authorId, user.id)) {
      return res.status(403).json({ message: 'Forbidden' })
    }

    // Handle type transitions and status resets
    let statusUpdates = {}
    if (type) {
      const isNonQuestionToQuestion =
        existingPost.type !== PostType.QUESTION && type === PostType.QUESTION
      const isNonFeedbackToFeedback =
        existingPost.type !== PostType.FEEDBACK && type === PostType.FEEDBACK
      const isNonGeneralToGeneral =
        existingPost.type !== PostType.GENERAL && type === PostType.GENERAL

      statusUpdates = isNonQuestionToQuestion
        ? {
            questionStatus: QuestionStatus.AWAITING_ADMIN_RESPONSE,
            feedbackStatus: null,
          }
        : isNonFeedbackToFeedback
          ? {
              feedbackStatus: FeedbackStatus.UNDER_REVIEW,
              questionStatus: null,
            }
          : isNonGeneralToGeneral
            ? {
                feedbackStatus: null,
                questionStatus: null,
              }
            : {}
    }

    if (tagIds && tagIds.length > 0) {
      await prisma.postTagOnPost.deleteMany({
        where: { postId, tagId: { notIn: tagIds } },
      })

      await prisma.postTagOnPost.createMany({
        data: tagIds.map((tagId) => ({
          postId,
          tagId,
        })),
        skipDuplicates: true,
      })
    }

    // Only include fields that are present in the request body
    const fieldMap = {
      title,
      content,
      type,
      private: isPrivate,
    }
    const updateData = {
      ...statusUpdates,
      ...Object.fromEntries(
        Object.entries(fieldMap).filter(([, v]) => v !== undefined)
      ),
    }

    await prisma.post.update({
      where: { id: postId },
      data: updateData,
    })

    return res.status(200).json()
  })
)

router.post(
  '/upvote/:postId',
  requireAuth,
  upvotePostValidators,
  asyncHandler(async (req: Request, res: CustomResponse<void>) => {
    const { postId } = req.params
    const { isUpvote } = req.body as UpvotePostRequest
    const community = await getCommunityFromReqStrict(req)
    const user = await getUserFromReqStrict(req, community.id)

    if (isUpvote) {
      await prisma.upvote.create({
        data: {
          postId,
          userId: user.id,
        },
      })
    } else {
      await prisma.upvote.delete({
        where: {
          postId_userId: {
            postId,
            userId: user.id,
          },
        },
      })
    }

    return res.status(200).json()
  })
)

router.post(
  '/watch/:postId',
  requireAuth,
  watchPostValidators,
  asyncHandler(async (req: Request, res: CustomResponse<void>) => {
    const { postId } = req.params
    const { isWatching } = req.body as WatchPostRequest
    const community = await getCommunityFromReqStrict(req)
    const user = await getUserFromReqStrict(req, community.id)

    await watchPost(postId, user.id, isWatching)

    return res.status(200).json()
  })
)

router.post(
  '/pin/:postId',
  requireAuth,
  pinPostValidators,
  asyncHandler(async (req: Request, res: CustomResponse<void>) => {
    const { postId } = req.params
    const { isPinned } = req.body as PinPostRequest
    const community = await getCommunityFromReqStrict(req)
    const user = await getUserFromReqStrict(req, community.id)

    requireAdmin(user)

    // Make sure post is not private
    const post = await prisma.post.findUniqueOrThrow({
      where: { id: postId },
      select: { private: true },
    })
    if (post.private) {
      return res.status(403).json({ message: 'Cannot pin private posts' })
    }

    await prisma.post.update({
      where: { id: postId },
      data: { pinned: isPinned },
    })

    return res.status(200).json()
  })
)

router.post(
  '/feedback-status/:postId',
  requireAuth,
  updateFeedbackStatusValidators,
  asyncHandler(async (req: Request, res: CustomResponse<void>) => {
    const { postId } = req.params
    const { status } = req.body
    const community = await getCommunityFromReqStrict(req)
    const user = await getUserFromReqStrict(req, community.id)

    requireAdmin(user)

    await prisma.post.update({
      where: {
        id: postId,
      },
      data: {
        feedbackStatus: status,
      },
    })

    return res.status(200).json(undefined)
  })
)

router.post(
  '/question-status/:postId',
  requireAuth,
  updateQuestionStatusValidators,
  asyncHandler(async (req: Request, res: CustomResponse<void>) => {
    const { postId } = req.params
    const { status } = req.body as UpdateQuestionStatusRequest
    const community = await getCommunityFromReqStrict(req)
    const user = await getUserFromReqStrict(req, community.id)

    requireAdmin(user)

    await prisma.post.update({
      where: {
        id: postId,
      },
      data: {
        questionStatus: status,
      },
    })

    return res.status(200).json(undefined)
  })
)

router.delete(
  '/:postId',
  requireAuth,
  deletePostValidators,
  asyncHandler(async (req: Request, res) => {
    const { postId } = req.params
    const community = await getCommunityFromReqStrict(req)
    const user = await getUserFromReqStrict(req, community.id)

    const post = await prisma.post.findUniqueOrThrow({
      where: { id: postId },
      include: { author: true },
    })

    if (!isAdmin(user.role) && !isAuthor(post.authorId, user.id)) {
      return res.status(403).json({ message: 'Forbidden' })
    }

    await prisma.post.delete({ where: { id: postId } })
    await deleteAlgoliaPost(postId)
    return res.status(204).end()
  })
)

export { router as postRoutes }
