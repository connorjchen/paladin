import { Outlet, useLocation, useSearchParams } from 'react-router-dom'
import { Toaster } from '@/components/ui/toaster'
import { HelmetProvider } from 'react-helmet-async'
import SEO from '@/components/custom/SEO'
import { useEffect } from 'react'
import { VFlex } from '@/components/custom/VFlex'

export function RootLayout() {
  const location = useLocation()
  const pathname = location.pathname
  const [searchParams] = useSearchParams()

  useEffect(() => {
    window.scrollTo(0, 0)
  }, [pathname, searchParams])

  return (
    <HelmetProvider>
      <SEO
        title="Paladin"
        description="Paladin: Ready to build your own support community? Join thousands of businesses creating thriving communities at trypaladin.com"
        imageUrl={'https://dashboard.trypaladin.com/logo.png'}
      />
      <VFlex className="min-h-screen w-screen">
        <main className="flex flex-1">
          <div className="w-screen">
            <Outlet /> {/* Renders child routes */}
          </div>
        </main>
      </VFlex>
      <Toaster />
    </HelmetProvider>
  )
}
