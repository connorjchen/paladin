import { useState } from 'react'
import { HFlex } from './HFlex'

export function CopyBlock({ value }: { value: string }) {
  const [copied, setCopied] = useState(false)
  return (
    <HFlex className="bg-muted z-10 gap-1 rounded-lg px-2 py-1 text-sm outline outline-1 outline-black">
      <code>{value}</code>
      <button
        type="button"
        aria-label="Copy"
        onClick={async () => {
          await navigator.clipboard.writeText(value)
          setCopied(true)
          setTimeout(() => setCopied(false), 1000)
        }}
      >
        {copied ? '✓' : '⧉'}
      </button>
    </HFlex>
  )
}
