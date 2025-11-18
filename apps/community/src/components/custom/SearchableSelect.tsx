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

interface SearchableSelectProps {
  placeholderSelect: string
  placeholderSearch: string
  value: string
  setValue: (value: string) => void
  options: { value: string; label: string }[]
  className?: string
}

export function SearchableSelect({
  placeholderSelect,
  placeholderSearch,
  value,
  options,
  setValue,
  className,
}: SearchableSelectProps) {
  const [open, setOpen] = useState(false)
  const triggerRef = useRef<HTMLButtonElement | null>(null)
  const [contentWidth, setContentWidth] = useState<number | undefined>(
    undefined
  )
  const [commandInput, setCommandInput] = useState<string | undefined>(
    undefined
  )

  // Super hacky way to keep width same
  useEffect(() => {
    if (triggerRef.current) {
      setContentWidth(triggerRef.current.offsetWidth)
    }
  }, [open])

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
            {options.find((option) => option.value === value)?.label ??
              placeholderSelect}
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent style={{ width: contentWidth }} className="p-0">
          <Command>
            <CommandInput
              placeholder={placeholderSearch}
              value={commandInput}
              onValueChange={(value) => setCommandInput(value)}
            />
            <CommandEmpty>No option found</CommandEmpty>
            <CommandList>
              <CommandGroup>
                <CommandList>
                  {options
                    .filter((option) =>
                      option.label
                        .toLowerCase()
                        .includes(
                          commandInput ? commandInput.toLowerCase() : ''
                        )
                    )
                    .map((option) => (
                      <CommandItem
                        key={option.value}
                        value={option.label}
                        onSelect={() => {
                          setOpen(false)
                          setValue(option.value)
                        }}
                        className="cursor-pointer"
                      >
                        <Check
                          className={cn(
                            'mr-2 h-4 w-4',
                            value === option.value ? 'opacity-100' : 'opacity-0'
                          )}
                        />
                        {option.label}
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
