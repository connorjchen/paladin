import { create } from 'zustand'
import { axiosClient } from '@/lib/axiosClient'
import { errorWrapper, Result } from '@/lib/utils'
import { CreateDocumentRequest, GetDocumentsResponse } from '@paladin/shared'

interface DocumentStore {
  getDocuments: () => Promise<Result<GetDocumentsResponse>>
  createDocument: (data: CreateDocumentRequest) => Promise<Result<void>>
  deleteDocument: (documentId: string) => Promise<Result<void>>
}

export const useDocumentStore = create<DocumentStore>(() => ({
  getDocuments: async () => {
    return errorWrapper(async () => {
      const response = await axiosClient.get<GetDocumentsResponse>('/document')
      return response.data
    })()
  },
  createDocument: async (data) => {
    return errorWrapper(async () => {
      await axiosClient.post<void>('/document', data)
    })()
  },
  deleteDocument: async (documentId) => {
    return errorWrapper(async () => {
      await axiosClient.delete<void>(`/document/${documentId}`)
    })()
  },
}))
