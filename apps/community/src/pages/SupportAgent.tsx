import { DocumentIndex } from '@/components/custom/DocumentIndex'
import { SupportAgentPlayground } from '@/components/custom/SupportAgentPlayground'
import { Container } from '@/components/custom/Container'
import { H1, P2 } from '@/components/custom/Text'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { useCommunityStore } from '@/stores/community'
import { useState } from 'react'
import { HFlex } from '@/components/custom/HFlex'
import { VFlex } from '@/components/custom/VFlex'

export function SupportAgentPage() {
  const { community, updateCommunity, getCommunity } = useCommunityStore()
  const [enableSupportAgentLoading, setEnableSupportAgentLoading] =
    useState(false)

  if (!community) return null

  return (
    <Container>
      <H1>Support Agent</H1>

      <VFlex className="gap-2">
        <HFlex className="gap-2">
          <Label htmlFor="support-agent">Enable Support Agent</Label>
          <Switch
            id="support-agent"
            checked={community.isSupportAgentEnabled}
            onCheckedChange={async () => {
              setEnableSupportAgentLoading(true)
              await updateCommunity({
                isSupportAgentEnabled: !community.isSupportAgentEnabled,
              })
              await getCommunity()
              setEnableSupportAgentLoading(false)
            }}
            disabled={enableSupportAgentLoading}
          />
        </HFlex>
        <P2 muted>
          This will activate a support bot that automatically comments under
          every question with an attempted answer based on uploaded documents
          and previous questions.
        </P2>
      </VFlex>

      <SupportAgentPlayground />
      <DocumentIndex />
    </Container>
  )
}
