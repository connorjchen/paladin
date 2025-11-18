import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { VFlex } from '@/components/custom/VFlex'
import { HFlex } from '@/components/custom/HFlex'
import { LoadingButton } from '@/components/custom/LoadingButton'
import { ButtonWithIcon } from '@/components/custom/ButtonWithIcon'
import { Upload } from 'lucide-react'
import { ImageDisplay, ImageType, ImageFile } from './ImageDisplay'

export interface ImageUploadSectionProps {
  type: ImageType
  newImage: ImageFile | null
  existingImage: string | undefined
  isLoading: boolean
  onImageSelect: (file: File) => void
  onRemove: () => void
  onSave: (type: ImageType) => void
}

export function ImageUploadSection({
  type,
  newImage,
  existingImage,
  isLoading,
  onImageSelect,
  onRemove,
  onSave,
}: ImageUploadSectionProps) {
  const accept =
    type === ImageType.LOGO || type === ImageType.LOGO_DARK
      ? { 'image/*': [] }
      : ({ 'image/vnd.microsoft.icon': ['.ico'] } as Record<string, string[]>)

  const getImageLabel = () => {
    switch (type) {
      case ImageType.LOGO:
        return 'Logo (Light)'
      case ImageType.LOGO_DARK:
        return 'Logo (Dark)'
      case ImageType.FAVICON:
        return 'Favicon'
      default:
        return 'Image'
    }
  }

  return (
    <VFlex className="gap-4" data-image-type={type}>
      <Label htmlFor="community-branding">{getImageLabel()}</Label>
      <ImageDisplay
        type={type}
        image={newImage}
        existingImage={existingImage}
        onImageSelect={onImageSelect}
        onRemove={onRemove}
        accept={accept}
      />
      <HFlex className="gap-2">
        <ButtonWithIcon
          icon={<Upload className="h-4 w-4" />}
          onClick={() => {
            // Find the file input within this specific ImageUploadSection
            const currentSection = document.querySelector(
              `[data-image-type="${type}"]`
            )
            const fileInput = currentSection?.querySelector(
              'input[type="file"]'
            ) as HTMLInputElement
            fileInput?.click()
          }}
          disabled={isLoading}
        >
          Choose {getImageLabel()}
        </ButtonWithIcon>
        {newImage && (
          <>
            <Button variant="outline" onClick={onRemove} disabled={isLoading}>
              Remove
            </Button>
            <LoadingButton
              onClick={() => onSave(type)}
              loading={isLoading}
              size="sm"
            >
              Save {getImageLabel()}
            </LoadingButton>
          </>
        )}
      </HFlex>
    </VFlex>
  )
}
