import { Router } from 'express'
import { Webhook } from 'svix'
import bodyParser from 'body-parser'
import prisma from '../../prisma/client'
import { asyncHandler } from '../../utils'

const router: Router = Router()

router.post(
  '/clerk',
  // This is a generic method to parse the contents of the payload.
  // Depending on the framework, packages, and configuration, this may be
  // different or not required.
  bodyParser.raw({ type: 'application/json' }),
  asyncHandler(async (req, res) => {
    const CLERK_SIGNING_SECRET = process.env.CLERK_SIGNING_SECRET

    if (!CLERK_SIGNING_SECRET) {
      throw new Error(
        'Error: Please add CLERK_SIGNING_SECRET from Clerk Dashboard to .env'
      )
    }

    // Create new Svix instance with secret
    const wh = new Webhook(CLERK_SIGNING_SECRET)

    // Get headers and body
    const headers = req.headers
    const payload = req.body

    // Get Svix headers for verification
    const svix_id = headers['svix-id']
    const svix_timestamp = headers['svix-timestamp']
    const svix_signature = headers['svix-signature']

    // If there are no headers, error out
    if (!svix_id || !svix_timestamp || !svix_signature) {
      return void res.status(400).json({
        success: false,
        message: 'Error: Missing svix headers',
      })
    }

    // Attempt to verify the incoming webhook
    // If successful, the payload will be available from 'evt'
    // If verification fails, error out and return error code

    // prettier-ignore
    const evt: any = wh.verify(payload, { // eslint-disable-line @typescript-eslint/no-explicit-any
      'svix-id': svix_id as string,
      'svix-timestamp': svix_timestamp as string,
      'svix-signature': svix_signature as string,
    })

    const eventType = evt.type

    // User creation should be triggered by first getUser of new user
    if (eventType === 'user.updated') {
      const clerkUserId = evt.data.id
      const verifiedEmails = evt.data.email_addresses.filter(
        (email_address: {
          id: string
          email_address: string
          verification: {
            status: string
          } | null
        }) => email_address.verification?.status === 'verified'
      )
      const primaryEmail = verifiedEmails.find(
        (email_address: { id: string; email_address: string }) =>
          email_address.id === evt.data.primary_email_address_id
      )?.email_address
      const emails = verifiedEmails.map(
        (email_address: { email_address: string }) =>
          email_address.email_address
      )
      const username = evt.data.username ?? ''
      const firstName = evt.data.first_name ?? primaryEmail?.split('@')[0] ?? ''
      const lastName = evt.data.last_name ?? ''
      const image = evt.data.image_url ?? ''

      await prisma.user.updateMany({
        data: {
          username,
          primaryEmail,
          emails,
          firstName,
          lastName,
          image,
        },
        where: {
          clerkUserId,
        },
      })
    }

    if (eventType === 'user.deleted') {
      const clerkUserId = evt.data.id

      await prisma.user.deleteMany({
        where: {
          clerkUserId,
        },
      })
    }

    return void res.status(200).json({
      success: true,
      message: 'Webhook received',
    })
  })
)

export { router as webhookRoutes }
