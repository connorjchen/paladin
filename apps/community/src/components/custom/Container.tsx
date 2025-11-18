import { VFlex } from './VFlex'
import { cn } from '@/lib/utils'

interface ContainerProps {
  children: React.ReactNode
  className?: string
}

export function Container({ children, className }: ContainerProps) {
  return (
    <VFlex className={cn('container mx-auto gap-4 p-4', className)}>
      {children}
    </VFlex>
  )
}
