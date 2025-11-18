import { Button } from '@/components/ui/button'
import { VFlex } from '@/components/custom/VFlex'
import NoSEO from '@/components/custom/NoSEO'
import { H1, H2, P2 } from '@/components/custom/Text'
import { SubpathLink } from '@/components/custom/SubpathLink'

export function NotFound() {
  return (
    <>
      <NoSEO />
      <VFlex className="h-[80vh] items-center justify-center gap-6">
        <H1 className="text-6xl text-black">404</H1>
        <H2 className="text-black">Oops! Page Not Found</H2>
        <P2 muted>
          The page you're looking for doesn't exist or has been moved.
        </P2>
        <Button className="mt-4">
          <SubpathLink to="/">Go Home</SubpathLink>
        </Button>
      </VFlex>
    </>
  )
}
