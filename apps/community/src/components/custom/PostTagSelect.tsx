import { Check, ChevronsUpDown } from 'lucide-react'

import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { useEffect, useRef, useState } from 'react'
import { PostTag as PostTagType } from '@prisma/client'
import { ColoredBadge } from './ColoredBadge'
import { HFlex } from './HFlex'

interface PostTagMultiSelectProps {
  singleSelect?: boolean
  placeholder?: string
  values: string[]
  setValues: (values: string[]) => void
  options: PostTagType[]
  className?: string
}

export function PostTagMultiSelect({
  singleSelect,
  placeholder,
  values,
  options,
  setValues,
  className,
}: PostTagMultiSelectProps) {
  const [open, setOpen] = useState(false)
  const triggerRef = useRef<HTMLButtonElement | null>(null)
  const [contentWidth, setContentWidth] = useState<number | undefined>(
    undefined
  )

  // Super hacky way to keep width same
  useEffect(() => {
    if (triggerRef.current) {
      setContentWidth(triggerRef.current.offsetWidth)
    }
  }, [open])

  const handleSetValue = (val: string) => {
    if (singleSelect) {
      if (values.includes(val)) {
        setValues([])
      } else {
        setValues([val])
      }
    } else {
      setValues(
        values.includes(val)
          ? values.filter((v) => v !== val)
          : [...values, val]
      )
    }
  }

  return (
    <div className={className}>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            ref={triggerRef}
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="h-fit w-full justify-between font-normal"
          >
            <HFlex className="gap-2">
              {values.length > 0
                ? values.map((value) => (
                    <ColoredBadge
                      key={value}
                      color={
                        options.find((option) => option.id === value)?.color ??
                        ''
                      }
                      name={
                        options.find((option) => option.id === value)?.name ??
                        ''
                      }
                    />
                  ))
                : (placeholder ?? 'Select tags')}
            </HFlex>
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent style={{ width: contentWidth }} className="p-0">
          <Command>
            <CommandInput placeholder={placeholder ?? 'Search tags'} />
            <CommandEmpty>No option found</CommandEmpty>
            <CommandList>
              <CommandGroup>
                <CommandList>
                  {options.map((option) => (
                    <CommandItem
                      key={option.id}
                      value={option.name}
                      onSelect={() => {
                        handleSetValue(option.id)
                      }}
                      className="cursor-pointer"
                    >
                      <Check
                        className={cn(
                          'mr-2 h-4 w-4',
                          values.includes(option.id)
                            ? 'opacity-100'
                            : 'opacity-0'
                        )}
                      />
                      <ColoredBadge color={option.color} name={option.name} />
                    </CommandItem>
                  ))}
                </CommandList>
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
    </div>
  )
}
