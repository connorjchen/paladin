import { create } from 'zustand'
import { axiosClient } from '@/lib/axiosClient'
import { errorWrapper, Result } from '@/lib/utils'
import {
  CreatePostTagRequest,
  GetPostTagsResponse,
  UpdatePostTagRequest,
} from '@paladin/shared'

interface PostTagStore {
  getPostTags: () => Promise<Result<GetPostTagsResponse>>
  createPostTag: (data: CreatePostTagRequest) => Promise<Result<void>>
  updatePostTag: (
    postTagId: string,
    data: UpdatePostTagRequest
  ) => Promise<Result<void>>
  deletePostTag: (postTagId: string) => Promise<Result<void>>
}

export const usePostTagStore = create<PostTagStore>((set) => ({
  getPostTags: async () => {
    return errorWrapper(async () => {
      const response = await axiosClient.get<GetPostTagsResponse>('/post-tag')
      return response.data
    })()
  },
  createPostTag: async (data) => {
    return errorWrapper(async () => {
      await axiosClient.post<void>('/post-tag', data)
    })()
  },
  updatePostTag: async (postTagId, data) => {
    return errorWrapper(async () => {
      await axiosClient.patch<void>(`/post-tag/${postTagId}`, data)
    })()
  },
  deletePostTag: async (postTagId) => {
    return errorWrapper(async () => {
      await axiosClient.delete<void>(`/post-tag/${postTagId}`)
    })()
  },
}))
