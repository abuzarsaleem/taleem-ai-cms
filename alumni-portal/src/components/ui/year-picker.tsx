import { useMemo, useState } from "react"
import { ChevronDownIcon } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { ScrollArea } from "@/components/ui/scroll-area"

type YearPickerProps = {
  id?: string
  value?: string
  onChange?: (year: string) => void
  minYear?: number
  maxYear?: number
  placeholder?: string
  disabled?: boolean
  "aria-invalid"?: boolean
  className?: string
}

export function YearPicker({
  id,
  value,
  onChange,
  minYear = 1980,
  maxYear = new Date().getFullYear(),
  placeholder = "Select year",
  disabled,
  "aria-invalid": ariaInvalid,
  className,
}: YearPickerProps) {
  const [open, setOpen] = useState(false)

  const years = useMemo(() => {
    const list: number[] = []
    for (let year = maxYear; year >= minYear; year -= 1) {
      list.push(year)
    }
    return list
  }, [minYear, maxYear])

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
              "h-8 w-full justify-between px-2.5 font-normal",
              !value && "text-muted-foreground",
              className,
            )}
          />
        }
      >
        <span>{value || placeholder}</span>
        <ChevronDownIcon className="size-4 opacity-50" />
      </PopoverTrigger>
      <PopoverContent align="start" className="w-[var(--anchor-width)] p-1">
        <ScrollArea className="h-56">
          <div className="flex flex-col gap-0.5 pr-2">
            {years.map((year) => {
              const selected = value === String(year)
              return (
                <button
                  key={year}
                  type="button"
                  className={cn(
                    "rounded-md px-2.5 py-1.5 text-left text-sm outline-none hover:bg-muted",
                    selected && "bg-primary text-primary-foreground hover:bg-primary",
                  )}
                  onClick={() => {
                    onChange?.(String(year))
                    setOpen(false)
                  }}
                >
                  {year}
                </button>
              )
            })}
          </div>
        </ScrollArea>
      </PopoverContent>
    </Popover>
  )
}
