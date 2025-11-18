import { Router, Request } from 'express'
import { clerkClient, ExpressRequestWithAuth } from '@clerk/express'
import {
  asyncHandler,
  createValidator,
  CustomResponse,
  requireAuth,
  requireAdmin,
  generateRandomUsername,
  getCommunityFromReqStrict,
  getUserFromReqStrict,
  getUserFromReq,
} from '../../utils'
import {
  GetUserResponse,
  GetCommunityUsersResponse,
  SetUserRoleRequest,
  CreateUserRequest,
  UpdateUserEmailNotificationsRequest,
  UpdateAdminEmailNotificationsRequest,
} from '@paladin/shared'
import { UserRole } from '@prisma/client'
import prisma from '../../prisma/client'
import { body, param } from 'express-validator'

const createUserValidators = createValidator([
  body('primaryEmail')
    .optional()
    .isString()
    .withMessage('Primary email must be a string'),
  body('emails').optional().isArray().withMessage('Emails must be an array'),
  body('image').optional().isString().withMessage('Image must be a string'),
])

const getCommunityUsersValidators = createValidator([])

const setRoleValidators = createValidator([
  param('userId').notEmpty().withMessage('User ID is required'),
  body('role').notEmpty().withMessage('Role is required'),
])

const updateEmailNotificationsValidators = createValidator([
  body('isEmailNotificationsEnabled')
    .isBoolean()
    .withMessage('isEmailNotificationsEnabled must be a boolean'),
])

const updateAdminEmailNotificationsValidators = createValidator([
  body('isAdminEmailNotificationsEnabled')
    .isBoolean()
    .withMessage('isAdminEmailNotificationsEnabled must be a boolean'),
])

const router: Router = Router()

router.post(
  '/',
  requireAuth,
  createUserValidators,
  asyncHandler(async (req: Request, res: CustomResponse<GetUserResponse>) => {
    const authReq = req as ExpressRequestWithAuth
    const clerkUserId = authReq.auth.userId
    const community = await getCommunityFromReqStrict(req)
    const user = await getUserFromReq(req, community.id)
    const { primaryEmail, emails, image } = req.body as CreateUserRequest

    if (!clerkUserId) {
      return res.status(401).json({ message: 'Type-safe check' })
    }

    if (user) {
      const detailedUser = await prisma.user.findUniqueOrThrow({
        where: { id: user.id },
        include: {
          upvotes: true,
          watchedPosts: true,
        },
      })

      return res.status(200).json({
        user: detailedUser,
      })
    } else {
      if (!primaryEmail && !emails && !image) {
        return res.status(400).json({ message: 'All user fields are required' })
      }

      const userCount = await prisma.user.count({
        where: { communityId: community.id },
      })

      const isAdmin = userCount === 0

      let username: string | undefined
      const existingUser = await prisma.user.findFirst({
        where: { clerkUserId },
        select: { username: true },
      })
      if (existingUser) {
        username = existingUser.username
      } else {
        // Generate a unique username that doesn't exist in the DB, up to 5 tries
        for (let i = 0; i < 5; i++) {
          username = generateRandomUsername()
          const exists = await prisma.user.findFirst({ where: { username } })
          if (!exists) break
        }
        if (!username) {
          return res
            .status(400)
            .json({ message: 'Failed to generate unique username' })
        }
        await clerkClient.users.updateUser(clerkUserId, {
          username,
        })
      }

      const user = await prisma.user.create({
        data: {
          username,
          clerkUserId,
          communityId: community.id,
          role: isAdmin ? UserRole.ADMIN : UserRole.MEMBER,
          primaryEmail,
          emails,
          firstName: username,
          lastName: '',
          image,
        },
        include: {
          upvotes: true,
          watchedPosts: true,
        },
      })

      return res.status(200).json({
        user,
      })
    }
  })
)

router.get(
  '/community',
  getCommunityUsersValidators,
  requireAuth,
  asyncHandler(
    async (req: Request, res: CustomResponse<GetCommunityUsersResponse>) => {
      const community = await getCommunityFromReqStrict(req)
      const user = await getUserFromReqStrict(req, community.id)

      requireAdmin(user)

      const users = await prisma.user.findMany({
        where: { communityId: community.id },
        orderBy: [{ role: 'asc' }, { username: 'asc' }],
      })

      return res.status(200).json({
        users,
      })
    }
  )
)

router.post(
  '/role/:userId',
  requireAuth,
  setRoleValidators,
  asyncHandler(async (req: Request, res: CustomResponse<void>) => {
    const community = await getCommunityFromReqStrict(req)
    const user = await getUserFromReqStrict(req, community.id)
    const { role } = req.body as SetUserRoleRequest
    const { userId: targetUserId } = req.params

    requireAdmin(user)

    // Verify target user exists and belongs to same community
    const targetUser = await prisma.user.findUniqueOrThrow({
      where: { id: targetUserId },
    })

    if (targetUser.communityId !== community.id) {
      return res
        .status(403)
        .json({ message: 'Cannot modify users from other communities' })
    }

    await prisma.user.update({
      where: { id: targetUserId },
      data: { role },
    })

    return res.status(200).json()
  })
)

router.post(
  '/email-notifications',
  requireAuth,
  updateEmailNotificationsValidators,
  asyncHandler(async (req: Request, res: CustomResponse<void>) => {
    const community = await getCommunityFromReqStrict(req)
    const user = await getUserFromReqStrict(req, community.id)
    const { isEmailNotificationsEnabled } =
      req.body as UpdateUserEmailNotificationsRequest

    await prisma.user.update({
      where: { id: user.id },
      data: { isEmailNotificationsEnabled },
    })

    return res.status(200).json()
  })
)

router.post(
  '/admin-email-notifications',
  requireAuth,
  updateAdminEmailNotificationsValidators,
  asyncHandler(async (req: Request, res: CustomResponse<void>) => {
    const community = await getCommunityFromReqStrict(req)
    const user = await getUserFromReqStrict(req, community.id)
    const { isAdminEmailNotificationsEnabled } =
      req.body as UpdateAdminEmailNotificationsRequest

    await prisma.user.update({
      where: { id: user.id },
      data: { isAdminEmailNotificationsEnabled },
    })

    return res.status(200).json()
  })
)

export { router as userRoutes }
