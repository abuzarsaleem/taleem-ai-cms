import { useState } from "react"
import { CalendarIcon } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { cn } from "@/lib/utils"

function startOfDay(date: Date) {
  const next = new Date(date)
  next.setHours(0, 0, 0, 0)
  return next
}

function parseYmd(value: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return undefined
  const [year, month, day] = value.split("-").map(Number)
  const date = new Date(year, month - 1, day)
  if (
    date.getFullYear() !== year ||
    date.getMonth() !== month - 1 ||
    date.getDate() !== day
  ) {
    return undefined
  }
  return date
}

function toYmd(date: Date) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, "0")
  const day = String(date.getDate()).padStart(2, "0")
  return `${year}-${month}-${day}`
}

function formatDisplay(value: string) {
  const date = parseYmd(value)
  if (!date) return ""
  return new Intl.DateTimeFormat(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(date)
}

type DatePickerProps = {
  id?: string
  value: string
  disabled?: boolean
  minDate?: Date
  placeholder?: string
  onChange: (next: string) => void
}

export function DatePicker({
  id,
  value,
  disabled = false,
  minDate,
  placeholder = "Pick a date",
  onChange,
}: DatePickerProps) {
  const [open, setOpen] = useState(false)
  const selected = parseYmd(value)
  const min = minDate ? startOfDay(minDate) : undefined

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        id={id}
        disabled={disabled}
        render={
          <Button
            type="button"
            variant="outline"
            className={cn(
              "h-9 w-full justify-start font-normal",
              !value && "text-muted-foreground",
            )}
          />
        }
      >
        <CalendarIcon className="size-4 text-muted-foreground" />
        {value ? formatDisplay(value) : placeholder}
      </PopoverTrigger>
      <PopoverContent align="start" className="w-auto p-2">
        <Calendar
          mode="single"
          selected={selected}
          defaultMonth={selected ?? min ?? new Date()}
          onSelect={(date: Date | undefined) => {
            if (!date) return
            onChange(toYmd(date))
            setOpen(false)
          }}
          disabled={min ? { before: min } : undefined}
        />
      </PopoverContent>
    </Popover>
  )
}

export { parseYmd, toYmd, startOfDay }
