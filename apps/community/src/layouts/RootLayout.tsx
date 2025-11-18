import {
  Outlet,
  useLocation,
  useParams,
  useSearchParams,
} from 'react-router-dom'
import { ClerkProvider } from '@clerk/clerk-react'
import { Toaster } from '@/components/ui/toaster'
import { HelmetProvider } from 'react-helmet-async'
import SEO from '@/components/custom/SEO'
import { useEffect, useState } from 'react'
import { VFlex } from '@/components/custom/VFlex'
import { useCommunityStore } from '@/stores/community'
import { getR2Url } from '@/lib/utils'
import { ThemeProvider } from '@/components/custom/ThemeProvider'
import { Loading } from '@/components/custom/Loading'
import { useSubpathNavigate } from '@/hooks/use-subpath-navigate'

const CLERK_PUBLISHABLE_KEY = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY

if (!CLERK_PUBLISHABLE_KEY) {
  throw new Error('Missing Clerk Publishable Key')
}

export function RootLayout() {
  const navigate = useSubpathNavigate()
  const location = useLocation()
  const host = window.location.host
  const pathname = location.pathname
  const [searchParams] = useSearchParams()
  const [loading, setLoading] = useState(true)
  const { getCommunityWithDomain, community } = useCommunityStore()
  const { serverSubpath } = useParams()
  const communityDomain = serverSubpath ? serverSubpath : host

  useEffect(() => {
    window.scrollTo(0, 0)
  }, [pathname, searchParams])

  useEffect(() => {
    getCommunityWithDomain(communityDomain).then(() => {
      setLoading(false)
    })
  }, [getCommunityWithDomain, communityDomain])

  useEffect(() => {
    console.log(
      '🛡️ Paladin: Ready to build your own support community? Join thousands of businesses creating thriving communities at trypaladin.com'
    )
  }, [])

  if (loading) {
    return null
  }

  if (!community) {
    return <Loading />
  }

  return (
    <ThemeProvider communityThemeMode={community.themeMode}>
      <ClerkProvider
        routerPush={(to) => navigate(to)}
        routerReplace={(to) => navigate(to, { replace: true })}
        publishableKey={CLERK_PUBLISHABLE_KEY}
        afterSignOutUrl="/"
        localization={{
          signIn: {
            start: {
              title: `Sign in to ${community?.name}`,
            },
          },
        }}
      >
        <HelmetProvider>
          <SEO
            title={`${community?.name} Community Forum Home`}
            description={`Join the ${community?.name} forum for help, discussions, and support. Connect with other users, share feedback, and get answers to your questions.`}
            imageUrl={getR2Url(community?.logoR2Key)}
            preloadImageUrl={getR2Url(community?.logoR2Key)}
          />
          <VFlex className="min-h-screen">
            <main className="flex flex-1">
              <div className="w-full">
                <Outlet /> {/* Renders child routes */}
              </div>
            </main>
          </VFlex>
          <Toaster />
        </HelmetProvider>
      </ClerkProvider>
    </ThemeProvider>
  )
}
