import { Button, ButtonProps } from '@/components/ui/button'
import { ReactNode } from 'react'
import { HFlex } from './HFlex'

interface ButtonWithIconProps extends ButtonProps {
  icon: ReactNode
  children: ReactNode
}

export function ButtonWithIcon({
  icon,
  children,
  ...props
}: ButtonWithIconProps) {
  return (
    <Button variant="outline" {...props}>
      <HFlex className="gap-2">
        {icon}
        {children}
      </HFlex>
    </Button>
  )
}
