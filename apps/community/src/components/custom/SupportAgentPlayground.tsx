import { VFlex } from './VFlex'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useState } from 'react'
import { HFlex } from './HFlex'
import { CreateSupportAgentChatResponse } from '@paladin/shared'
import { useSupportAgentStore } from '@/stores/supportAgent'
import { MarkdownRenderer } from './MarkdownRenderer'
import { H2 } from './Text'
import { LoadingButton } from './LoadingButton'

export function SupportAgentPlayground() {
  const { createSupportAgentChat } = useSupportAgentStore()
  const [supportAgentChatQuestion, setSupportAgentChatQuestion] = useState('')
  const [supportAgentChatResponse, setSupportAgentChatResponse] =
    useState<CreateSupportAgentChatResponse | null>(null)
  const [supportAgentChatLoading, setSupportAgentChatLoading] = useState(false)

  const handleAskQuestion = async () => {
    setSupportAgentChatLoading(true)
    const response = await createSupportAgentChat({
      question: supportAgentChatQuestion,
    })
    if (response.data) {
      setSupportAgentChatResponse(response.data)
    }
    setSupportAgentChatLoading(false)
  }

  return (
    <VFlex className="gap-2">
      <H2>Playground</H2>
      <HFlex className="gap-2">
        <Input
          placeholder="Ask a question"
          value={supportAgentChatQuestion}
          onChange={(e) => setSupportAgentChatQuestion(e.target.value)}
          onKeyDown={async (e) => {
            if (e.key === 'Enter') {
              await handleAskQuestion()
            }
          }}
        />
        <LoadingButton
          loading={supportAgentChatLoading}
          onClick={handleAskQuestion}
        >
          Ask
        </LoadingButton>
      </HFlex>
      <VFlex className="border-sidebar-border max-h-[240px] min-h-[120px] overflow-y-auto rounded-md border p-2">
        {supportAgentChatResponse && (
          <VFlex className="gap-2">
            <Label>Response:</Label>
            <MarkdownRenderer content={supportAgentChatResponse.response} />
          </VFlex>
        )}
      </VFlex>
    </VFlex>
  )
}
