import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { VFlex } from '@/components/custom/VFlex'
import { P2 } from '@/components/custom/Text'

export interface DomainSectionProps {
  domain: string | undefined
}

export function DomainSection({ domain }: DomainSectionProps) {
  return (
    <VFlex className="gap-2">
      <Label htmlFor="community-domain">Domain</Label>
      <P2 muted>
        To update your domain, please open a support ticket at{' '}
        <a
          href="https://community.trypaladin.com"
          target="_blank"
          rel="noopener noreferrer"
          className="text-primary hover:underline"
        >
          community.trypaladin.com
        </a>
        .
      </P2>
      <Input value={domain || ''} disabled className="w-64" />
    </VFlex>
  )
}
