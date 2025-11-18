import { create } from 'zustand'
import { axiosClient } from '@/lib/axiosClient'
import { errorWrapper, Result } from '@/lib/utils'
import {
  CreateSupportAgentChatRequest,
  CreateSupportAgentChatResponse,
} from '@paladin/shared'

interface SupportAgentStore {
  createSupportAgentChat: (
    data: CreateSupportAgentChatRequest
  ) => Promise<Result<CreateSupportAgentChatResponse>>
}

export const useSupportAgentStore = create<SupportAgentStore>(() => ({
  createSupportAgentChat: async (data) => {
    return errorWrapper(async () => {
      const response = await axiosClient.post<CreateSupportAgentChatResponse>(
        '/support-agent/chat',
        data
      )
      return response.data
    })()
  },
}))
