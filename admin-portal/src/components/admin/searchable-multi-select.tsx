import { useEffect, useMemo, useRef, useState } from "react"
import { CheckIcon, ChevronsUpDownIcon, SearchIcon, XIcon } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"

export type SearchableOption = {
  value: string
  label: string
  hint?: string
}

type SearchableMultiSelectProps = {
  label: string
  placeholder?: string
  searchPlaceholder?: string
  allLabel?: string
  options: SearchableOption[]
  values: string[]
  disabled?: boolean
  emptyText?: string
  onChange: (next: string[]) => void
}

function toggleValue(values: string[], value: string) {
  return values.includes(value)
    ? values.filter((item) => item !== value)
    : [...values, value]
}

export function SearchableMultiSelect({
  label,
  placeholder = "All",
  searchPlaceholder = "Search…",
  allLabel = "All",
  options,
  values,
  disabled = false,
  emptyText = "No options found",
  onChange,
}: SearchableMultiSelectProps) {
  const rootRef = useRef<HTMLDivElement>(null)
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState("")

  useEffect(() => {
    if (!open) return

    function handlePointerDown(event: MouseEvent) {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false)
      }
    }

    document.addEventListener("mousedown", handlePointerDown)
    return () => document.removeEventListener("mousedown", handlePointerDown)
  }, [open])

  const selected = useMemo(
    () => options.filter((option) => values.includes(option.value)),
    [options, values],
  )

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase()
    if (!needle) return options
    return options.filter((option) =>
      `${option.label} ${option.hint ?? ""}`.toLowerCase().includes(needle),
    )
  }, [options, query])

  return (
    <div ref={rootRef} className="flex flex-col gap-2">
      <p className="text-sm font-medium">{label}</p>
      <Button
        type="button"
        variant="outline"
        disabled={disabled}
        aria-expanded={open}
        className="h-8 w-full justify-between font-normal"
        onClick={() => setOpen((prev) => !prev)}
      >
        <span className="truncate text-left">
          {selected.length
            ? `${selected.length} selected`
            : placeholder}
        </span>
        <ChevronsUpDownIcon className="size-3.5 text-muted-foreground" />
      </Button>

      {open ? (
        <div className="overflow-hidden rounded-lg border bg-popover">
          <div className="relative border-b p-2">
            <SearchIcon className="pointer-events-none absolute top-1/2 left-4 size-3.5 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={searchPlaceholder}
              className="h-8 pl-8"
              autoFocus
            />
          </div>
          <div className="max-h-52 overflow-auto p-1">
            <button
              type="button"
              disabled={disabled}
              className={cn(
                "flex w-full items-start gap-2 rounded-md px-2 py-1.5 text-left hover:bg-muted/60",
                !values.length && "bg-muted/40",
              )}
              onClick={() => onChange([])}
            >
              <span
                className={cn(
                  "mt-0.5 flex size-4 shrink-0 items-center justify-center rounded-[4px] border",
                  !values.length
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-input",
                )}
              >
                {!values.length ? <CheckIcon className="size-3" /> : null}
              </span>
              <span className="text-sm font-medium">{allLabel}</span>
            </button>
            {filtered.length ? (
              filtered.map((option) => {
                const checked = values.includes(option.value)
                return (
                  <button
                    key={option.value}
                    type="button"
                    disabled={disabled}
                    className={cn(
                      "flex w-full items-start gap-2 rounded-md px-2 py-1.5 text-left hover:bg-muted/60",
                      checked && "bg-muted/40",
                    )}
                    onClick={() => onChange(toggleValue(values, option.value))}
                  >
                    <span
                      className={cn(
                        "mt-0.5 flex size-4 shrink-0 items-center justify-center rounded-[4px] border",
                        checked
                          ? "border-primary bg-primary text-primary-foreground"
                          : "border-input",
                      )}
                    >
                      {checked ? <CheckIcon className="size-3" /> : null}
                    </span>
                    <span className="min-w-0">
                      <span className="block text-sm">{option.label}</span>
                      {option.hint ? (
                        <span className="block text-xs text-muted-foreground">
                          {option.hint}
                        </span>
                      ) : null}
                    </span>
                  </button>
                )
              })
            ) : (
              <p className="px-2 py-4 text-center text-sm text-muted-foreground">
                {emptyText}
              </p>
            )}
          </div>
        </div>
      ) : null}

      {selected.length ? (
        <div className="flex flex-wrap gap-1.5">
          {selected.map((option) => (
            <Badge key={option.value} variant="secondary" className="pr-1">
              <span className="max-w-40 truncate">{option.label}</span>
              <button
                type="button"
                disabled={disabled}
                className="rounded-full p-0.5 hover:bg-muted"
                onClick={() => onChange(toggleValue(values, option.value))}
                aria-label={`Remove ${option.label}`}
              >
                <XIcon className="size-3" />
              </button>
            </Badge>
          ))}
        </div>
      ) : null}
    </div>
  )
}
