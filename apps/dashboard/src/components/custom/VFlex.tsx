import { HTMLAttributes } from 'react'
import { cn } from '../../lib/utils'

interface VFlexProps extends HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode
}

export function VFlex({ className, children, ...props }: VFlexProps) {
  return (
    <div
      className={cn('flex flex-col', className, {
        'cursor-pointer': props.onClick !== undefined,
      })}
      {...props}
    >
      {children}
    </div>
  )
}
