import { useState, useEffect } from 'react'
import { VFlex } from '@/components/custom/VFlex'
import { getR2Url, handleError, uploadImageToBlob } from '@/lib/utils'
import { useCommunityStore } from '@/stores/community'
import { nanoid } from 'nanoid'
import { H2, H3 } from '@/components/custom/Text'
import { ImageType, ImageFile } from './ImageDisplay'
import { ImageUploadSection } from './ImageUploadSection'
import { CommunityNameSection } from './CommunityNameSection'
import { DomainSection } from './DomainSection'
import { CommunityColorSection } from './CommunityColorSection'
import { ThemeModeSection } from './ThemeModeSection'
import { ThemeMode } from '@/generated/prisma'
import { Card } from '../ui/card'
import { useBlobStore } from '@/stores/blob'

export function ManageCommunityBranding() {
  const { community, updateCommunity, getCommunity } = useCommunityStore()
  const { uploadToBlob } = useBlobStore()
  const [logo, setLogo] = useState<ImageFile | null>(null)
  const [favicon, setFavicon] = useState<ImageFile | null>(null)
  const [logoDark, setLogoDark] = useState<ImageFile | null>(null)
  const [logoLoading, setLogoLoading] = useState(false)
  const [faviconLoading, setFaviconLoading] = useState(false)
  const [logoDarkLoading, setLogoDarkLoading] = useState(false)
  const [nameLoading, setNameLoading] = useState(false)
  const [themeModeLoading, setThemeModeLoading] = useState(false)
  const [communityName, setCommunityName] = useState('')

  // Update community name when community data loads
  useEffect(() => {
    if (community?.name) {
      setCommunityName(community.name)
    }
  }, [community?.name])

  const handleImageSelect = (file: File, type: ImageType) => {
    const reader = new FileReader()
    reader.onload = (e) => {
      const preview = e.target?.result as string
      const imageFile: ImageFile = { file, preview }
      switch (type) {
        case ImageType.LOGO:
          setLogo(imageFile)
          break
        case ImageType.FAVICON:
          setFavicon(imageFile)
          break
        case ImageType.LOGO_DARK:
          setLogoDark(imageFile)
          break
      }
    }
    reader.readAsDataURL(file)
  }

  const removeImage = (type: ImageType) => {
    // Clear the file input to allow re-selecting the same file
    const fileInputs = document.querySelectorAll('input[type="file"]')
    fileInputs.forEach((input) => {
      if (input instanceof HTMLInputElement) {
        input.value = ''
      }
    })

    switch (type) {
      case ImageType.LOGO:
        setLogo(null)
        break
      case ImageType.FAVICON:
        setFavicon(null)
        break
      case ImageType.LOGO_DARK:
        setLogoDark(null)
        break
    }
  }

  // Upload image via shared util; converts to WebP except ICO
  const performImageUpload = async (file: File, type: ImageType) => {
    const key = `community/${type}/${nanoid()}-${file.name}`
    return uploadImageToBlob(file, key, uploadToBlob)
  }

  const handleSave = async (type: ImageType) => {
    let setLoading: (loading: boolean) => void
    let file: File | undefined
    let fieldName: string

    switch (type) {
      case ImageType.LOGO:
        setLoading = setLogoLoading
        file = logo?.file
        fieldName = 'logoR2Key'
        break
      case ImageType.FAVICON:
        setLoading = setFaviconLoading
        file = favicon?.file
        fieldName = 'faviconR2Key'
        break
      case ImageType.LOGO_DARK:
        setLoading = setLogoDarkLoading
        file = logoDark?.file
        fieldName = 'logoDarkR2Key'
        break
    }

    setLoading(true)

    if (!file) {
      setLoading(false)
      return
    }

    try {
      const uploadResult = await performImageUpload(file, type)
      if (uploadResult) {
        await updateCommunity({
          [fieldName]: uploadResult.r2Key,
        })
        await getCommunity()

        switch (type) {
          case ImageType.LOGO:
            setLogo(null)
            break
          case ImageType.FAVICON:
            setFavicon(null)
            break
          case ImageType.LOGO_DARK:
            setLogoDark(null)
            break
        }
      }
    } catch (error) {
      handleError({
        error,
        toastTitle: `Error uploading ${type}`,
      })
    } finally {
      setLoading(false)
    }
  }

  const handleSaveName = async () => {
    if (!communityName.trim() || communityName === community?.name) {
      return
    }

    setNameLoading(true)
    try {
      await updateCommunity({ name: communityName.trim() })
      await getCommunity()
    } finally {
      setNameLoading(false)
    }
  }

  const handleSaveThemeMode = async (themeMode: ThemeMode) => {
    try {
      setThemeModeLoading(true)
      await updateCommunity({ themeMode })
      await getCommunity()
    } finally {
      setThemeModeLoading(false)
    }
  }

  if (!community) {
    return null
  }

  return (
    <VFlex className="gap-4">
      <H2>Manage Community Branding</H2>

      <Card className="p-4">
        <VFlex className="gap-4">
          <H3>Community Details</H3>

          <CommunityNameSection
            communityName={communityName}
            currentName={community.name}
            isLoading={nameLoading}
            onNameChange={setCommunityName}
            onSave={handleSaveName}
          />

          <DomainSection domain={community.domain} />
        </VFlex>
      </Card>

      <ThemeModeSection
        currentThemeMode={community.themeMode}
        isLoading={themeModeLoading}
        onSave={handleSaveThemeMode}
      />

      <CommunityColorSection />

      <Card className="p-4">
        <VFlex className="gap-4">
          <H3>Community Images</H3>
          {/* Light Theme Images */}
          <ImageUploadSection
            type={ImageType.FAVICON}
            newImage={favicon}
            existingImage={getR2Url(community.faviconR2Key)}
            isLoading={faviconLoading}
            onImageSelect={(file) => handleImageSelect(file, ImageType.FAVICON)}
            onRemove={() => removeImage(ImageType.FAVICON)}
            onSave={handleSave}
          />

          <ImageUploadSection
            type={ImageType.LOGO}
            newImage={logo}
            existingImage={getR2Url(community.logoR2Key)}
            isLoading={logoLoading}
            onImageSelect={(file) => handleImageSelect(file, ImageType.LOGO)}
            onRemove={() => removeImage(ImageType.LOGO)}
            onSave={handleSave}
          />

          {/* Dark Theme Images */}
          <ImageUploadSection
            type={ImageType.LOGO_DARK}
            newImage={logoDark}
            existingImage={getR2Url(community.logoDarkR2Key)}
            isLoading={logoDarkLoading}
            onImageSelect={(file) =>
              handleImageSelect(file, ImageType.LOGO_DARK)
            }
            onRemove={() => removeImage(ImageType.LOGO_DARK)}
            onSave={handleSave}
          />
        </VFlex>
      </Card>
    </VFlex>
  )
}
