import { ChevronsUpDownIcon } from "lucide-react"
import { useMemo, useState } from "react"

import { Button } from "@/components/ui/button"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { cn } from "@/lib/utils"

export type SearchableOption = {
  value: string
  label: string
}

type SearchableSelectProps = {
  id?: string
  value: string
  onChange: (value: string) => void
  options: SearchableOption[]
  placeholder?: string
  searchPlaceholder?: string
  emptyText?: string
  allowEmpty?: boolean
  emptyLabel?: string
  disabled?: boolean
  className?: string
  "aria-invalid"?: boolean
}

export function SearchableSelect({
  id,
  value,
  onChange,
  options,
  placeholder = "Select…",
  searchPlaceholder = "Search…",
  emptyText = "No results",
  allowEmpty = false,
  emptyLabel = "All",
  disabled,
  className,
  "aria-invalid": ariaInvalid,
}: SearchableSelectProps) {
  const [open, setOpen] = useState(false)
  const selected = options.find((option) => option.value === value)

  const items = useMemo(() => {
    if (!allowEmpty) return options
    return [{ value: "", label: emptyLabel }, ...options]
  }, [allowEmpty, emptyLabel, options])

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        id={id}
        disabled={disabled}
        aria-invalid={ariaInvalid}
        render={
          <Button
            type="button"
            variant="outline"
            className={cn(
              "h-8 w-full min-w-0 justify-between gap-2 overflow-hidden px-2.5 font-normal",
              !selected && !value && "text-muted-foreground",
              className,
            )}
          />
        }
      >
        <span className="min-w-0 flex-1 truncate text-left">
          {selected?.label || (value ? value : placeholder)}
        </span>
        <ChevronsUpDownIcon className="size-4 shrink-0 opacity-50" />
      </PopoverTrigger>
      <PopoverContent align="start" className="w-[var(--anchor-width)] min-w-56 p-0">
        <Command>
          <CommandInput placeholder={searchPlaceholder} />
          <CommandList>
            <CommandEmpty>{emptyText}</CommandEmpty>
            <CommandGroup>
              {items.map((option) => (
                <CommandItem
                  key={option.value || "empty"}
                  value={`${option.label} ${option.value}`}
                  data-checked={option.value === value || undefined}
                  className="min-w-0"
                  onSelect={() => {
                    onChange(option.value)
                    setOpen(false)
                  }}
                >
                  <span className="truncate">{option.label}</span>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}
