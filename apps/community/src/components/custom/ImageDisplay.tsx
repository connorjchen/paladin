import { useDropzone } from 'react-dropzone'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { VFlex } from '@/components/custom/VFlex'
import { X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { P2 } from '@/components/custom/Text'

export enum ImageType {
  LOGO = 'logo',
  FAVICON = 'favicon',
  LOGO_DARK = 'logo-dark',
}

export interface ImageFile {
  file: File
  preview: string
}

export interface ImageDisplayProps {
  type: ImageType
  image: ImageFile | null
  existingImage: string | undefined
  onImageSelect: (file: File) => void
  onRemove: () => void
  accept: Record<string, string[]>
}

export function ImageDisplay({
  type,
  image,
  existingImage,
  onImageSelect,
  onRemove,
  accept,
}: ImageDisplayProps) {
  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    accept,
    maxFiles: 1,
    onDrop: (acceptedFiles) => {
      if (acceptedFiles.length > 0) {
        onImageSelect(acceptedFiles[0])
      }
    },
  })

  const displayImage =
    image || (existingImage ? { preview: existingImage } : null)

  return (
    <div {...getRootProps()} className="cursor-pointer">
      <input {...getInputProps()} />
      <Card
        className={cn('border-sidebar-border border transition-colors', {
          'border-primary bg-primary/5': isDragActive,
          'border-primary/40 bg-primary/10': image,
          'bg-black': type === ImageType.LOGO_DARK,
        })}
      >
        <CardContent className="p-6">
          <VFlex className="items-center gap-4">
            {displayImage ? (
              <>
                <div className="relative">
                  <img
                    src={displayImage.preview}
                    alt={`${type} preview`}
                    className={cn(
                      'object-contain',
                      type === ImageType.LOGO || type === ImageType.LOGO_DARK
                        ? 'max-h-32 max-w-64'
                        : 'h-16 w-16'
                    )}
                  />
                  {image && (
                    <Button
                      size="sm"
                      variant="destructive"
                      className="absolute -right-2 -top-2 h-6 w-6 rounded-full p-0"
                      onClick={(e) => {
                        e.stopPropagation()
                        onRemove()
                      }}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  )}
                </div>
                {image && (
                  <P2 muted>
                    {image.file.name} ({(image.file.size / 1024).toFixed(1)} KB)
                  </P2>
                )}
              </>
            ) : (
              <P2 muted>No image available</P2>
            )}
          </VFlex>
        </CardContent>
      </Card>
      <P2 muted className="mt-2">
        {type === ImageType.LOGO || type === ImageType.LOGO_DARK ? (
          <>Recommended: 256x256px or larger (PNG, JPEG, WebP)</>
        ) : (
          <>Recommended: 32x32px (ICO)</>
        )}
      </P2>
    </div>
  )
}
