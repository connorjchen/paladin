import { create } from 'zustand'
import { axiosClient } from '@/lib/axiosClient'
import {
  CreateCommentRequest,
  MarkCommentAsAcceptedRequest,
  UpdateCommentRequest,
  UpdateCommentResponse,
} from '@paladin/shared'
import { errorWrapper, Result } from '@/lib/utils'

interface CommentStore {
  createComment: (data: CreateCommentRequest) => Promise<Result<void>>
  updateComment: (
    commentId: string,
    data: UpdateCommentRequest
  ) => Promise<Result<UpdateCommentResponse>>
  deleteComment: (commentId: string) => Promise<Result<void>>
  markAsAccepted: (
    commentId: string,
    data: MarkCommentAsAcceptedRequest
  ) => Promise<Result<void>>
}

export const useCommentStore = create<CommentStore>((set) => ({
  createComment: async (data: CreateCommentRequest) => {
    return errorWrapper(async () => {
      const response = await axiosClient.post<void>('/comment', data)
      return response.data
    })()
  },
  updateComment: async (commentId, data) => {
    return errorWrapper(async () => {
      const response = await axiosClient.patch<UpdateCommentResponse>(
        `/comment/${commentId}`,
        data
      )
      return response.data
    })()
  },
  deleteComment: async (commentId: string) => {
    return errorWrapper(async () => {
      await axiosClient.delete<void>(`/comment/${commentId}`)
    })()
  },
  markAsAccepted: async (
    commentId: string,
    data: MarkCommentAsAcceptedRequest
  ) => {
    return axiosClient.post(`/comment/mark-as-accepted/${commentId}`, data)
  },
}))
