import {
  Prisma,
  FeedbackStatus,
  PostType,
  QuestionStatus,
  UserRole,
  CommunityPlan,
  ThemeMode,
} from '@prisma/client'

export interface ServerError {
  message: string
}

// --------------- FEATURES ---------------
export enum Feature {
  SUPPORT_AGENT = 'SUPPORT_AGENT',
  MAX_ADMINS = 'MAX_ADMINS',
  NO_PALADIN_WATERMARK = 'NO_PALADIN_WATERMARK',
}

export type FeatureConfigValue = string | number | boolean

export type FeaturePlanConfigMap = Record<
  Feature,
  Partial<Record<CommunityPlan, FeatureConfigValue>>
>

export const FeaturePlanConfigs: FeaturePlanConfigMap = {
  [Feature.SUPPORT_AGENT]: {
    [CommunityPlan.HOBBY]: false,
    [CommunityPlan.PRO]: false,
    [CommunityPlan.ENTERPRISE]: false,
  },
  [Feature.MAX_ADMINS]: {
    [CommunityPlan.HOBBY]: 1,
    [CommunityPlan.PRO]: 5,
    [CommunityPlan.ENTERPRISE]: Infinity,
  },
  [Feature.NO_PALADIN_WATERMARK]: {
    [CommunityPlan.HOBBY]: false,
    [CommunityPlan.PRO]: true,
    [CommunityPlan.ENTERPRISE]: true,
  },
}

// --------------- PRISMA OBJECT TYPES ---------------
// Basic = minimal included fields
// Detailed = some or all fields
export type BasicCommunity = Prisma.CommunityGetPayload<true>

export type BasicComment = Prisma.CommentGetPayload<true>

export type BasicUser = Prisma.UserGetPayload<true>

export type BasicPost = Prisma.PostGetPayload<true>

export type BasicUpvote = Prisma.UpvoteGetPayload<true>

export type BasicDiscordThread = Prisma.DiscordThreadGetPayload<true>

export type BasicDiscordMessageAttachment =
  Prisma.DiscordMessageAttachmentGetPayload<true>

export type BasicWatchedPost = Prisma.WatchedPostGetPayload<true>

export type BasicDocument = Prisma.DocumentGetPayload<true>

export type BasicDiscordChannel = Prisma.DiscordChannelGetPayload<true>

export type DetailedDiscordChannel = Prisma.DiscordChannelGetPayload<{
  include: {
    _count: {
      select: { threads: true }
    }
  }
}>

export type DetailedPostTag = Prisma.PostTagGetPayload<{
  include: {
    _count: {
      select: { posts: true }
    }
  }
}>

export type BasicExternalResource =
  Prisma.CommunityExternalResourceGetPayload<true>

export type DetailedDiscordThread = Prisma.DiscordThreadGetPayload<{
  include: {
    post: true
  }
}>

export type DetailedComment = Prisma.CommentGetPayload<{
  include: {
    author: true
    discordMessage: {
      include: {
        author: true
        attachments: true
      }
    }
  }
}>
export type DetailedUser = Prisma.UserGetPayload<{
  include: {
    upvotes: true
    watchedPosts: true
  }
}>
export type DetailedCommunity = Prisma.CommunityGetPayload<{
  include: {
    externalResources: true
    discordGuild: true
  }
}>
export type DetailedPost = Prisma.PostGetPayload<{
  include: {
    author: true
    discordThread: {
      include: {
        channel: true
        author: true
        starterMessageAttachments: true
      }
    }
    postTags: {
      include: {
        tag: true
      }
    }
    comments: {
      // Must follow DetailedComment
      include: {
        author: true
        discordMessage: {
          include: {
            author: true
            attachments: true
          }
        }
      }
    }
    _count: {
      select: {
        comments: true
        upvotes: true
      }
    }
  }
}>

export type AlgoliaPost = {
  objectID: string
  title: string
  content: string
  communityId: string
  createdAt: string // ISO string
}

export enum ChromaChunkType {
  QUESTION = 'question',
  DOCUMENT = 'document',
}

export type ChromaChunk = {
  id: string
  document: string // content of document or Q/A post content
  metadata: {
    source: ChromaChunkType
    sourceId: string // id of post or document
    communityId: string
    updatedAt: string // ISO string
  }
}

// --------------- CUSTOM TYPES ---------------
export enum PostOrderBy {
  MOST_RECENT = 'MOST_RECENT',
  MOST_UPVOTED = 'MOST_UPVOTED',
}

export enum PostFilter {
  ALL = 'ALL',
  QUESTION = 'QUESTION',
  FEEDBACK = 'FEEDBACK',
  PINNED = 'PINNED',
  MY_POSTS = 'MY_POSTS',
  FOLLOWING = 'FOLLOWING',
}

// --------------- REQUEST/RESPONSE TYPES ---------------

export type GetUserResponse = {
  user: DetailedUser
}

export type GetCommunityUsersResponse = {
  users: BasicUser[]
}

export type GetCommunityResponse = {
  community: DetailedCommunity
}

export type GetPostsRequest = {
  orderBy: PostOrderBy
  filter: PostFilter
  tagIds?: string[]
  limit?: number
  offset?: number
}

export type GetPostsResponse = {
  posts: DetailedPost[]
  page: number
  limit: number
  totalPages: number
  totalItems: number
}

export type GetRelevantPostsRequest = {
  query: string
}

export type GetRelevantPostsResponse = {
  posts: DetailedPost[]
}

export type GetRoadmapRequest = {
  orderBy: PostOrderBy
}

export type GetRoadmapResponse = {
  planned: DetailedPost[]
  inProgress: DetailedPost[]
  completed: DetailedPost[]
  underReview: DetailedPost[]
}

export type GetReviewPostsResponse = {
  feedback: DetailedPost[]
  questions: DetailedPost[]
}

export type GetPostResponse = {
  post: DetailedPost | null
  userAuthorizedToSeePost: boolean
}

export type CreatePostRequest = {
  title: string
  content: string
  type: PostType
  isPrivate: boolean
  tagIds?: string[] // post tag ids
}

export type CreatePostResponse = {
  postId: string
}

export type UpdatePostRequest = {
  title?: string
  content?: string
  type?: PostType
  isPrivate?: boolean
  tagIds?: string[] // post tag ids
}

export type GetDiscordChannelsResponse = {
  discordChannels: DetailedDiscordChannel[]
}

export type UpdateDiscordChannelRequest = {
  shouldSync: boolean
  defaultPostType: PostType
  defaultPostTagId?: string
}

export interface CreateCommentRequest {
  postId: string
  content: string
  parentId?: string
}

export type UpdateCommentRequest = {
  content: string
}

export type UpdateCommentResponse = {
  commentId: string
}

export type UpvotePostRequest = {
  isUpvote: boolean
}

export type WatchPostRequest = {
  isWatching: boolean
}

export type PinPostRequest = {
  isPinned: boolean
}

export type UpdateFeedbackStatusRequest = {
  status: FeedbackStatus
}

export type UpdateQuestionStatusRequest = {
  status: QuestionStatus
}

export type GeneratePresignedUrlRequest = {
  key: string
  contentType: string
}

export type GeneratePresignedUrlResponse = {
  url: string
}

export type UploadToBlobRequest = {
  file: File
  key: string
}

export type UploadToBlobResponse = {
  r2Key: string
}

export type MarkCommentAsAcceptedRequest = {
  isAcceptedAnswer: boolean
}

export type SetUserRoleRequest = {
  role: UserRole
}

export type GetExternalResourcesResponse = {
  resources: BasicExternalResource[]
}

export type CreateExternalResourceRequest = {
  name: string
  url: string
}

export type UpdateExternalResourceRequest = {
  name: string
  url: string
}

export type GetPostTagsResponse = {
  postTags: DetailedPostTag[]
}

export type CreatePostTagRequest = {
  name: string
  color: string
}

export type UpdatePostTagRequest = {
  name: string
  color: string
}

export type GetDocumentsResponse = {
  documents: BasicDocument[]
}

export type CreateDocumentRequest = {
  name: string
  r2Key: string
}

export type UpdateCommunityRequest = {
  name?: string
  logoR2Key?: string
  faviconR2Key?: string
  logoDarkR2Key?: string
  accentColor?: string
  accentColorDark?: string
  buttonTextColor?: string
  buttonTextColorDark?: string
  isRoadmapEnabled?: boolean
  isWebpageSubmissionsEnabled?: boolean
  themeMode?: ThemeMode
  isSupportAgentEnabled?: boolean
  discordGuildId?: string | null
}

export type GetDiscordInviteLinkResponse = {
  inviteLink?: string
}

export type CreateCommunityRequest = {
  name: string
  domain: string
}

export type CreateCommunityResponse = {
  error?: string
}

export type CreateUserRequest = {
  primaryEmail: string
  emails: string[]
  image: string
}

export type CreateSupportAgentChatRequest = {
  question: string
}

export type CreateSupportAgentChatResponse = {
  response: string
}

export type UpdateUserEmailNotificationsRequest = {
  isEmailNotificationsEnabled: boolean
}

export type UpdateAdminEmailNotificationsRequest = {
  isAdminEmailNotificationsEnabled: boolean
}
