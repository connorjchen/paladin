import { useEffect, useState } from 'react'
import { VFlex } from '@/components/custom/VFlex'
import { H3, P2 } from '@/components/custom/Text'
import { Label } from '@/components/ui/label'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { ThemeMode } from '@prisma/client'
import { LoadingButton } from './LoadingButton'
import { Card } from '../ui/card'

interface ThemeModeSectionProps {
  currentThemeMode: ThemeMode
  isLoading: boolean
  onSave: (themeMode: ThemeMode) => void
}

export function ThemeModeSection({
  currentThemeMode,
  isLoading,
  onSave,
}: ThemeModeSectionProps) {
  const [themeMode, setThemeMode] = useState<ThemeMode>(currentThemeMode)

  return (
    <Card className="p-4">
      <VFlex className="gap-4">
        <VFlex className="gap-2">
          <H3>Theme Mode</H3>
          <P2 muted>Choose how your community appears to users</P2>
        </VFlex>

        <VFlex className="gap-3">
          <RadioGroup
            value={themeMode}
            onValueChange={(value: string) => setThemeMode(value as ThemeMode)}
          >
            <VFlex className="gap-2">
              <div className="flex items-center space-x-2">
                <RadioGroupItem value={ThemeMode.LIGHT} id="light" />
                <Label htmlFor="light">Light Theme</Label>
              </div>
              <P2 muted className="ml-6">
                Always show light theme
              </P2>
            </VFlex>

            <VFlex className="gap-2">
              <div className="flex items-center space-x-2">
                <RadioGroupItem value={ThemeMode.DARK} id="dark" />
                <Label htmlFor="dark">Dark Theme</Label>
              </div>
              <P2 muted className="ml-6">
                Always show dark theme
              </P2>
            </VFlex>

            <VFlex className="gap-2">
              <div className="flex items-center space-x-2">
                <RadioGroupItem value={ThemeMode.SYSTEM} id="system" />
                <Label htmlFor="system">System Preference</Label>
              </div>
              <P2 muted className="ml-6">
                Follow user's system preference (default)
              </P2>
            </VFlex>
          </RadioGroup>
        </VFlex>

        <LoadingButton
          onClick={() => onSave(themeMode)}
          disabled={themeMode === currentThemeMode}
          className="w-fit"
          loading={isLoading}
        >
          Save
        </LoadingButton>
      </VFlex>
    </Card>
  )
}
