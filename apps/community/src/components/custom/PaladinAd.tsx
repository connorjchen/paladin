import { Button } from '@/components/ui/button'
import { VFlex } from '@/components/custom/VFlex'
import { SilverStreaksBackground } from '@/components/custom/SilverStreaksBackground'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { H2, P2 } from '@/components/custom/Text'

export function PaladinAd() {
  return (
    <SilverStreaksBackground>
      <VFlex className="h-[80vh] items-center justify-center">
        <Card className="relative z-20">
          <CardHeader className="text-center">
            <CardTitle className="text-4xl font-bold">
              Welcome to Paladin
            </CardTitle>
          </CardHeader>
          <CardContent className="text-center">
            <VFlex className="gap-6">
              <H2>Build your own thriving support community</H2>
              <P2 muted className="max-w-md text-center">
                Join thousands of businesses creating thriving communities with
                Paladin. Get started today and build the support community your
                users deserve.
              </P2>
              <Button asChild className="mt-4">
                <a
                  href="https://trypaladin.com"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Visit trypaladin.com
                </a>
              </Button>
            </VFlex>
          </CardContent>
        </Card>
      </VFlex>
    </SilverStreaksBackground>
  )
}
