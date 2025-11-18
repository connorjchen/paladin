import { VFlex } from '../components/custom/VFlex'
import { useState } from 'react'
import { SilverStreaksBackground } from '@/components/custom/SilverStreaksBackground'
import { OnboardingInputCard } from '@/components/custom/OnboardingInputCard'
import { OnboardingSuccessCard } from '@/components/custom/OnboardingSuccessCard'

export function OnboardingPage() {
  const [communityDomain, setCommunityDomain] = useState('')
  const [success, setSuccess] = useState(false)

  const onSuccess = (communityDomain: string) => {
    setSuccess(true)
    setCommunityDomain(communityDomain)
  }

  return (
    <SilverStreaksBackground>
      <VFlex className="h-full items-center justify-center">
        {success ? (
          <OnboardingSuccessCard communityDomain={communityDomain} />
        ) : (
          <OnboardingInputCard onSuccess={onSuccess} />
        )}
      </VFlex>
    </SilverStreaksBackground>
  )
}
