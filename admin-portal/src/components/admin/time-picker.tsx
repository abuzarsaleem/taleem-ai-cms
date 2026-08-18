import { useMemo, useState } from "react"
import { ClockIcon } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { cn } from "@/lib/utils"

const HOURS = Array.from({ length: 12 }, (_, index) => index + 1)
const MINUTES = Array.from({ length: 12 }, (_, index) => index * 5)

function pad(value: number) {
  return String(value).padStart(2, "0")
}

function parseHm(value: string) {
  const match = /^(\d{1,2}):(\d{2})/.exec(value)
  if (!match) return null
  const hour = Number(match[1])
  const minute = Number(match[2])
  if (hour > 23 || minute > 59) return null
  return { hour, minute }
}

function toHm(hour: number, minute: number) {
  return `${pad(hour)}:${pad(minute)}`
}

function formatDisplay(value: string) {
  const parsed = parseHm(value)
  if (!parsed) return ""
  const date = new Date()
  date.setHours(parsed.hour, parsed.minute, 0, 0)
  return new Intl.DateTimeFormat(undefined, {
    hour: "numeric",
    minute: "2-digit",
  }).format(date)
}

type DayPeriod = "AM" | "PM"

function to12Hour(hour24: number): { hour12: number; period: DayPeriod } {
  const period: DayPeriod = hour24 >= 12 ? "PM" : "AM"
  const hour12 = hour24 % 12 || 12
  return { hour12, period }
}

function to24Hour(hour12: number, period: DayPeriod) {
  if (period === "AM") return hour12 === 12 ? 0 : hour12
  return hour12 === 12 ? 12 : hour12 + 12
}

type TimePickerProps = {
  id?: string
  value: string
  disabled?: boolean
  placeholder?: string
  minTime?: string
  onChange: (next: string) => void
}

export function TimePicker({
  id,
  value,
  disabled = false,
  placeholder = "Pick a time",
  minTime,
  onChange,
}: TimePickerProps) {
  const [open, setOpen] = useState(false)
  const parsed = parseHm(value)
  const selected = parsed
    ? to12Hour(parsed.hour)
    : { hour12: 9, period: "AM" as const }
  const selectedMinute = parsed
    ? Math.round(parsed.minute / 5) * 5 === 60
      ? 0
      : Math.round(parsed.minute / 5) * 5
    : 0

  const min = useMemo(() => (minTime ? parseHm(minTime) : null), [minTime])

  function isDisabled(hour12: number, minute: number, period: DayPeriod) {
    if (!min) return false
    const hour24 = to24Hour(hour12, period)
    return hour24 * 60 + minute < min.hour * 60 + min.minute
  }

  function select(hour12: number, minute: number, period: DayPeriod) {
    if (isDisabled(hour12, minute, period)) return
    onChange(toHm(to24Hour(hour12, period), minute))
  }

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
        <ClockIcon className="size-4 text-muted-foreground" />
        {value ? formatDisplay(value) : placeholder}
      </PopoverTrigger>
      <PopoverContent align="start" className="w-64 p-3">
        <div className="mb-2 flex items-center justify-between">
          <p className="text-sm font-medium">
            {value ? formatDisplay(value) : "Select time"}
          </p>
          <div className="inline-flex rounded-md border p-0.5">
            {(["AM", "PM"] as const).map((period) => (
              <button
                key={period}
                type="button"
                className={cn(
                  "rounded px-2 py-0.5 text-xs",
                  selected.period === period
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:text-foreground",
                )}
                onClick={() =>
                  select(selected.hour12, selectedMinute, period)
                }
              >
                {period}
              </button>
            ))}
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <p className="mb-1.5 text-[11px] font-medium tracking-wide text-muted-foreground uppercase">
              Hour
            </p>
            <div className="grid grid-cols-3 gap-1">
              {HOURS.map((hour) => {
                const blocked = isDisabled(hour, selectedMinute, selected.period)
                const active = parsed ? selected.hour12 === hour : false
                return (
                  <button
                    key={hour}
                    type="button"
                    disabled={blocked}
                    className={cn(
                      "h-8 rounded-md text-sm hover:bg-muted",
                      active && "bg-primary text-primary-foreground hover:bg-primary",
                      blocked && "opacity-40",
                    )}
                    onClick={() => select(hour, selectedMinute, selected.period)}
                  >
                    {hour}
                  </button>
                )
              })}
            </div>
          </div>
          <div>
            <p className="mb-1.5 text-[11px] font-medium tracking-wide text-muted-foreground uppercase">
              Minute
            </p>
            <div className="grid grid-cols-3 gap-1">
              {MINUTES.map((minute) => {
                const blocked = isDisabled(selected.hour12, minute, selected.period)
                const active = parsed ? selectedMinute === minute : false
                return (
                  <button
                    key={minute}
                    type="button"
                    disabled={blocked}
                    className={cn(
                      "h-8 rounded-md text-sm hover:bg-muted",
                      active && "bg-primary text-primary-foreground hover:bg-primary",
                      blocked && "opacity-40",
                    )}
                    onClick={() =>
                      select(selected.hour12, minute, selected.period)
                    }
                  >
                    {pad(minute)}
                  </button>
                )
              })}
            </div>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  )
}

export { parseHm }
