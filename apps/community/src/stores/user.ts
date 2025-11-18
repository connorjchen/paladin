import { create } from 'zustand'
import { axiosClient } from '@/lib/axiosClient'
import { errorWrapper, Result } from '@/lib/utils'
import {
  GetUserResponse,
  DetailedUser,
  GetCommunityUsersResponse,
  SetUserRoleRequest,
  CreateUserRequest,
  UpdateUserEmailNotificationsRequest,
  BasicUser,
  UpdateAdminEmailNotificationsRequest,
} from '@paladin/shared'

interface UserStore {
  user: DetailedUser | null
  getUser: (request?: CreateUserRequest) => Promise<Result<void>>
  getCommunityUsers: () => Promise<Result<BasicUser[]>>
  setUserRole: (
    userId: string,
    data: SetUserRoleRequest
  ) => Promise<Result<void>>
  updateEmailNotifications: (
    data: UpdateUserEmailNotificationsRequest
  ) => Promise<Result<void>>
  updateAdminEmailNotifications: (
    data: UpdateAdminEmailNotificationsRequest
  ) => Promise<Result<void>>
  isAuthSetup: boolean
  isAuthed: boolean // manually managed isSignedIn variable bc Clerk hooks don't update fast enough
  setAuthSetup: (isSetup: boolean) => void
  setIsAuthed: (isAuthed: boolean) => void
  clearUser: () => void
  setClerkMetadata: () => void
}

export const useUserStore = create<UserStore>((set) => ({
  user: null,
  isAuthSetup: false,
  isAuthed: false,
  setAuthSetup: (isSetup) => set({ isAuthSetup: isSetup }),
  setIsAuthed: (isAuthed) => set({ isAuthed }),
  getUser: async (request?: CreateUserRequest) => {
    return errorWrapper(async () => {
      const response = await axiosClient.post<GetUserResponse>('/user', request)
      set({ user: response.data.user })
    })()
  },
  getCommunityUsers: async () => {
    return errorWrapper(async () => {
      const response =
        await axiosClient.get<GetCommunityUsersResponse>('/user/community')
      return response.data.users
    })()
  },
  setUserRole: async (userId, data) => {
    return errorWrapper(async () => {
      await axiosClient.post<void>(`/user/role/${userId}`, data)
    })()
  },
  updateEmailNotifications: async (
    data: UpdateUserEmailNotificationsRequest
  ) => {
    return errorWrapper(async () => {
      await axiosClient.post<void>('/user/email-notifications', data)
    })()
  },
  updateAdminEmailNotifications: async (
    data: UpdateAdminEmailNotificationsRequest
  ) => {
    return errorWrapper(async () => {
      await axiosClient.post<void>('/user/admin-email-notifications', data)
    })()
  },
  clearUser: () => set({ user: null }),
  setClerkMetadata: async () => {
    return errorWrapper(async () => {
      await axiosClient.post('/user/clerk-metadata')
    })()
  },
}))
