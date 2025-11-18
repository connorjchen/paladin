import { PrismaClient } from '@prisma/client'
import { PrismaNeon } from '@prisma/adapter-neon'
import { neonConfig } from '@neondatabase/serverless'
import ws from 'ws'

neonConfig.webSocketConstructor = ws

// To work in edge environments (Cloudflare Workers, Vercel Edge, etc.), enable querying over fetch
// neonConfig.poolQueryViaFetch = true

declare global {
   
  var prisma: PrismaClient | undefined
}

if (!process.env.POSTGRES_PRISMA_URL) {
  throw new Error('POSTGRES_PRISMA_URL is not defined')
}
const connectionString = process.env.POSTGRES_PRISMA_URL

const adapter = new PrismaNeon({ connectionString })
const prisma = global.prisma ?? new PrismaClient({ adapter })

if (process.env.NODE_ENV === 'development') global.prisma = prisma

export default prisma
