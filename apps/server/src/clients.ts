import { PostHog } from 'posthog-node'
import { createClerkClient } from '@clerk/express'
import { Resend } from 'resend'
import Stripe from 'stripe'
import { algoliasearch } from 'algoliasearch'
import { CloudClient as ChromaCloudClient } from 'chromadb'
import { S3Client } from '@aws-sdk/client-s3'
import { AzureOpenAI } from 'openai'
import { Client, GatewayIntentBits } from 'discord.js'
import { google } from 'googleapis'

export const posthogClient = new PostHog(process.env.POSTHOG_KEY || '', {
  host: 'https://us.i.posthog.com',
})

export const clerkClient = createClerkClient({
  secretKey: process.env.CLERK_SECRET_KEY,
})

export const resendClient = new Resend(process.env.RESEND_API_KEY)

export const stripeClient = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2025-02-24.acacia',
})

export const algoliaClient = algoliasearch(
  process.env.ALGOLIA_APPLICATION_ID || '',
  process.env.ALGOLIA_WRITE_API_KEY || ''
)
export const chromaClient = new ChromaCloudClient({
  apiKey: process.env.CHROMA_API_KEY,
  tenant: process.env.CHROMA_TENANT_ID,
  database: process.env.CHROMA_DATABASE_NAME,
})

export const s3Client = new S3Client({
  region: 'auto',
  endpoint: process.env.R2_S3_ENDPOINT || '',
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY || '',
  },
})

export const openAIClient = new AzureOpenAI({
  apiKey: process.env.AZURE_OPENAI_API_KEY || '',
  endpoint: process.env.AZURE_OPENAI_ENDPOINT || '',
  deployment: process.env.AZURE_OPENAI_DEPLOYMENT || '',
  apiVersion: process.env.AZURE_OPENAI_API_VERSION || '',
})

// OAuth2 token should have bot scope and these permissions:
// - "Create Invite"
// - "View Channels"
// - "Send Messages"
// - "Send Messages in Threads"
// - "Create Public Threads"
// - "Manage Threads"
// - "Embed Links"
// - "Read Message History"
// - "Add Reactions"
// - "Use Application Commands"
// (permission code 328565083201)
export const discordClient = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildMessageReactions,
  ],
})

if (!process.env.GSC_SERVICE_KEY) {
  throw new Error('GSC_SERVICE_KEY is not set')
}

const key = JSON.parse(process.env.GSC_SERVICE_KEY)

const auth = new google.auth.GoogleAuth({
  credentials: key,
  scopes: ['https://www.googleapis.com/auth/webmasters'],
})

export const webmasters = google.webmasters({ version: 'v3', auth })
