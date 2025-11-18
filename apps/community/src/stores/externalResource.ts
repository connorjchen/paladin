import { create } from 'zustand'
import { axiosClient } from '@/lib/axiosClient'
import { errorWrapper, Result } from '@/lib/utils'
import {
  CreateExternalResourceRequest,
  UpdateExternalResourceRequest,
} from '@paladin/shared'

interface ExternalResourceStore {
  createExternalResource: (
    data: CreateExternalResourceRequest
  ) => Promise<Result<void>>
  updateExternalResource: (
    externalResourceId: string,
    data: UpdateExternalResourceRequest
  ) => Promise<Result<void>>
  deleteExternalResource: (externalResourceId: string) => Promise<Result<void>>
}

export const useExternalResourceStore = create<ExternalResourceStore>(
  (set) => ({
    createExternalResource: async (data) => {
      return errorWrapper(async () => {
        await axiosClient.post<void>('/external-resource', data)
      })()
    },
    updateExternalResource: async (externalResourceId, data) => {
      return errorWrapper(async () => {
        await axiosClient.patch<void>(
          `/external-resource/${externalResourceId}`,
          data
        )
      })()
    },
    deleteExternalResource: async (externalResourceId) => {
      return errorWrapper(async () => {
        await axiosClient.delete<void>(
          `/external-resource/${externalResourceId}`
        )
      })()
    },
  })
)
