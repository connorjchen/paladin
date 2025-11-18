import { Router, Request } from 'express'
import prisma from '../../prisma/client'
import {
  asyncHandler,
  createValidator,
  CustomResponse,
  getCommunityFromReqStrict,
  getUserFromReqStrict,
  requireAuth,
  requireAdmin,
} from '../../utils'
import {
  CreateExternalResourceRequest,
  UpdateExternalResourceRequest,
} from '@paladin/shared'
import { body, param } from 'express-validator'

const router: Router = Router()

const createExternalResourceValidators = createValidator([
  body('name').notEmpty().withMessage('Name is required'),
  body('url').notEmpty().withMessage('URL is required'),
])

const updateExternalResourceValidators = createValidator([
  param('externalResourceId')
    .notEmpty()
    .withMessage('External resource ID is required'),
  body('name').notEmpty().withMessage('Name is required'),
  body('url').notEmpty().withMessage('URL is required'),
])

const deleteExternalResourceValidators = createValidator([
  param('externalResourceId')
    .notEmpty()
    .withMessage('External resource ID is required'),
])

router.post(
  '/',
  createExternalResourceValidators,
  requireAuth,
  asyncHandler(async (req: Request, res: CustomResponse<void>) => {
    const { name, url } = req.body as CreateExternalResourceRequest
    const community = await getCommunityFromReqStrict(req)
    const user = await getUserFromReqStrict(req, community.id)

    requireAdmin(user)

    await prisma.communityExternalResource.create({
      data: { communityId: community.id, name, url },
    })
    return res.status(200).json()
  })
)

router.patch(
  '/:externalResourceId',
  updateExternalResourceValidators,
  requireAuth,
  asyncHandler(async (req: Request, res: CustomResponse<void>) => {
    const { externalResourceId } = req.params
    const { name, url } = req.body as UpdateExternalResourceRequest
    const community = await getCommunityFromReqStrict(req)
    const user = await getUserFromReqStrict(req, community.id)

    requireAdmin(user)

    await prisma.communityExternalResource.update({
      where: { id: externalResourceId },
      data: { name, url },
    })
    return res.status(200).json()
  })
)

router.delete(
  '/:externalResourceId',
  requireAuth,
  deleteExternalResourceValidators,
  asyncHandler(async (req: Request, res: CustomResponse<void>) => {
    const { externalResourceId } = req.params
    const community = await getCommunityFromReqStrict(req)
    const user = await getUserFromReqStrict(req, community.id)

    requireAdmin(user)

    await prisma.communityExternalResource.delete({
      where: { id: externalResourceId },
    })
    return res.status(200).json()
  })
)

export { router as externalResourceRoutes }
