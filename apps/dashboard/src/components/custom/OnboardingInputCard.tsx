import { VFlex } from '@/components/custom/VFlex'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { useState, useEffect } from 'react'
import { useCommunityStore } from '@/stores/community'
import { HFlex } from '@/components/custom/HFlex'
import { cn } from '@/lib/utils'
import { LoadingButton } from '@/components/custom/LoadingButton'

interface OnboardingInputCardProps {
  onSuccess: (communityDomain: string) => void
}

export function OnboardingInputCard({ onSuccess }: OnboardingInputCardProps) {
  const { createCommunity } = useCommunityStore()
  const [communityName, setCommunityName] = useState('')
  const [communityDomain, setCommunityDomain] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    // Fade in on mount
    setIsVisible(true)
  }, [])

  const handleFadeOut = () => {
    setIsVisible(false)
    // Call onSuccess after fade out animation completes
    setTimeout(() => {
      onSuccess(communityDomain)
    }, 500) // Match the transition duration
  }

  return (
    <Card
      className={cn(
        'relative z-20 mx-4 transition-all duration-500 ease-in-out',
        isVisible ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'
      )}
    >
      <CardHeader className="text-center">
        <CardTitle>
          <span role="img" aria-label="party popper">
            🎉
          </span>{' '}
          Welcome to Paladin
        </CardTitle>
        <CardDescription>Let's create your community!</CardDescription>
      </CardHeader>
      <CardContent className="text-center">
        <VFlex className="gap-4">
          <Input
            placeholder="Community name (e.g., Acme Corp)"
            value={communityName}
            onChange={(e) => setCommunityName(e.target.value)}
            onBlur={() => {
              if (!communityDomain && communityName.trim()) {
                // Convert community name to a valid domain according to the rules:
                // - 3-20 chars
                // - only lowercase letters, numbers, hyphens
                // - no leading/trailing/consecutive hyphens
                // Example: "wasp.sh" -> "wasp-sh"
                setCommunityDomain(
                  communityName
                    .trim()
                    .toLowerCase()
                    .replace(/[^a-z0-9]+/g, '-') // Replace non-alphanumerics+ with hyphen
                    .replace(/-+/g, '-') // Collapse consecutive hyphens
                    .replace(/^-+|-+$/g, '') // Remove leading/trailing hyphens
                    .substring(0, 20) // Limit to 20 chars
                )
              }
            }}
            autoFocus
            className="focus-visible:ring-0 focus-visible:ring-offset-0"
          />
          <HFlex>
            <div className="bg-muted rounded-l-md px-3 py-2.5 text-sm">
              community.trypaladin.com/s/
            </div>
            <Input
              placeholder="acme-corp"
              value={communityDomain}
              onChange={(e) => {
                setCommunityDomain(e.target.value.toLowerCase())
              }}
              className={cn(
                'min-w-0 flex-1 rounded-l-none border-l-0 focus-visible:ring-0 focus-visible:ring-offset-0 disabled:opacity-100'
              )}
            />
          </HFlex>
          <LoadingButton
            loading={loading}
            onClick={async () => {
              const domain = communityDomain.trim()
              if (!/^(?!-)(?!.*--)[a-z0-9-]{3,20}(?<!-)$/.test(domain)) {
                setError(
                  'Domain must be 3-20 chars, only lowercase letters, numbers, hyphens, and no leading/trailing/consecutive hyphens'
                )
                return
              }

              setLoading(true)
              const result = await createCommunity({
                name: communityName.trim(),
                domain,
              })
              if (result.data?.error || result.error) {
                setError(
                  result.data?.error ||
                    'An error occurred while creating the community'
                )
              } else {
                handleFadeOut()
              }
              setLoading(false)
            }}
            disabled={!communityName || !communityDomain}
          >
            Confirm
          </LoadingButton>
          {error && <p className="text-red-500">{error}</p>}
        </VFlex>
      </CardContent>
      <CardFooter>
        <p className="text-muted-foreground w-full text-center text-sm">
          Any questions? Visit{' '}
          <a href="https://community.trypaladin.com" className="underline">
            community.trypaladin.com
          </a>
        </p>
      </CardFooter>
    </Card>
  )
}
