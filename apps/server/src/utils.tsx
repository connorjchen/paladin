import React from 'react'
import { Response, NextFunction, Request } from 'express'
import { ValidationChain, validationResult } from 'express-validator'
import { ExpressRequestWithAuth } from '@clerk/express'
import NodeCache from 'node-cache'
import { google } from 'googleapis'
import {
  AlgoliaPost,
  BasicCommunity,
  BasicPost,
  BasicUser,
  ChromaChunk,
  ChromaChunkType,
  DetailedComment,
  DetailedPost,
  Feature,
  FeaturePlanConfigs,
  getDiscordUsernameIfExists,
  ServerError,
} from '@paladin/shared'
import prisma from './prisma/client'
import {
  algoliaClient,
  chromaClient,
  s3Client,
  openAIClient,
  resendClient,
  webmasters,
} from './clients'
import { RecursiveCharacterTextSplitter } from 'langchain/text_splitter'
import { createId } from '@paralleldrive/cuid2'
import { DeleteObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3'
import { extname } from 'path'
import pdf from 'pdf-parse'
import { marked } from 'marked'
import csv from 'csv-parser'
import { CommunityPlan, UserRole } from '@prisma/client'
import CommentNotificationEmail from './email-templates/CommentNotificationEmail'

export const ALGOLIA_POST_INDEX = 'posts_index'
export const CHROMA_QUESTION_COLLECTION = 'questions'
export const CHROMA_DOCUMENT_COLLECTION = 'documents'

function validateRequest(req: Request, res: Response, next: NextFunction) {
  const errors = validationResult(req)

  if (!errors.isEmpty()) {
    res.status(400).json({
      success: false,
      errors: errors.array().map((error) => ({
        type: error.type,
        message: error.msg,
      })),
    })
    return
  }

  next()
}

export type CustomResponse<T> = Response<T | ServerError>

export function createValidator(validators: ValidationChain[]) {
  return [...validators, validateRequest]
}

export function requireAuth(req: Request, res: Response, next: NextFunction) {
  const authReq = req as ExpressRequestWithAuth
  if (!authReq.auth.userId) {
    return next(UNAUTHENTICATED_ERROR)
  }
  next()
}

export const asyncHandler =
  (fn: (req: Request, res: Response, next: NextFunction) => Promise<unknown>) =>
  (req: Request, res: Response, next: NextFunction): void => {
    Promise.resolve(fn(req, res, next)).catch(next)
  }

export function isProduction() {
  return process.env.ENV === 'prod'
}

export const UNAUTHENTICATED_ERROR = new Error('UNAUTHENTICATED')

export const cache = new NodeCache({
  stdTTL: 60 * 60, // 1 hour
  checkperiod: 60 * 60 * 1.5, // 1.5 hours
})

export async function getCommunityFromReqStrict(
  req: Request
): Promise<BasicCommunity> {
  const communityId = req.headers['x-community-id'] as string

  if (!communityId) {
    throw new Error('Community ID is required')
  }

  const community = await prisma.community.findFirst({
    where: { id: communityId },
  })

  if (!community) {
    throw new Error('Community not found')
  }

  return community
}

export async function getUserFromReq(
  req: Request,
  communityId: string
): Promise<BasicUser | null> {
  const authReq = req as ExpressRequestWithAuth
  const clerkUserId = authReq.auth.userId

  if (!clerkUserId || !communityId) {
    return null
  }

  const user = await prisma.user.findUnique({
    where: {
      clerkUserId_communityId: { clerkUserId, communityId },
    },
  })

  return user
}

export async function getUserFromReqStrict(
  req: Request,
  communityId: string
): Promise<BasicUser> {
  const user = await getUserFromReq(req, communityId)
  if (!user) {
    throw new Error('User not found')
  }
  return user
}

const ADJECTIVES = [
  'helpful',
  'friendly',
  'wise',
  'kind',
  'bright',
  'clever',
  'brave',
  'calm',
  'cheerful',
  'creative',
  'curious',
  'daring',
  'eager',
  'energetic',
  'gentle',
  'grateful',
  'honest',
  'hopeful',
  'humble',
  'inspiring',
  'joyful',
  'loving',
  'loyal',
  'mindful',
  'optimistic',
  'patient',
  'peaceful',
  'positive',
  'proud',
  'reliable',
  'respectful',
  'sincere',
  'supportive',
  'thoughtful',
  'trustworthy',
  'understanding',
  'warm',
  'welcoming',
  'wonderful',
  'amazing',
  'awesome',
  'brilliant',
  'caring',
  'compassionate',
  'dedicated',
  'encouraging',
  'generous',
  'motivated',
  'passionate',
]

const NOUNS = [
  'helper',
  'friend',
  'guide',
  'mentor',
  'supporter',
  'advisor',
  'coach',
  'teacher',
  'leader',
  'champion',
  'advocate',
  'ally',
  'partner',
  'companion',
  'buddy',
  'pal',
  'assistant',
  'consultant',
  'expert',
  'specialist',
  'guru',
  'wizard',
  'hero',
  'guardian',
  'protector',
  'defender',
  'warrior',
  'knight',
  'soldier',
  'scout',
  'explorer',
  'pioneer',
  'trailblazer',
  'innovator',
  'creator',
  'builder',
  'craftsman',
  'artisan',
  'master',
  'virtuoso',
  'genius',
  'scholar',
  'student',
  'learner',
  'seeker',
  'discoverer',
  'researcher',
  'investigator',
  'detective',
  'solver',
  'fixer',
]

export function generateRandomUsername(): string {
  const randomAdjective =
    ADJECTIVES[Math.floor(Math.random() * ADJECTIVES.length)]
  const randomNoun = NOUNS[Math.floor(Math.random() * NOUNS.length)]
  const randomNumber = Math.floor(Math.random() * 900) + 100 // 100-999

  return `${randomAdjective}${randomNoun}${randomNumber}`
}

export async function indexAlgoliaPost(post: BasicPost) {
  if (post.private) {
    return
  }

  await algoliaClient.saveObject({
    indexName: ALGOLIA_POST_INDEX,
    body: convertToAlgoliaPost(post),
  })
}

export async function batchIndexAlgoliaPosts(posts: BasicPost[]) {
  const algoliaPosts: AlgoliaPost[] = posts
    .filter((post) => !post.private)
    .map(convertToAlgoliaPost)

  await algoliaClient.saveObjects({
    indexName: ALGOLIA_POST_INDEX,
    objects: algoliaPosts,
  })
}

export async function deleteAlgoliaPost(postId: string) {
  await algoliaClient.deleteObject({
    indexName: ALGOLIA_POST_INDEX,
    objectID: postId,
  })
}

export function convertToAlgoliaPost(post: BasicPost): AlgoliaPost {
  return {
    objectID: post.id,
    title: post.title,
    content: post.content,
    communityId: post.communityId,
    createdAt: post.createdAt.toISOString(),
  }
}

export async function getChromaCollection(collectionName: string) {
  return await chromaClient.getOrCreateCollection({
    name: collectionName,
  })
}

export async function chunkText(text: string) {
  const splitter = new RecursiveCharacterTextSplitter({
    chunkSize: 500,
    chunkOverlap: 100,
  })

  const docs = await splitter.createDocuments([text])
  return docs // Array of { pageContent: string, metadata: {} }
}

export async function deleteChromaPost(postId: string) {
  const collection = await getChromaCollection(CHROMA_QUESTION_COLLECTION)
  await collection.delete({
    where: { sourceId: postId },
  })
}

export async function indexChromaPost(
  postId: string,
  question: string,
  answer: string,
  communityId: string
) {
  const collection = await getChromaCollection(CHROMA_QUESTION_COLLECTION)

  // Delete any existing chunks for this post (in event of new comment marked as answer)
  await collection.delete({
    where: {
      sourceId: postId,
    },
  })

  const questionChunks = await chunkText(question)
  const answerChunks = await chunkText(answer)

  const documents: ChromaChunk[] = []
  for (const q of questionChunks) {
    for (const a of answerChunks) {
      documents.push({
        id: createId(),
        document: `Question: ${q.pageContent}\n\nAnswer: ${a.pageContent}`,
        metadata: {
          source: ChromaChunkType.QUESTION,
          sourceId: postId,
          communityId,
          updatedAt: new Date().toISOString(),
        },
      })
    }
  }

  await collection.add({
    ids: documents.map((doc) => doc.id),
    documents: documents.map((doc) => doc.document),
    metadatas: documents.map((doc) => doc.metadata),
  })
}

export async function deleteR2Object(r2Key: string) {
  const bucket = process.env.R2_BUCKET_NAME || ''
  const deleteObjCmd = new DeleteObjectCommand({
    Bucket: bucket,
    Key: r2Key,
  })
  await s3Client.send(deleteObjCmd)
}

export async function deleteChromaDocument(documentId: string) {
  const collection = await getChromaCollection(CHROMA_DOCUMENT_COLLECTION)
  await collection.delete({
    where: { sourceId: documentId },
  })
}

export async function indexChromaDocument(
  documentId: string,
  r2Key: string,
  communityId: string
) {
  const collection = await getChromaCollection(CHROMA_DOCUMENT_COLLECTION)

  // Delete any existing chunks for this post (in case of accidental re-upload)
  await collection.delete({
    where: {
      sourceId: documentId,
    },
  })

  // Get document from R2 using s3Client
  const bucket = process.env.R2_BUCKET_NAME || ''
  const getObjCmd = new GetObjectCommand({
    Bucket: bucket,
    Key: r2Key,
  })
  const obj = await s3Client.send(getObjCmd)

  let fileText = ''
  const fileExtension = extname(r2Key).toLowerCase()

  if (obj.Body) {
    if (fileExtension === '.pdf') {
      // Parse PDF
      const buffer = await streamToBuffer(obj.Body)
      const pdfData = await pdf(buffer)
      fileText = pdfData.text
    } else if (fileExtension === '.md') {
      // Parse Markdown
      const markdownText = await streamToString(obj.Body)
      fileText = await marked.parse(markdownText)
    } else if (fileExtension === '.csv') {
      // Parse CSV
      const csvText = await streamToString(obj.Body)
      const rows: string[] = []

      return new Promise<void>((resolve, reject) => {
        const stream = require('stream')
        const readable = stream.Readable.from([csvText])

        readable
          .pipe(csv())
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          .on('data', (row: any) => {
            rows.push(Object.values(row).join(', '))
          })
          .on('end', async () => {
            fileText = rows.join('\n')
            await processTextChunks()
            resolve()
          })
          .on('error', reject)
      })
    } else if (fileExtension === '.json') {
      // Parse JSON
      const jsonText = await streamToString(obj.Body)
      try {
        const jsonData = JSON.parse(jsonText)
        fileText = JSON.stringify(jsonData, null, 2)
      } catch (error) {
        console.error('Error parsing JSON:', error)
        fileText = jsonText
      }
    } else {
      // Default to text for .txt and other files
      fileText = await streamToString(obj.Body)
    }
  }

  async function processTextChunks() {
    if (!fileText.trim()) {
      console.warn('No text content extracted from file')
      return
    }

    const chunks = await chunkText(fileText)

    const documents: ChromaChunk[] = chunks.map((chunk) => ({
      id: createId(),
      document: chunk.pageContent,
      metadata: {
        source: ChromaChunkType.DOCUMENT,
        sourceId: documentId,
        communityId,
        updatedAt: new Date().toISOString(),
      },
    }))

    if (documents.length > 0) {
      await collection.add({
        ids: documents.map((doc) => doc.id),
        documents: documents.map((doc) => doc.document),
        metadatas: documents.map((doc) => doc.metadata),
      })
    }
  }

  // Process chunks for non-CSV files
  if (fileExtension !== '.csv') {
    await processTextChunks()
  }
}

const streamToString = async (
  stream: any // eslint-disable-line @typescript-eslint/no-explicit-any
) =>
  await new Promise<string>((resolve, reject) => {
    const chunks: Buffer[] = []
    stream.on('data', (chunk: Buffer) => chunks.push(chunk))
    stream.on('error', reject)
    stream.on('end', () => resolve(Buffer.concat(chunks).toString('utf-8')))
  })

const streamToBuffer = async (
  stream: any // eslint-disable-line @typescript-eslint/no-explicit-any
) =>
  await new Promise<Buffer>((resolve, reject) => {
    const chunks: Buffer[] = []
    stream.on('data', (chunk: Buffer) => chunks.push(chunk))
    stream.on('error', reject)
    stream.on('end', () => resolve(Buffer.concat(chunks)))
  })

// Generate markdown formatting description
function generateMarkdownDescription(): string {
  return `You must respond using markdown formatting. Here are the markdown elements you can use:

- **Bold text**: Use **text** or __text__
- *Italic text*: Use *text* or _text_
- Headings: Use # Heading 1, ## Heading 2, ### Heading 3, etc.
- Lists: Use - for bullet lists or 1. 2. 3. for numbered lists
- Code blocks: Use \`\`\`language\ncode\n\`\`\` for blocks or \`code\` for inline
- Blockquotes: Use > quoted text
- Links: Use [link text](URL)
- Images: Use ![alt text](image URL)

Format your response as plain markdown text, not JSON.`
}

export const generateSupportAgentResponse = async (
  question: string,
  communityId: string
): Promise<{
  answer: string
}> => {
  try {
    // Get relevant documents from document collection
    const documentCollection = await getChromaCollection(
      CHROMA_DOCUMENT_COLLECTION
    )
    const documentResults = await documentCollection.query({
      queryTexts: [question],
      nResults: 5,
      where: { communityId },
    })

    // Get relevant previous Q&A from question collection
    const questionCollection = await getChromaCollection(
      CHROMA_QUESTION_COLLECTION
    )
    const questionResults = await questionCollection.query({
      queryTexts: [question],
      nResults: 3,
      where: { communityId },
    })

    // Extract document ids
    const documentIds = documentResults.documents
      .map(
        (_, index) =>
          (documentResults.metadatas[0]?.[index] as any)?.sourceId as string // eslint-disable-line @typescript-eslint/no-explicit-any
      )
      .filter((id) => id !== undefined)

    // Extract question ids
    const questionIds = questionResults.documents
      .map(
        (_, index) =>
          (questionResults.metadatas[0]?.[index] as any)?.sourceId as string // eslint-disable-line @typescript-eslint/no-explicit-any
      )
      .filter((id) => id !== undefined)

    const community = await prisma.community.findUniqueOrThrow({
      where: { id: communityId },
      select: {
        domain: true,
      },
    })

    const documentsObjects = await prisma.document.findMany({
      where: { id: { in: documentIds } },
      select: {
        id: true,
        name: true,
        r2Key: true,
      },
    })

    const questionsObjects = await prisma.post.findMany({
      where: { id: { in: questionIds } },
      select: {
        id: true,
        title: true,
      },
    })

    // Create document context (without links)
    const documentContext =
      documentResults.documents
        .filter((doc) => doc.length > 0)
        .map((doc) => {
          return `Document: ${doc}`
        })
        .join('\n\n') || 'No documents found'

    // Create question context (without links)
    const qaContext =
      questionResults.documents
        .filter((doc) => doc.length > 0)
        .map((doc) => {
          return `Previous Q&A: ${doc}`
        })
        .join('\n\n') || 'No previous Q&A found'

    // Create separate JSON mapping of name/title to URL
    const documentLinks = documentsObjects.reduce(
      (acc, doc) => {
        acc[doc.name] = `${process.env.R2_BUCKET_URL}/${doc.r2Key}`
        return acc
      },
      {} as Record<string, string>
    )

    const questionLinks = questionsObjects.reduce(
      (acc, question) => {
        acc[question.title] = community.domain.startsWith('localhost')
          ? `http://${community.domain}/post/${question.id}`
          : `https://${community.domain}/post/${question.id}`
        return acc
      },
      {} as Record<string, string>
    )

    // Combine all context
    const combinedContext = `${documentContext}\n\n${qaContext}`.trim()

    // Create the prompt with explicit instruction to not guess and use markdown format
    const systemPrompt = `You are a helpful support agent for a community platform. Your role is to answer questions based on the provided documentation and previous Q&A history.

IMPORTANT: If you do not know the answer based on the provided context, explicitly say "I do not have enough information to answer this question accurately. Please contact support or check the documentation for more details." Do not guess or make up information.

RESPONSE FORMAT: ${generateMarkdownDescription()}

When answering:
1. Use only the information provided in the context
2. Be concise but thorough
3. If the context contains relevant information, provide a clear answer with proper formatting
4. If the context is insufficient, clearly state that you cannot provide an accurate answer
5. Always prioritize accuracy over completeness
6. Use appropriate markdown formatting to make your response clear and readable

Context from documentation and previous Q&A:
${combinedContext}

User question: ${question}`

    // Generate response using Azure OpenAI
    const response = await openAIClient.chat.completions.create({
      model: process.env.AZURE_OPENAI_DEPLOYMENT || '',
      messages: [
        {
          role: 'system',
          content: systemPrompt,
        },
        {
          role: 'user',
          content: question,
        },
      ],
      temperature: 0.3, // Lower temperature for more focused responses
      max_tokens: 500,
      top_p: 0.9,
    })

    let answer =
      response.choices[0]?.message?.content ||
      'I apologize, but I was unable to generate a response. Please try again.'

    // Combine documentLinks and questionLinks, add as reference materials in markdown
    const combinedLinks = [
      ...Object.entries(documentLinks),
      ...Object.entries(questionLinks),
    ]

    if (combinedLinks.length > 0) {
      answer += '\n\n**Reference Materials:**\n'
      combinedLinks.forEach(([label, url]) => {
        answer += `- [${label}](${url})\n`
      })
    }

    return {
      answer,
    }
  } catch (error) {
    console.error('Error generating support agent response:', error)
    return {
      answer:
        'I apologize, but I encountered an error while processing your question. Please try again or contact support.',
    }
  }
}

export function requireAdmin(user: BasicUser) {
  if (user.role !== UserRole.ADMIN) {
    throw new Error('Requires admin permissions')
  }
}

export async function watchPost(
  postId: string,
  userId: string,
  isWatching: boolean
) {
  if (isWatching) {
    await prisma.watchedPost.upsert({
      where: { postId_userId: { postId, userId } },
      update: {},
      create: { postId, userId },
    })
  } else {
    await prisma.watchedPost.deleteMany({
      where: { postId, userId },
    })
  }
}

export async function sendCommentNotification(
  user: BasicUser,
  post: BasicPost,
  comment: DetailedComment,
  community: BasicCommunity
) {
  const headers = {
    'List-Unsubscribe': `<https://${community.domain}/following>`,
  }
  const from = `${community.name} <updates@trypaladin.com>`
  const subject = `New comment on "${post.title}" in ${community.name}`
  const authorUsername = getDiscordUsernameIfExists(comment)

  await sendEmail(
    user.isEmailNotificationsEnabled,
    user.primaryEmail,
    headers,
    from,
    subject,
    <CommentNotificationEmail
      postTitle={post.title}
      authorName={authorUsername}
      commentText={comment.content}
      postUrl={`https://${community.domain}/post/${post.id}`}
      manageEmailPreferencesUrl={`https://${community.domain}/following`}
    />
  )
}

export async function sendAdminNotification(
  user: BasicUser,
  post: DetailedPost,
  community: BasicCommunity
) {
  const headers = {
    'List-Unsubscribe': `<https://${community.domain}/review-posts>`,
  }
  const from = `${community.name} <updates@trypaladin.com>`
  const subject = `New post under review: "${post.title}" in ${community.name}`
  const authorUsername = getDiscordUsernameIfExists(post)

  await sendEmail(
    user.isAdminEmailNotificationsEnabled,
    user.primaryEmail,
    headers,
    from,
    subject,
    <CommentNotificationEmail
      postTitle={post.title}
      authorName={authorUsername}
      commentText={post.content}
      postUrl={`https://${community.domain}/post/${post.id}`}
      manageEmailPreferencesUrl={`https://${community.domain}/following`}
    />
  )
}

export async function sendEmail(
  isEmailNotificationsEnabled: boolean,
  to: string,
  headers: Record<string, string>,
  from: string,
  subject: string,
  react: React.ReactNode
) {
  if (!isProduction() || !isEmailNotificationsEnabled) {
    return
  }

  const response = await resendClient.emails.send({
    headers,
    from,
    to,
    subject,
    react,
  })

  if (response.error) {
    console.error('Error sending email', response.error)
  }
}

export const isEnabled = (
  communityPlan: CommunityPlan,
  feature: Feature
): boolean => {
  const config = FeaturePlanConfigs[feature]
  if (!config) return false

  const value = config[communityPlan]
  if (value === undefined) return false

  return value as boolean
}

export const getValue = (
  communityPlan: CommunityPlan,
  feature: Feature
): string | number | boolean | undefined => {
  const config = FeaturePlanConfigs[feature]
  if (!config) return undefined

  return config[communityPlan]
}

export const getPaginationParams = (
  limit: number | undefined,
  offset: number | undefined,
  totalItems: number
): {
  limit: number
  actualOffset: number
  page: number
  totalPages: number
} => {
  const actualLimit = limit ?? totalItems
  const actualOffset = offset ?? 0
  const page = actualLimit ? Math.floor(actualOffset / actualLimit) + 1 : 1
  const totalPages = actualLimit ? Math.ceil(totalItems / actualLimit) : 1

  return {
    limit: actualLimit,
    actualOffset,
    page,
    totalPages,
  }
}

export async function submitSitemap(sitemapUrl: string) {
  const siteUrl = 'sc-domain:trypaladin.com'
  await webmasters.sitemaps.submit({ siteUrl, feedpath: sitemapUrl })
}

export async function deleteSitemap(sitemapUrl: string) {
  const siteUrl = 'sc-domain:trypaladin.com'
  await webmasters.sitemaps.delete({ siteUrl, feedpath: sitemapUrl })
}
