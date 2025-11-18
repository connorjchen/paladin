import { getR2Url } from '@/lib/utils'
import { useCommunityStore } from '@/stores/community'
import { useTheme } from '@/components/custom/ThemeProvider'
import { cn } from '@/lib/utils'

interface LogoProps {
  className?: string
  showText?: boolean
}

export function Logo({ className }: LogoProps) {
  const { community } = useCommunityStore()
  const { theme } = useTheme()

  // Use dark logo for dark theme, light logo for light theme
  const logoKey =
    theme === 'dark'
      ? community?.logoDarkR2Key || community?.logoR2Key
      : community?.logoR2Key

  const logoUrl = getR2Url(logoKey)

  if (!logoUrl) {
    return (
      <h1 className="w-full truncate text-center font-bold leading-tight [font-size:clamp(1rem,3vw,2rem)]">
        {community?.name || 'Community'}
      </h1>
    )
  }

  return (
    <img
      className={cn('h-24 w-full cursor-pointer object-contain', className)}
      src={logoUrl}
      alt="Logo"
    />
  )
}
