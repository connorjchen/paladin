import { create } from 'zustand'
import { axiosClient } from '@/lib/axiosClient'
import { errorWrapper, Result } from '@/lib/utils'
import axios from 'axios'
import {
  GeneratePresignedUrlResponse,
  UploadToBlobRequest,
  UploadToBlobResponse,
} from '@paladin/shared'

interface BlobStore {
  uploadToBlob: (
    data: UploadToBlobRequest
  ) => Promise<Result<UploadToBlobResponse>>
}

export const useBlobStore = create<BlobStore>((set) => ({
  uploadToBlob: async (data) => {
    return errorWrapper(async () => {
      // Generate presigned URL
      const presignedUrlResult =
        await axiosClient.post<GeneratePresignedUrlResponse>(
          '/blob/generate-presigned-url',
          {
            key: data.key,
            contentType: data.file.type,
          }
        )

      // Upload file to presigned URL
      await axios.put(presignedUrlResult.data.url, data.file, {
        headers: {
          'Content-Type': data.file.type,
        },
      })

      return {
        r2Key: data.key,
      }
    })()
  },
}))
