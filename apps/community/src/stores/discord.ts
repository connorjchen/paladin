import { create } from 'zustand'
import { axiosClient } from '@/lib/axiosClient'
import { errorWrapper, Result } from '@/lib/utils'
import {
  DetailedCommunity,
  GetCommunityResponse,
  GetDiscordChannelsResponse,
  GetDiscordInviteLinkResponse,
  UpdateCommunityRequest,
  UpdateDiscordChannelRequest,
} from '@paladin/shared'

interface DiscordStore {
  getDiscordChannels: () => Promise<Result<GetDiscordChannelsResponse>>
  updateDiscordChannel: (
    discordChannelId: string,
    data: UpdateDiscordChannelRequest
  ) => Promise<Result<void>>
  getDiscordInviteLink: () => Promise<Result<GetDiscordInviteLinkResponse>>
}

export const useDiscordStore = create<DiscordStore>((set) => ({
  getDiscordChannels: async () => {
    return errorWrapper(async () => {
      const response =
        await axiosClient.get<GetDiscordChannelsResponse>('/discord/channel')
      return response.data
    })()
  },
  updateDiscordChannel: async (discordChannelId, data) => {
    return errorWrapper(async () => {
      await axiosClient.patch<void, UpdateDiscordChannelRequest>(
        `/discord/channel/${discordChannelId}`,
        data
      )
    })()
  },
  getDiscordInviteLink: async () => {
    return errorWrapper(async () => {
      const response = await axiosClient.get<GetDiscordInviteLinkResponse>(
        '/discord/invite-link'
      )
      return response.data
    })()
  },
}))
