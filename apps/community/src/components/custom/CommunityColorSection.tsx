import { VFlex } from '@/components/custom/VFlex'
import { HFlex } from '@/components/custom/HFlex'
import { ColorInput } from './ColorInput'
import { Label } from '../ui/label'
import { LoadingButton } from './LoadingButton'
import { useCommunityStore } from '@/stores/community'
import { useEffect, useState } from 'react'
import { H3 } from '@/components/custom/Text'
import { Card } from '../ui/card'

export function CommunityColorSection() {
  const { community, updateCommunity, getCommunity } = useCommunityStore()
  const [accentColor, setAccentColor] = useState(
    community?.accentColor || '#000000'
  )
  const [accentColorDark, setAccentColorDark] = useState(
    community?.accentColorDark || '#FFFFFF'
  )
  const [buttonTextColor, setButtonTextColor] = useState(
    community?.buttonTextColor || '#FFFFFF'
  )
  const [buttonTextColorDark, setButtonTextColorDark] = useState(
    community?.buttonTextColorDark || '#000000'
  )
  const [accentColorLoading, setAccentColorLoading] = useState(false)
  const [accentColorDarkLoading, setAccentColorDarkLoading] = useState(false)
  const [buttonTextColorLoading, setButtonTextColorLoading] = useState(false)
  const [buttonTextColorDarkLoading, setButtonTextColorDarkLoading] =
    useState(false)

  const handleSaveAccentColor = async () => {
    setAccentColorLoading(true)
    await updateCommunity({ accentColor })
    setAccentColorLoading(false)
    await getCommunity()
  }

  const handleSaveAccentColorDark = async () => {
    setAccentColorDarkLoading(true)
    await updateCommunity({ accentColorDark })
    setAccentColorDarkLoading(false)
    await getCommunity()
  }

  const handleSaveButtonTextColor = async () => {
    setButtonTextColorLoading(true)
    await updateCommunity({ buttonTextColor })
    setButtonTextColorLoading(false)
    await getCommunity()
  }

  const handleSaveButtonTextColorDark = async () => {
    setButtonTextColorDarkLoading(true)
    await updateCommunity({ buttonTextColorDark })
    setButtonTextColorDarkLoading(false)
    await getCommunity()
  }

  useEffect(() => {
    if (community) {
      setAccentColor(community.accentColor)
      setAccentColorDark(community.accentColorDark || '#FFFFFF')
      setButtonTextColor(community.buttonTextColor)
      setButtonTextColorDark(community.buttonTextColorDark || '#000000')
    }
  }, [community])

  return (
    <Card className="p-4">
      <VFlex className="gap-4">
        <VFlex className="gap-2">
          <H3>Community Colors</H3>
        </VFlex>

        <HFlex className="gap-4 sm:gap-24">
          {/* Light Theme Colors */}
          <VFlex className="gap-4">
            <VFlex className="gap-2">
              <Label className="text-sm font-medium">Light Theme</Label>
            </VFlex>

            <VFlex className="gap-2">
              <Label className="text-sm font-medium">Accent Color</Label>
              <HFlex className="items-center gap-3">
                <ColorInput
                  value={accentColor}
                  onChange={setAccentColor}
                  disabled={accentColorLoading}
                />
                <LoadingButton
                  onClick={handleSaveAccentColor}
                  loading={accentColorLoading}
                  size="sm"
                  className="min-w-[80px]"
                >
                  Save
                </LoadingButton>
              </HFlex>
            </VFlex>

            <VFlex className="gap-2">
              <Label className="text-sm font-medium">Button Text Color</Label>
              <HFlex className="items-center gap-3">
                <ColorInput
                  value={buttonTextColor}
                  onChange={setButtonTextColor}
                  disabled={buttonTextColorLoading}
                />
                <LoadingButton
                  onClick={handleSaveButtonTextColor}
                  loading={buttonTextColorLoading}
                  size="sm"
                  className="min-w-[80px]"
                >
                  Save
                </LoadingButton>
              </HFlex>
            </VFlex>
          </VFlex>

          {/* Dark Theme Colors */}
          <VFlex className="gap-4">
            <VFlex className="gap-2">
              <Label className="text-sm font-medium">Dark Theme</Label>
            </VFlex>

            <VFlex className="gap-2">
              <Label className="text-sm font-medium">Accent Color</Label>
              <HFlex className="items-center gap-3">
                <ColorInput
                  value={accentColorDark}
                  onChange={setAccentColorDark}
                  disabled={accentColorDarkLoading}
                />
                <LoadingButton
                  onClick={handleSaveAccentColorDark}
                  loading={accentColorDarkLoading}
                  size="sm"
                  className="min-w-[80px]"
                >
                  Save
                </LoadingButton>
              </HFlex>
            </VFlex>

            <VFlex className="gap-2">
              <Label className="text-sm font-medium">Button Text Color</Label>
              <HFlex className="items-center gap-3">
                <ColorInput
                  value={buttonTextColorDark}
                  onChange={setButtonTextColorDark}
                  disabled={buttonTextColorDarkLoading}
                />
                <LoadingButton
                  onClick={handleSaveButtonTextColorDark}
                  loading={buttonTextColorDarkLoading}
                  size="sm"
                  className="min-w-[80px]"
                >
                  Save
                </LoadingButton>
              </HFlex>
            </VFlex>
          </VFlex>
        </HFlex>
      </VFlex>
    </Card>
  )
}
