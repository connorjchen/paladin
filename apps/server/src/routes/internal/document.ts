import { Router, Request } from 'express'
import prisma from '../../prisma/client'
import {
  asyncHandler,
  requireAuth,
  requireAdmin,
  createValidator,
  CustomResponse,
  indexChromaDocument,
  deleteChromaDocument,
  deleteR2Object,
  getCommunityFromReqStrict,
  getUserFromReqStrict,
} from '../../utils'
import { CreateDocumentRequest, GetDocumentsResponse } from '@paladin/shared'
import { body, param } from 'express-validator'

const router: Router = Router()

const getDocumentsValidators = createValidator([])

const createDocumentValidators = createValidator([
  body('name').notEmpty().withMessage('Name is required'),
  body('r2Key').notEmpty().withMessage('R2 key is required'),
])

const deleteDocumentValidators = createValidator([
  param('documentId').notEmpty().withMessage('Document ID is required'),
])

router.get(
  '/',
  getDocumentsValidators,
  asyncHandler(
    async (req: Request, res: CustomResponse<GetDocumentsResponse>) => {
      const community = await getCommunityFromReqStrict(req)

      const documents = await prisma.document.findMany({
        where: { communityId: community.id },
        orderBy: { createdAt: 'desc' },
      })

      return res.status(200).json({ documents })
    }
  )
)

router.post(
  '/',
  requireAuth,
  createDocumentValidators,
  asyncHandler(async (req: Request, res: CustomResponse<void>) => {
    const { name, r2Key } = req.body as CreateDocumentRequest
    const community = await getCommunityFromReqStrict(req)
    const user = await getUserFromReqStrict(req, community.id)

    requireAdmin(user)

    const documentCount = await prisma.document.count({
      where: { communityId: community.id },
    })
    if (documentCount >= 100) {
      return res.status(400).json({ message: 'Max documents reached' })
    }

    const document = await prisma.document.create({
      data: { name, r2Key, communityId: community.id },
    })
    await indexChromaDocument(document.id, r2Key, community.id)

    return res.status(200).json()
  })
)

router.delete(
  '/:documentId',
  requireAuth,
  deleteDocumentValidators,
  asyncHandler(async (req: Request, res: CustomResponse<void>) => {
    const { documentId } = req.params
    const community = await getCommunityFromReqStrict(req)
    const user = await getUserFromReqStrict(req, community.id)

    requireAdmin(user)

    const document = await prisma.document.findUniqueOrThrow({
      where: { id: documentId },
    })

    await prisma.document.delete({ where: { id: documentId } })
    await deleteChromaDocument(documentId)
    await deleteR2Object(document.r2Key)

    return res.status(200).json()
  })
)

export { router as documentRoutes }
