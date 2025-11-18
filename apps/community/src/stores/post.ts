import { create } from 'zustand'
import { axiosClient } from '@/lib/axiosClient'
import { errorWrapper, Result } from '@/lib/utils'
import {
  CreatePostRequest,
  CreatePostResponse,
  GetPostsRequest,
  GetPostsResponse,
  GetPostResponse,
  GetRoadmapResponse,
  GetRoadmapRequest,
  GetRelevantPostsRequest,
  GetRelevantPostsResponse,
  UpvotePostRequest,
  UpdateFeedbackStatusRequest,
  UpdateQuestionStatusRequest,
  PinPostRequest,
  GetReviewPostsResponse,
  UpdatePostRequest,
  WatchPostRequest,
} from '@paladin/shared'

interface PostStore {
  getPosts: (params: GetPostsRequest) => Promise<Result<GetPostsResponse>>
  getRelevantPosts: (
    params: GetRelevantPostsRequest
  ) => Promise<Result<GetRelevantPostsResponse>>
  getRoadmap: (params: GetRoadmapRequest) => Promise<Result<GetRoadmapResponse>>
  getReviewPosts: () => Promise<Result<GetReviewPostsResponse>>
  getPost: (postId: string) => Promise<Result<GetPostResponse>>
  createPost: (data: CreatePostRequest) => Promise<Result<CreatePostResponse>>
  updatePost: (postId: string, data: UpdatePostRequest) => Promise<Result<void>>
  upvotePost: (postId: string, data: UpvotePostRequest) => Promise<Result<void>>
  watchPost: (postId: string, data: WatchPostRequest) => Promise<Result<void>>
  updateFeedbackStatus: (
    postId: string,
    data: UpdateFeedbackStatusRequest
  ) => Promise<Result<void>>
  updateQuestionStatus: (
    postId: string,
    data: UpdateQuestionStatusRequest
  ) => Promise<Result<void>>
  pinPost: (postId: string, data: PinPostRequest) => Promise<Result<void>>
  deletePost: (postId: string) => Promise<Result<void>>
}

export const usePostStore = create<PostStore>(() => ({
  getPosts: async (params) => {
    return errorWrapper(async () => {
      const response = await axiosClient.get<GetPostsResponse>('/post', {
        params,
      })
      return response.data
    })()
  },
  getRelevantPosts: async (params: GetRelevantPostsRequest) => {
    return errorWrapper(async () => {
      const response = await axiosClient.get<GetRelevantPostsResponse>(
        '/post/relevant',
        {
          params,
        }
      )
      return response.data
    })()
  },
  getRoadmap: async (params: GetRoadmapRequest) => {
    return errorWrapper(async () => {
      const response = await axiosClient.get<GetRoadmapResponse>(
        '/post/roadmap',
        {
          params,
        }
      )
      return response.data
    })()
  },
  getReviewPosts: async () => {
    return errorWrapper(async () => {
      const response =
        await axiosClient.get<GetReviewPostsResponse>('/post/review')
      return response.data
    })()
  },
  getPost: async (postId) => {
    return errorWrapper(async () => {
      const response = await axiosClient.get<GetPostResponse>(`/post/${postId}`)
      return response.data
    })()
  },
  createPost: async (data) => {
    return errorWrapper(async () => {
      const response = await axiosClient.post<CreatePostResponse>('/post', data)
      return response.data
    })()
  },
  updatePost: async (postId, data) => {
    return errorWrapper(async () => {
      await axiosClient.patch<void>(`/post/${postId}`, data)
    })()
  },
  upvotePost: async (postId, data) => {
    return errorWrapper(async () => {
      await axiosClient.post<void>(`/post/upvote/${postId}`, data)
    })()
  },
  watchPost: async (postId, data) => {
    return errorWrapper(async () => {
      await axiosClient.post<void>(`/post/watch/${postId}`, data)
    })()
  },
  updateFeedbackStatus: async (postId, data) => {
    return errorWrapper(async () => {
      await axiosClient.post<void>(`/post/feedback-status/${postId}`, data)
    })()
  },
  updateQuestionStatus: async (postId, data) => {
    return errorWrapper(async () => {
      await axiosClient.post<void>(`/post/question-status/${postId}`, data)
    })()
  },
  pinPost: async (postId, data) => {
    return errorWrapper(async () => {
      await axiosClient.post<void>(`/post/pin/${postId}`, data)
    })()
  },
  deletePost: async (postId: string) => {
    return errorWrapper(async () => {
      await axiosClient.delete<void>(`/post/${postId}`)
    })()
  },
}))
