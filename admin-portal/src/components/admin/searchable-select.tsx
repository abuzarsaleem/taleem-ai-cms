import { useMemo, useState } from "react"
import { CheckIcon, ChevronsUpDownIcon, SearchIcon } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { cn } from "@/lib/utils"

import type { SearchableOption } from "@/components/admin/searchable-multi-select"

type SearchableSelectProps = {
  placeholder?: string
  searchPlaceholder?: string
  options: SearchableOption[]
  value: string
  disabled?: boolean
  emptyText?: string
  onChange: (next: string) => void
}

export function SearchableSelect({
  placeholder = "All",
  searchPlaceholder = "Search…",
  options,
  value,
  disabled = false,
  emptyText = "No options found",
  onChange,
}: SearchableSelectProps) {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState("")

  const selected = options.find((option) => option.value === value)

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase()
    if (!needle) return options
    return options.filter((option) =>
      `${option.label} ${option.hint ?? ""}`.toLowerCase().includes(needle),
    )
  }, [options, query])

  function selectValue(next: string) {
    onChange(next)
    setOpen(false)
    setQuery("")
  }

  return (
    <Popover
      open={open}
      onOpenChange={(next) => {
        setOpen(next)
        if (!next) setQuery("")
      }}
    >
      <PopoverTrigger
        disabled={disabled}
        render={
          <Button
            type="button"
            variant="outline"
            aria-expanded={open}
            className="h-8 w-full justify-between font-normal"
          />
        }
      >
        <span
          className={cn(
            "truncate text-left",
            !selected && "text-muted-foreground",
          )}
        >
          {selected?.label ?? placeholder}
        </span>
        <ChevronsUpDownIcon className="size-3.5 shrink-0 text-muted-foreground" />
      </PopoverTrigger>
      <PopoverContent
        align="start"
        className="w-(--anchor-width) min-w-72 gap-0 p-0"
      >
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
              "flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left hover:bg-muted/60",
              !value && "bg-muted/40",
            )}
            onClick={() => selectValue("")}
          >
            <span
              className={cn(
                "flex size-4 shrink-0 items-center justify-center",
                !value ? "text-primary" : "text-transparent",
              )}
            >
              <CheckIcon className="size-3.5" />
            </span>
            <span className="text-sm font-medium">{placeholder}</span>
          </button>
          {filtered.length ? (
            filtered.map((option) => {
              const checked = option.value === value
              return (
                <button
                  key={option.value}
                  type="button"
                  disabled={disabled}
                  className={cn(
                    "flex w-full items-start gap-2 rounded-md px-2 py-1.5 text-left hover:bg-muted/60",
                    checked && "bg-muted/40",
                  )}
                  onClick={() => selectValue(option.value)}
                >
                  <span
                    className={cn(
                      "mt-0.5 flex size-4 shrink-0 items-center justify-center",
                      checked ? "text-primary" : "text-transparent",
                    )}
                  >
                    <CheckIcon className="size-3.5" />
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
      </PopoverContent>
    </Popover>
  )
}
