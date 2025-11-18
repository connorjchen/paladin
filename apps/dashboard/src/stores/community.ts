import { create } from 'zustand'
import { axiosClient } from '@/lib/axiosClient'
import { errorWrapper, Result } from '@/lib/utils'
import {
  CreateCommunityRequest,
  CreateCommunityResponse,
} from '@paladin/shared'

interface CommunityStore {
  createCommunity: (
    request: CreateCommunityRequest
  ) => Promise<Result<CreateCommunityResponse>>
}

export const useCommunityStore = create<CommunityStore>((set) => ({
  createCommunity: async (request: CreateCommunityRequest) => {
    return errorWrapper(async () => {
      const response = await axiosClient.post<CreateCommunityResponse>(
        '/community',
        request
      )
      return response.data
    })()
  },
}))
