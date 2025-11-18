import { Router, Request } from 'express'
import prisma from '../../prisma/client'
import {
  asyncHandler,
  createValidator,
  CustomResponse,
  deleteR2Object,
  getCommunityFromReqStrict,
  getUserFromReqStrict,
  requireAuth,
  requireAdmin,
} from '../../utils'
import {
  CreateCommunityRequest,
  CreateCommunityResponse,
  GetCommunityResponse,
  UpdateCommunityRequest,
} from '@paladin/shared'
import { body, param } from 'express-validator'
import { ThemeMode } from '@prisma/client'

const router: Router = Router()

const getCommunityWithDomainValidators = createValidator([
  param('communityDomain')
    .notEmpty()
    .withMessage('Community domain is required'),
])

const createCommunityValidators = createValidator([
  body('name').isString().withMessage('Name must be a string'),
  body('domain').isString().withMessage('Domain must be a string'),
])

const updateCommunityValidators = createValidator([
  body('name').optional().isString().withMessage('Name must be a string'),
  body('image').optional().isString().withMessage('Image must be a string'),
  body('favicon').optional().isString().withMessage('Favicon must be a string'),
  body('isSupportAgentEnabled')
    .optional()
    .isBoolean()
    .withMessage('isSupportAgentEnabled must be a boolean'),
  body('discordGuildId')
    .optional({ nullable: true })
    .custom((value) => value === null || typeof value === 'string')
    .withMessage('Discord guild ID must be a string or null'),
  body('themeMode')
    .optional()
    .isIn(Object.values(ThemeMode))
    .withMessage('Theme mode must be a valid theme mode'),
])

router.get(
  '/',
  asyncHandler(
    async (req: Request, res: CustomResponse<GetCommunityResponse>) => {
      const community = await getCommunityFromReqStrict(req)

      const detailedCommunity = await prisma.community.findUniqueOrThrow({
        where: { id: community.id },
        include: {
          externalResources: {
            orderBy: { createdAt: 'desc' },
          },
          discordGuild: true,
        },
      })

      return res.status(200).json({
        community: detailedCommunity,
      })
    }
  )
)

router.get(
  '/:communityDomain',
  getCommunityWithDomainValidators,
  asyncHandler(
    async (req: Request, res: CustomResponse<GetCommunityResponse>) => {
      const { communityDomain } = req.params

      const detailedCommunity = await prisma.community.findUniqueOrThrow({
        where: { domain: communityDomain },
        include: {
          externalResources: {
            orderBy: { createdAt: 'desc' },
          },
          discordGuild: true,
        },
      })

      return res.status(200).json({
        community: detailedCommunity,
      })
    }
  )
)

router.post(
  '/',
  createCommunityValidators,
  asyncHandler(
    async (req: Request, res: CustomResponse<CreateCommunityResponse>) => {
      const { name, domain } = req.body as CreateCommunityRequest

      // Validate domain
      if (!/^(?!-)(?!.*--)[a-z0-9-]{3,20}(?<!-)$/.test(domain)) {
        return res.status(200).json({
          error:
            'Domain must be 3-20 chars, only lowercase letters, numbers, hyphens, and no leading/trailing/consecutive hyphens',
        })
      }

      // Check if domain is already taken
      const existingCommunity = await prisma.community.findUnique({
        where: { domain },
        select: { id: true },
      })
      if (existingCommunity) {
        return res
          .status(200)
          .json({ error: 'Community with this domain already exists' })
      }

      // Create community
      await prisma.community.create({
        data: {
          name,
          domain,
          tags: {
            create: [
              {
                name: 'Support',
                color: '#0F93FF',
              },
            ],
          },
          externalResources: {
            create: [
              {
                url: 'https://trypaladin.com',
                name: 'Try Paladin!',
              },
            ],
          },
        },
      })

      return res.status(200).json()
    }
  )
)

router.patch(
  '/',
  updateCommunityValidators,
  requireAuth,
  asyncHandler(async (req: Request, res: CustomResponse<void>) => {
    const updateData = req.body as UpdateCommunityRequest
    const existingCommunity = await getCommunityFromReqStrict(req)
    const user = await getUserFromReqStrict(req, existingCommunity.id)

    requireAdmin(user)

    // Validate that at least one field is provided
    if (Object.keys(updateData).length === 0) {
      return res.status(400).json({ message: 'No fields provided for update' })
    }

    // Build update object with only provided fields
    const updateFields = Object.fromEntries(
      Object.entries(updateData).filter(([, value]) => value !== undefined)
    )

    await prisma.community.update({
      where: { id: existingCommunity.id },
      data: updateFields,
    })

    if (updateFields.logoR2Key && existingCommunity.logoR2Key) {
      await deleteR2Object(existingCommunity.logoR2Key)
    }
    if (updateFields.faviconR2Key && existingCommunity.faviconR2Key) {
      await deleteR2Object(existingCommunity.faviconR2Key)
    }
    if (updateFields.logoDarkR2Key && existingCommunity.logoDarkR2Key) {
      await deleteR2Object(existingCommunity.logoDarkR2Key)
    }

    return res.status(200).json()
  })
)

export { router as communityRoutes }
