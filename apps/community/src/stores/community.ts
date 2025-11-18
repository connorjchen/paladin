import { create } from 'zustand'
import { axiosClient } from '@/lib/axiosClient'
import { errorWrapper, Result, setupAxiosCommunityHeader } from '@/lib/utils'
import {
  DetailedCommunity,
  GetCommunityResponse,
  UpdateCommunityRequest,
} from '@paladin/shared'

interface CommunityStore {
  community: DetailedCommunity | null
  // Used in all other pages
  getCommunity: () => Promise<Result<void>>
  // Only used in RootLayout (don't have community id set in Axios intercept yet)
  getCommunityWithDomain: (communityDomain: string) => Promise<Result<void>>
  updateCommunity: (request: UpdateCommunityRequest) => Promise<Result<void>>
}

export const useCommunityStore = create<CommunityStore>((set) => ({
  community: null,
  getCommunity: async () => {
    return errorWrapper(async () => {
      const response = await axiosClient.get<GetCommunityResponse>(`/community`)
      set({ community: response.data.community })
      setupAxiosCommunityHeader(response.data.community.id)
    })()
  },
  getCommunityWithDomain: async (communityDomain: string) => {
    return errorWrapper(async () => {
      const response = await axiosClient.get<GetCommunityResponse>(
        `/community/${communityDomain}`
      )
      set({ community: response.data.community })
      setupAxiosCommunityHeader(response.data.community.id)
    })()
  },
  updateCommunity: async (request: UpdateCommunityRequest) => {
    return errorWrapper(async () => {
      await axiosClient.patch<void, UpdateCommunityRequest>(
        '/community',
        request
      )
    })()
  },
}))
