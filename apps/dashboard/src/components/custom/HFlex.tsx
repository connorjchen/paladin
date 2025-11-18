import { cn } from '../../lib/utils'
import { HTMLAttributes } from 'react'

interface HFlexProps extends HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode
}

export function HFlex({ className, children, ...props }: HFlexProps) {
  return (
    <div
      className={cn('flex items-center', className, {
        'cursor-pointer': props.onClick !== undefined,
      })}
      {...props}
    >
      {children}
    </div>
  )
}
