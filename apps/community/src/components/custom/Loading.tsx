import { HFlex } from './HFlex'

export function Loading() {
  return (
    <HFlex className="my-4 justify-center gap-1">
      <div className="h-2 w-2 animate-bounce rounded-full bg-gray-200 [animation-delay:-0.3s]"></div>
      <div className="h-2 w-2 animate-bounce rounded-full bg-gray-200 [animation-delay:-0.15s]"></div>
      <div className="h-2 w-2 animate-bounce rounded-full bg-gray-200"></div>
    </HFlex>
  )
}
