import { Router, Request } from 'express'
import { asyncHandler, CustomResponse } from '../../utils'
import prisma from '../../prisma/client'

const router: Router = Router()

router.get(
  '/',
  asyncHandler(
    async (req: Request, res: CustomResponse<{ success: boolean }>) => {
      const randomPost = await prisma.post.findFirst({
        orderBy: {
          createdAt: 'desc',
        },
      })

      if (!randomPost) {
        return res.status(404).json({
          success: false,
        })
      }

      return res.status(200).json({
        success: true,
      })
    }
  )
)

export { router as healthRoutes }
