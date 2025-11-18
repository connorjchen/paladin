import { Router, Request } from 'express'
import prisma from '../../prisma/client'
import {
  asyncHandler,
  requireAuth,
  requireAdmin,
  createValidator,
  CustomResponse,
  getCommunityFromReqStrict,
  getUserFromReqStrict,
} from '../../utils'
import {
  CreatePostTagRequest,
  GetPostTagsResponse,
  UpdatePostTagRequest,
} from '@paladin/shared'
import { body, param } from 'express-validator'

const router: Router = Router()

const getPostTagsValidators = createValidator([])

const createPostTagValidators = createValidator([
  body('name').isString().withMessage('Name must be a string'),
  body('color').isString().withMessage('Color must be a string'),
])

const updatePostTagValidators = createValidator([
  param('postTagId').notEmpty().withMessage('Post tag ID is required'),
  body('name').isString().withMessage('Name must be a string'),
  body('color').isString().withMessage('Color must be a string'),
])

const deletePostTagValidators = createValidator([
  param('postTagId').notEmpty().withMessage('Post tag ID is required'),
])

router.get(
  '/',
  getPostTagsValidators,
  asyncHandler(
    async (req: Request, res: CustomResponse<GetPostTagsResponse>) => {
      const community = await getCommunityFromReqStrict(req)

      const postTags = await prisma.postTag.findMany({
        where: { communityId: community.id },
        orderBy: { createdAt: 'desc' },
        include: {
          _count: {
            select: { posts: true },
          },
        },
      })

      return res.status(200).json({ postTags })
    }
  )
)

router.post(
  '/',
  requireAuth,
  createPostTagValidators,
  asyncHandler(async (req: Request, res: CustomResponse<void>) => {
    const community = await getCommunityFromReqStrict(req)
    const user = await getUserFromReqStrict(req, community.id)
    const { name, color } = req.body as CreatePostTagRequest

    requireAdmin(user)

    await prisma.postTag.create({
      data: { name, color, communityId: community.id },
    })

    return res.status(200).json()
  })
)

router.patch(
  '/:postTagId',
  requireAuth,
  updatePostTagValidators,
  asyncHandler(async (req: Request, res: CustomResponse<void>) => {
    const { postTagId } = req.params
    const { name, color } = req.body as UpdatePostTagRequest
    const community = await getCommunityFromReqStrict(req)
    const user = await getUserFromReqStrict(req, community.id)

    requireAdmin(user)

    await prisma.postTag.update({
      where: { id: postTagId },
      data: { name, color },
    })

    return res.status(200).json()
  })
)

router.delete(
  '/:postTagId',
  requireAuth,
  deletePostTagValidators,
  asyncHandler(async (req: Request, res: CustomResponse<void>) => {
    const { postTagId } = req.params
    const community = await getCommunityFromReqStrict(req)
    const user = await getUserFromReqStrict(req, community.id)

    requireAdmin(user)

    await prisma.postTag.delete({ where: { id: postTagId } })
    return res.status(200).json()
  })
)

export { router as postTagRoutes }
