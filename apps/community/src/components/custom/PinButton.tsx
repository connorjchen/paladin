import { ButtonIcon } from './ButtonIcon'
import { Pin } from 'lucide-react'

interface PinButtonProps {
  isPinned: boolean
  onPinChange: (isPinned: boolean) => void
}

export function PinButton({ isPinned, onPinChange }: PinButtonProps) {
  return (
    <ButtonIcon
      onClick={() => onPinChange(!isPinned)}
      variant={isPinned ? 'default' : 'outline'}
    >
      <Pin className="h-4 w-4" />
    </ButtonIcon>
  )
}
