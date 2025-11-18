import { Loader2Icon } from 'lucide-react'
import { Button, ButtonProps } from '../ui/button'
import { HFlex } from './HFlex'

interface LoadingButtonProps extends ButtonProps {
  loading: boolean
}

export function LoadingButton({ loading, ...props }: LoadingButtonProps) {
  return (
    <Button {...props} disabled={loading || props.disabled}>
      {loading ? (
        <HFlex className="gap-2">
          <Loader2Icon className="h-4 w-4 animate-spin" />
          {props.children}
        </HFlex>
      ) : (
        props.children
      )}
    </Button>
  )
}
