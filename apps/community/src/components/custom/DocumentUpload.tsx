import { useState, useCallback } from 'react'
import { useDropzone } from 'react-dropzone'
import { Loader2Icon, UploadIcon } from 'lucide-react'
import { VFlex } from './VFlex'
import { useBlobStore } from '@/stores/blob'
import { nanoid } from 'nanoid'
import { useDocumentStore } from '@/stores/document'
import { emitToast } from '@/hooks/use-toast'
import { H3, P2 } from './Text'

interface DocumentUploadProps {
  fetchDocuments: () => Promise<void>
  totalItems: number
}

export function DocumentUpload({
  fetchDocuments,
  totalItems,
}: DocumentUploadProps) {
  const { uploadToBlob } = useBlobStore()
  const { createDocument } = useDocumentStore()
  const [uploading, setUploading] = useState(false)

  const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10MB

  const onDrop = useCallback(
    async (acceptedFiles: File[]) => {
      setUploading(true)

      // Check if too many files are selected
      if (acceptedFiles.length > 10) {
        emitToast({
          title: 'Too many files',
          description: `You can only upload up to 10 files at a time. Please select fewer files.`,
          variant: 'destructive',
        })
        setUploading(false)
        return
      }

      // Check if too many files are already uploaded
      if (totalItems + acceptedFiles.length > 100) {
        emitToast({
          title: 'Too many files',
          description: `You can only upload up to 100 files in total. Please remove some files before uploading more.`,
          variant: 'destructive',
        })
        setUploading(false)
        return
      }

      const validFiles: File[] = []
      const tooLargeFiles: string[] = []
      acceptedFiles.forEach((file) => {
        if (file.size > MAX_FILE_SIZE) {
          tooLargeFiles.push(file.name)
        } else {
          validFiles.push(file)
        }
      })

      if (tooLargeFiles.length > 0) {
        emitToast({
          title: 'File(s) too large',
          description: `${tooLargeFiles.join(', ')} ${tooLargeFiles.length === 1 ? 'is' : 'are'} over 10MB and ${tooLargeFiles.length === 1 ? 'was' : 'were'} not uploaded.`,
          variant: 'destructive',
        })
      }

      const uploadResults = await Promise.all(
        validFiles.map(async (file) => {
          const key = `community/documents/${nanoid()}-${file.name}`
          const result = await uploadToBlob({ file, key })
          return { file, result }
        })
      )

      await Promise.all(
        uploadResults
          .filter(({ result }) => result.data)
          .map(({ file, result }) => {
            if (result.data) {
              return createDocument({
                name: file.name,
                r2Key: result.data.r2Key,
              })
            }
            return undefined
          })
      )

      setUploading(false)
      fetchDocuments()
    },
    [createDocument, fetchDocuments, uploadToBlob, MAX_FILE_SIZE, totalItems]
  )

  const {
    getRootProps,
    getInputProps,
    isDragActive: dropzoneIsDragActive,
  } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
      'text/plain': ['.txt'],
      'text/markdown': ['.md', '.markdown'],
      'text/csv': ['.csv'],
      'application/json': ['.json'],
    },
  })

  return (
    <VFlex className="gap-4">
      <H3>Upload</H3>

      <div
        {...getRootProps()}
        className={`cursor-pointer rounded-lg border-2 border-dashed p-8 text-center transition-colors ${
          dropzoneIsDragActive
            ? 'border-primary bg-primary/5'
            : 'border-muted-foreground/25 hover:border-primary/50'
        }`}
      >
        <input {...getInputProps()} />
        {uploading ? (
          <Loader2Icon className="text-muted-foreground mx-auto mb-4 h-12 w-12 animate-spin" />
        ) : (
          <UploadIcon className="text-muted-foreground mx-auto mb-4 h-12 w-12" />
        )}
        <H3 className="mb-2">
          {dropzoneIsDragActive ? 'Drop files here' : 'Drag & drop files here'}
        </H3>
        <P2 muted className="mb-4">
          or click to select files
        </P2>
        <P2 muted>Supports PDF, TXT, MD, CSV, JSON (max 10 files)</P2>
      </div>
    </VFlex>
  )
}
