import { useCommunityStore } from '@/stores/community'
import { useTheme } from '@/components/custom/ThemeProvider'

export function useCommunityColors() {
  const { community } = useCommunityStore()
  const { theme } = useTheme()

  const isDark = theme === 'dark'

  return {
    accentColor: isDark
      ? community?.accentColorDark || community?.accentColor || '#000000'
      : community?.accentColor || '#000000',
    buttonTextColor: isDark
      ? community?.buttonTextColorDark ||
        community?.buttonTextColor ||
        '#FFFFFF'
      : community?.buttonTextColor || '#FFFFFF',
  }
}
