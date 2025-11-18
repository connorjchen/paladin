import 'dotenv/config'
import express, { NextFunction, Response, Request } from 'express'
import cors from 'cors'
import { clerkMiddleware } from '@clerk/express'
import { discordClient, posthogClient } from './clients'
import { getUserFromReq, isProduction, UNAUTHENTICATED_ERROR } from './utils'
import { webhookRoutes } from './routes/internal/webhook'
import { userRoutes } from './routes/internal/user'
import { communityRoutes } from './routes/internal/community'
import { postRoutes } from './routes/internal/post'
import { commentRoutes } from './routes/internal/comment'
import { blobRoutes } from './routes/internal/blob'
import { externalResourceRoutes } from './routes/internal/externalResource'
import { postTagRoutes } from './routes/internal/postTag'
import { documentRoutes } from './routes/internal/document'
import { supportAgentRoutes } from './routes/internal/supportAgent'
import { healthRoutes } from './routes/internal/health'
import NodeCache from 'node-cache'
import prisma from './prisma/client'
import { setupDiscordEvents } from './discord'
import { sitemapRoutes } from './routes/internal/sitemap'
import { discordRoutes } from './routes/internal/discord'

const app = express()
const port = process.env.PORT || 5000

export const cache = new NodeCache({
  stdTTL: 60 * 60, // 1 hour
  checkperiod: 60 * 60 * 1.5, // 1.5 hours
})

async function getAllowedDomains() {
  const cacheKey = 'allowedDomains'
  let domains = cache.get<string[]>(cacheKey)

  if (!domains) {
    const dbDomains = await prisma.community.findMany({
      select: { domain: true },
      where: { domain: { contains: '.' } },
    })
    domains = dbDomains.map((d) => d.domain)
    cache.set(cacheKey, domains)
  }

  return domains
}

app.use(
  cors({
    origin: async (origin, callback) => {
      // In non-prod, allow all
      if (!isProduction()) {
        return callback(null, true)
      }

      // Allow no-origin requests (curl, Postman, etc)
      if (!origin) return callback(null, true)

      // Always allow *.trypaladin.com
      if (
        /\.trypaladin\.com$/.test(origin)
      )
        return callback(null, true)

      // Strip protocol
      const host = new URL(origin).host

      // Otherwise, check domains in DB
      try {
        const domains = await getAllowedDomains()
        if (domains.includes(host)) {
          return callback(null, true)
        }
        return callback(new Error('Not allowed by CORS'))
      } catch (err) {
        return callback(err instanceof Error ? err : new Error('CORS error'))
      }
    },
    credentials: true,
  })
)

// express.json() middleware for non-webhook routes
app.use((req, res, next) => {
  const start = performance.now()
  if (!req.path.startsWith('/internal/webhook')) {
    express.json()(req, res, next)
  } else {
    next()
  }
  if (!isProduction()) {
    const end = performance.now()
    console.log(`${req.path} took ${end - start}ms`)
  }
})

// Clerk auth middleware
app.use(clerkMiddleware())

app.get('/', (_, res: Response) => {
  res.send(`Server up and running!`)
})

app.use('/health', healthRoutes)
app.use('/internal/webhook', webhookRoutes)
app.use('/internal/user', userRoutes)
app.use('/internal/community', communityRoutes)
app.use('/internal/post', postRoutes)
app.use('/internal/comment', commentRoutes)
app.use('/internal/blob', blobRoutes)
app.use('/internal/external-resource', externalResourceRoutes)
app.use('/internal/post-tag', postTagRoutes)
app.use('/internal/document', documentRoutes)
app.use('/internal/support-agent', supportAgentRoutes)
app.use('/internal/discord', discordRoutes)
app.use('/internal/sitemap', sitemapRoutes)

// Setup Discord events
setupDiscordEvents(discordClient)
discordClient.login(process.env.DISCORD_BOT_TOKEN)

// Error handling middleware
app.use(
  async (
    err: Error,
    req: Request,
    res: Response,
    next: NextFunction // eslint-disable-line @typescript-eslint/no-unused-vars
  ) => {
    let userId = 'no-server-user-id'
    let communityId = 'no-server-community-id'
    try {
      communityId = req.headers['x-community-id'] as string
      const user = await getUserFromReq(req, communityId)
      if (user) {
        userId = user.id
      }
    } catch {
      // Intentionally empty - ignore errors
    }

    if (err === UNAUTHENTICATED_ERROR) {
      res.status(401).send('Unauthenticated')
      return
    }

    console.error(err.stack)
    if (isProduction()) {
      posthogClient.capture({
        distinctId: userId,
        event: 'server-error',
        properties: {
          origin: req.headers.origin,
          communityId,
          message: err.message,
          stack: err.stack,
          path: req.path,
          method: req.method,
          query: req.query,
          body: req.body,
          ip: req.ip,
          userAgent: req.headers['user-agent'],
          timestamp: new Date().toISOString(),
          statusCode: res.statusCode,
          referer: req.headers.referer,
        },
      })
    }
    res.status(400).send('Server error')
  }
)

app.listen(port, () => {
  return console.log(`Listening at http://localhost:${port}`)
})
