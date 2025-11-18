import { ReactNode } from 'react'
import { Tooltip } from '../ui/tooltip'
import { TooltipContent } from '../ui/tooltip'
import { TooltipProvider, TooltipTrigger } from '../ui/tooltip'

interface TooltipWrapperProps {
  children: ReactNode
  tooltipText: string
}

export const TooltipWrapper = ({
  children,
  tooltipText,
}: TooltipWrapperProps) => {
  return (
    <TooltipProvider delayDuration={0}>
      <Tooltip>
        <TooltipTrigger asChild>{children}</TooltipTrigger>
        <TooltipContent>{tooltipText}</TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}
