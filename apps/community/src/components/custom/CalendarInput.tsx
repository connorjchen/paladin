import { format } from 'date-fns'
import { Calendar as CalendarIcon } from 'lucide-react'

import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Calendar } from '@/components/ui/calendar'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { FormControl } from '../ui/form'

interface CalendarInputProps {
  value: Date | null
  onChange: (date: Date | null) => void
  disabledFn?: (date: Date) => boolean
  formInput?: boolean
  onClick?: () => void
}

export function CalendarInput({
  value,
  onChange,
  disabledFn,
  formInput = false,
  onClick,
}: CalendarInputProps) {
  const buttonContent = (
    <Button
      variant={'outline'}
      className={cn(
        'w-full pl-3 text-left font-normal',
        !value && 'text-muted-foreground'
      )}
    >
      {value ? format(value, 'PP') : <span>Pick a date</span>}
      <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
    </Button>
  )

  return (
    <div onClick={onClick}>
      <Popover>
        <PopoverTrigger asChild>
          {formInput ? (
            <FormControl>{buttonContent}</FormControl>
          ) : (
            buttonContent
          )}
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar
            mode="single"
            selected={value ?? undefined}
            onSelect={(date) => onChange(date ?? null)}
            disabled={(date) =>
              disabledFn ? disabledFn(date) : date < new Date()
            }
            defaultMonth={value ?? new Date()}
            initialFocus
          />
        </PopoverContent>
      </Popover>
    </div>
  )
}
