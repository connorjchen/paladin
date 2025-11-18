import { VFlex } from '@/components/custom/VFlex'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import JSConfetti from 'js-confetti'
import { CheckCircle2, ExternalLink } from 'lucide-react'
import { useEffect, useState } from 'react'
import { cn } from '@/lib/utils'

interface OnboardingSuccessCardProps {
  communityDomain: string
}

export function OnboardingSuccessCard({
  communityDomain,
}: OnboardingSuccessCardProps) {
  const communityUrl = `https://community.trypaladin.com/s/${communityDomain}`
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    // Fade in on mount
    setIsVisible(true)

    const jsConfetti = new JSConfetti()
    jsConfetti.addConfetti({
      confettiNumber: 500,
      confettiRadius: 5,
      confettiColors: [
        '#FF5E5B', // red
        '#FFD800', // yellow
        '#4ECDC4', // teal
        '#1A8FE3', // blue
        '#FFB400', // orange
        '#A259F7', // purple
        '#43E97B', // green
        '#FEDCCA', // pastel accent
        '#FF6F91', // pink
        '#F9F871', // light yellow
      ],
    })
  }, [])

  return (
    <Card
      className={cn(
        'relative z-20 mx-4 border-0 bg-white transition-all duration-500 ease-in-out',
        isVisible ? 'translate-y-0 opacity-100' : 'translate-y-5 opacity-0'
      )}
    >
      <CardHeader className="space-y-2 text-center">
        <CardTitle>
          <span role="img" aria-label="party popper">
            🎉
          </span>{' '}
          Welcome to Paladin
        </CardTitle>
        <CardDescription>
          Your community is live! Log in to get started.
        </CardDescription>
      </CardHeader>

      <CardContent>
        <VFlex className="items-center">
          {/* Success Banner with Link */}
          <a
            href={communityUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 rounded-lg border border-green-200 bg-gradient-to-r from-green-50 to-green-100 px-5 py-3 text-green-800 shadow-sm transition hover:from-green-100 hover:to-green-200"
          >
            <CheckCircle2 className="h-4 min-h-4 w-4 min-w-4 text-green-600" />
            <span className="break-all text-base font-semibold">
              {communityUrl}
            </span>
            <ExternalLink className="h-4 min-h-4 w-4 min-w-4 text-green-600" />
          </a>
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
