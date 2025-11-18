import { Button, ButtonProps } from '@/components/ui/button'
import { ReactNode } from 'react'

interface ButtonIconProps extends ButtonProps {
  children?: ReactNode
}

export function ButtonIcon({ children, ...props }: ButtonIconProps) {
  return (
    <Button size="icon" {...props}>
      {children}
    </Button>
  )
}
