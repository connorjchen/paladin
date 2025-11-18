import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'
import { emitToast } from '@/hooks/use-toast'
import posthog from 'posthog-js'
import { AxiosError } from 'axios'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export interface Result<T> {
  data?: T
  error?: Error
}

export type RecursivePartial<T> = {
  [P in keyof T]?: RecursivePartial<T[P]>
}

export const errorWrapper = <T>(operation: () => Promise<T>) => {
  return async () => {
    try {
      const result = await operation()
      return { data: result }
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
