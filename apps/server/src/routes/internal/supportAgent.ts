import { Router, Request } from 'express'
import { body } from 'express-validator'
import {
  createValidator,
  requireAuth,
  asyncHandler,
  CustomResponse,
  getCommunityFromReqStrict,
} from '../../utils'
import { generateSupportAgentResponse } from '../../utils'
import {
  CreateSupportAgentChatRequest,
  CreateSupportAgentChatResponse,
} from '@paladin/shared'

const postChatValidators = createValidator([
  body('question')
    .isString()
    .trim()
    .isLength({ min: 1 })
    .withMessage('Question must be a non-empty string'),
])

const router: Router = Router()

router.post(
  '/chat',
  requireAuth,
  postChatValidators,
  asyncHandler(
    async (
      req: Request,
      res: CustomResponse<CreateSupportAgentChatResponse>
    ) => {
      const { question } = req.body as CreateSupportAgentChatRequest
      const community = await getCommunityFromReqStrict(req)

      const response = await generateSupportAgentResponse(
        question,
        community.id
      )

      return res.status(200).json({
        response: response.answer,
      })
    }
  )
)

export { router as supportAgentRoutes }
