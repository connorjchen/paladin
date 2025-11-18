import { Router, Request } from 'express'
import {
  createValidator,
  requireAuth,
  asyncHandler,
  CustomResponse,
} from '../../utils'
import { body } from 'express-validator'
import { PutObjectCommand } from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'
import {
  GeneratePresignedUrlRequest,
  GeneratePresignedUrlResponse,
} from '@paladin/shared'
import { s3Client } from '../../clients'

const router: Router = Router()

const postGeneratePresignedUrlValidators = createValidator([
  body('key').notEmpty().withMessage('Key is required'),
  body('contentType').notEmpty().withMessage('Content type is required'),
])

router.post(
  '/generate-presigned-url',
  postGeneratePresignedUrlValidators,
  requireAuth,
  asyncHandler(
    async (req: Request, res: CustomResponse<GeneratePresignedUrlResponse>) => {
      const { key, contentType } = req.body as GeneratePresignedUrlRequest

      try {
        const url = await getSignedUrl(
          s3Client,
          new PutObjectCommand({
            Bucket: process.env.R2_BUCKET_NAME,
            Key: key,
            ContentType: contentType,
            CacheControl: 'public, max-age=31536000', // 1 year
          }),
          { expiresIn: 3600 } // 1 hour
        )

        res.json({ url })
      } catch {
        res.status(500).json({ message: 'Failed to generate pre-signed URL' })
      }
    }
  )
)

export { router as blobRoutes }
