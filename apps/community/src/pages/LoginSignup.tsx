import { SignIn, SignUp } from '@clerk/clerk-react'
import { HFlex } from '../components/custom/HFlex'
import { VFlex } from '../components/custom/VFlex'
import { SilverStreaksBackground } from '../components/custom/SilverStreaksBackground'
import { Link, Navigate, useParams, useSearchParams } from 'react-router-dom'
import { useUserStore } from '@/stores/user'
import { useCommunityStore } from '@/stores/community'
import { getSubpathPath } from '@/lib/utils'
import { SubpathLink } from '@/components/custom/SubpathLink'

interface LoginSignupPageProps {
  type: 'login' | 'signup'
}

export function LoginSignupPage({ type }: LoginSignupPageProps) {
  const { user, isAuthSetup, isAuthed } = useUserStore()
  const { community } = useCommunityStore()
  const [searchParams] = useSearchParams()
  const { serverSubpath } = useParams()
  const redirectSearchParam = searchParams.get('redirect')
  const redirectUrl = getSubpathPath(
    serverSubpath,
    redirectSearchParam ? decodeURIComponent(redirectSearchParam) : '/'
  )

  if (!community) {
    return null
  }

  if (!isAuthSetup || (isAuthed && !user?.id)) {
    return null
  }

  if (user) {
    return <Navigate to={redirectUrl} replace />
  }

  return (
    <SilverStreaksBackground>
      <HFlex className="h-full p-4">
        <div className="mx-auto w-full sm:w-1/2">
          <VFlex className="mx-auto w-fit items-center gap-8">
            {type === 'login' ? (
              <SignIn
                signUpUrl={getSubpathPath(serverSubpath, '/signup')}
                forceRedirectUrl={redirectUrl}
                fallbackRedirectUrl={redirectUrl}
                signUpForceRedirectUrl={redirectUrl}
                signUpFallbackRedirectUrl={redirectUrl}
              />
            ) : (
              <SignUp
                signInUrl={getSubpathPath(serverSubpath, '/login')}
                forceRedirectUrl={redirectUrl}
                fallbackRedirectUrl={redirectUrl}
                signInForceRedirectUrl={redirectUrl}
                signInFallbackRedirectUrl={redirectUrl}
              />
            )}

            <VFlex className="gap-4 text-center text-sm text-white">
              <p>
                By signing {type === 'login' ? 'in' : 'up'}, you agree to the{' '}
                <SubpathLink to={'/terms-of-service'} className="underline">
                  Terms of Service
                </SubpathLink>{' '}
                and{' '}
                <SubpathLink to={'/privacy-policy'} className="underline">
                  Privacy Policy
                </SubpathLink>
                .
              </p>
              <p>
                Need help?{' '}
                <Link to="mailto:support@paladin.com" className="font-medium">
                  Contact support
                </Link>
              </p>
            </VFlex>
          </VFlex>
        </div>
      </HFlex>
    </SilverStreaksBackground>
  )
}
