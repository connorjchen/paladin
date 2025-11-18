import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { VFlex } from '@/components/custom/VFlex'
import NoSEO from '@/components/custom/NoSEO'

export function NotFound() {
  return (
    <>
      <NoSEO />
      <VFlex className="h-[80vh] items-center justify-center gap-6">
        <h1 className="text-6xl font-bold text-black">404</h1>
        <h2 className="text-2xl text-black">Oops! Page Not Found</h2>
        <p className="text-muted-foreground">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <Button className="mt-4">
          <Link to="/">Go Home</Link>
        </Button>
      </VFlex>
    </>
  )
}
