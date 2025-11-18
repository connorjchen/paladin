/* eslint-disable @typescript-eslint/no-explicit-any */

import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'
import { axiosClient } from './axiosClient'
import { emitToast } from '@/hooks/use-toast'
import posthog from 'posthog-js'
import { AxiosError } from 'axios'
import {
  BasicUpvote,
  DetailedComment,
  DetailedPost,
  DetailedUser,
  DISCORD_BOT_USER_ID,
  UploadToBlobRequest,
  UploadToBlobResponse,
} from '@paladin/shared'
import Compressor from 'compressorjs'
import { useBlobStore } from '@/stores/blob'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function pluralize(count: number, singular: string, plural?: string) {
  return count === 1
    ? `${count} ${singular}`
    : `${count} ${plural ?? `${singular}s`}`
}

export function getR2Url(key?: string | null) {
  const R2_BUCKET_URL = import.meta.env.VITE_R2_BUCKET_URL

  if (!key || !R2_BUCKET_URL) {
    return ''
  }

  // URL encode the key to handle spaces and special characters
  const encodedKey = encodeURIComponent(key)
  return `${R2_BUCKET_URL}/${encodedKey}`
}

export function getSubpathPath(subpath: string | undefined, path: string) {
  const transformedPath = path === '/' ? '' : path
  if (
    subpath &&
    !(
      transformedPath.startsWith(`/s/${subpath}`) ||
      transformedPath.startsWith('/s/')
    )
  ) {
    return `/s/${subpath}${transformedPath}`
  }
  return transformedPath
}

export const setupAxiosAuth = (getToken: () => Promise<string | null>) => {
  axiosClient.interceptors.request.use(async (config) => {
    const token = await getToken()
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    } else {
      config.headers.Authorization = undefined
    }
    return config
  })
}

export const setupAxiosCommunityHeader = (communityId: string) => {
  axiosClient.interceptors.request.use((config) => {
    config.headers['x-community-id'] = communityId
    return config
  })
}
export interface Result<T> {
  data?: T
  error?: Error
}

export type RecursivePartial<T> = {
  [P in keyof T]?: RecursivePartial<T[P]>
}

// Recursively convert ISO date strings to Date objects
function convertDates(obj: any): any {
  if (obj === null || obj === undefined) return obj
  if (typeof obj !== 'object') return obj

  if (Array.isArray(obj)) {
    return obj.map(convertDates)
  }

  const converted: any = {}
  for (const [key, value] of Object.entries(obj)) {
    if (
      typeof value === 'string' &&
      /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/.test(value)
    ) {
      // Check if it looks like an ISO date string
      const date = new Date(value)
      if (!isNaN(date.getTime())) {
        converted[key] = date
      } else {
        converted[key] = value
      }
    } else if (typeof value === 'object' && value !== null) {
      converted[key] = convertDates(value)
    } else {
      converted[key] = value
    }
  }
  return converted
}

export const errorWrapper = <T>(operation: () => Promise<T>) => {
  return async () => {
    try {
      const result = await operation()
      return { data: convertDates(result) }
    } catch (error: unknown) {
      return handleError({
        error,
        toastTitle: 'Server error',
        posthogProperties: {
          operation: operation.toString(),
        },
      })
    }
  }
}

export function isProduction() {
  return import.meta.env.VITE_ENV === 'prod'
}

export function handleError({
  error,
  toastTitle,
  toastDescription,
  posthogProperties = {},
}: {
  error: unknown
  toastTitle: string
  toastDescription?: string
  posthogProperties?: Record<string, string>
}) {
  let transformedError: Error
  let outputTitle = toastTitle
  let outputDescription =
    toastDescription ?? 'Please contact support if the issue persists'
  let isCriticalError = true

  if (error instanceof AxiosError) {
    const status = error.response?.status
    if (status === 401) {
      outputTitle = 'Unauthenticated'
      outputDescription = 'Please sign in to continue'
      isCriticalError = false
    } else if (status === 404) {
      outputTitle = 'Not found'
      isCriticalError = false
    } else if (status === 429) {
      outputTitle = 'Too many requests'
      outputDescription = 'Please try again in a few minutes'
      isCriticalError = false
    } else if (!error.response) {
      outputTitle = 'Network error'
      outputDescription = 'Please check your internet connection'
      isCriticalError = false
    }

    transformedError = error
  } else if (error instanceof Error) {
    if (
      error.message ===
      'This sign in token has already been used. Each token can only be used once.'
    ) {
      outputTitle = 'Sign in link has already been used'
      outputDescription = 'Please sign in using your credentials'
      isCriticalError = false
    }
    transformedError = error
  } else {
    transformedError = new Error(String(error))
  }

  posthogProperties = {
    ...posthogProperties,
    message: transformedError.message,
    stack: transformedError.stack ?? '',
  }

  if (isCriticalError) {
    posthog.capture('frontend-critical-error', posthogProperties)
  } else {
    posthog.capture('frontend-non-critical-error', posthogProperties)
  }

  emitToast({
    title: outputTitle,
    description: outputDescription,
  })

  return { error: transformedError }
}

export function getFullName(
  firstName: string | undefined,
  lastName: string | undefined
) {
  return `${firstName} ${lastName}`
}

export function hasUserUpvoted(user: DetailedUser, postId: string) {
  return user.upvotes.some((upvote: BasicUpvote) => upvote.postId === postId)
}

export function dateToHumanFriendlyString(date: Date) {
  const now = new Date()
  const SECONDS_IN_MINUTE = 60
  const SECONDS_IN_HOUR = SECONDS_IN_MINUTE * 60
  const SECONDS_IN_DAY = SECONDS_IN_HOUR * 24
  const SECONDS_IN_WEEK = SECONDS_IN_DAY * 7

  let diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000)
  if (diffInSeconds < 0) diffInSeconds = 0

  if (diffInSeconds < SECONDS_IN_HOUR) {
    // Less than an hour
    const minutes = Math.floor(diffInSeconds / SECONDS_IN_MINUTE)
    return `${pluralize(minutes, 'minute')} ago`
  } else if (diffInSeconds < SECONDS_IN_DAY) {
    // Less than a day
    const hours = Math.floor(diffInSeconds / SECONDS_IN_HOUR)
    return `${pluralize(hours, 'hour')} ago`
  } else if (diffInSeconds < SECONDS_IN_WEEK) {
    // Less than a week
    const days = Math.floor(diffInSeconds / SECONDS_IN_DAY)
    return `${pluralize(days, 'day')} ago`
  } else {
    // Over a week
    return date.toLocaleDateString('en-US') // Short version of date
  }
}

export const compressImage = (file: File) => {
  return new Promise<File>((resolve, reject) => {
    new Compressor(file, {
      quality: 0.6,
      convertSize: Infinity,
      success(result) {
        const compressedFile = new File([result], file.name, {
          type: result.type,
        })
        resolve(compressedFile)
      },
      error() {
        reject(new Error('Error compressing image'))
      },
    })
  })
}

function isIcoFile(file: File): boolean {
  const type = file.type.toLowerCase()
  const name = file.name.toLowerCase()
  return (
    type === 'image/x-icon' ||
    type === 'image/vnd.microsoft.icon' ||
    name.endsWith('.ico')
  )
}

function replaceFileExtension(path: string, newExtension: string): string {
  const lastSlashIndex = path.lastIndexOf('/')
  const directory = lastSlashIndex >= 0 ? path.slice(0, lastSlashIndex + 1) : ''
  const filename = lastSlashIndex >= 0 ? path.slice(lastSlashIndex + 1) : path
  const dotIndex = filename.lastIndexOf('.')
  const base = dotIndex >= 0 ? filename.slice(0, dotIndex) : filename
  return `${directory}${base}.${newExtension}`
}

async function convertToWebP(file: File): Promise<File> {
  return new Promise<File>((resolve, reject) => {
    new Compressor(file, {
      quality: 0.6,
      mimeType: 'image/webp',
      convertSize: Infinity,
      success(result) {
        try {
          const converted = new File(
            [result],
            replaceFileExtension(file.name, 'webp'),
            {
              type: 'image/webp',
            }
          )
          resolve(converted)
        } catch (err) {
          reject(err)
        }
      },
      error(err) {
        reject(err)
      },
    })
  })
}

export async function uploadImageToBlob(
  file: File,
  key: string,
  uploadToBlob: (
    data: UploadToBlobRequest
  ) => Promise<Result<UploadToBlobResponse>>
): Promise<{ r2Key: string } | null> {
  try {
    let fileToUpload = file
    let uploadKey = key

    if (file.type.startsWith('image/') && !isIcoFile(file)) {
      fileToUpload = await convertToWebP(file)
      uploadKey = replaceFileExtension(key, 'webp')
    }

    const result = await uploadToBlob({ file: fileToUpload, key: uploadKey })

    if (result.data) {
      return { r2Key: result.data.r2Key }
    }
    return null
  } catch (error: unknown) {
    handleError({ error, toastTitle: 'Error uploading image' })
    return null
  }
}

export function stripMarkdown(content: string): string {
  return (
    content
      // Remove images: ![alt text](url) or ![alt text](url "title")
      .replace(/!\[([^\]]*)\]\([^)]*\)/g, '')
      // Remove links but keep text: [text](url) -> text
      .replace(/\[([^\]]+)\]\([^)]*\)/g, '$1')
      // Remove headers: # ## ### etc.
      .replace(/^#{1,6}\s+/gm, '')
      // Remove bold/italic: **text** or *text* or __text__ or _text_
      .replace(/\*\*([^*]+)\*\*/g, '$1')
      .replace(/\*([^*]+)\*/g, '$1')
      .replace(/__([^_]+)__/g, '$1')
      .replace(/_([^_]+)_/g, '$1')
      // Remove strikethrough: ~~text~~
      .replace(/~~([^~]+)~~/g, '$1')
      // Remove inline code: `code`
      .replace(/`([^`]+)`/g, '$1')
      // Remove code blocks: ```code``` or ```language\ncode```
      .replace(/```[\s\S]*?```/g, '')
      // Remove blockquotes: > text
      .replace(/^>\s+/gm, '')
      // Remove list markers: - * + 1. etc.
      .replace(/^[\s]*[-*+]\s+/gm, '')
      .replace(/^[\s]*\d+\.\s+/gm, '')
      // Remove horizontal rules: --- or ***
      .replace(/^[-*]{3,}$/gm, '')
      // Clean up extra whitespace
      .replace(/\n\s*\n/g, '\n')
      .trim()
  )
}

// Converts a string like "THIS_IS_A_TEST" to "This Is A Test"
export function convertCapsToWords(str: string) {
  return str
    .toLowerCase()
    .replace(/_/g, ' ')
    .replace(/(^|\s)\S/g, (l) => l.toUpperCase())
}
