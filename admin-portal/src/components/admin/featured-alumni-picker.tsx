import { useEffect, useState } from "react"
import { SearchIcon, XIcon } from "lucide-react"

import { useAuth } from "@/auth/AuthContext"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Field, FieldDescription, FieldError, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import {
  alumniService,
  type AdminAlumniListItem,
} from "@/services/alumni.service"

function initialsFromName(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean)
  if (!parts.length) return "?"
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return `${parts[0][0]}${parts[1][0]}`.toUpperCase()
}

type FeaturedAlumniPickerProps = {
  value: string
  label: string
  required?: boolean
  disabled?: boolean
  error?: string
  description?: string
  onChange: (next: { id: string; label: string }) => void
  onClear: () => void
}

export function FeaturedAlumniPicker({
  value,
  label,
  required = false,
  disabled = false,
  error,
  description,
  onChange,
  onClear,
}: FeaturedAlumniPickerProps) {
  const { token } = useAuth()
  const [query, setQuery] = useState("")
  const [results, setResults] = useState<AdminAlumniListItem[]>([])
  const [searching, setSearching] = useState(false)

  useEffect(() => {
    if (!token || value) {
      setResults([])
      return
    }
    if (query.trim().length < 2) {
      setResults([])
      return
    }

    let cancelled = false
    const timer = window.setTimeout(() => {
      void (async () => {
        setSearching(true)
        try {
          const result = await alumniService.list(token, {
            search: query.trim(),
            page: 1,
            page_size: 8,
          })
          if (!cancelled) setResults(result.items)
        } catch {
          if (!cancelled) setResults([])
        } finally {
          if (!cancelled) setSearching(false)
        }
      })()
    }, 300)

    return () => {
      cancelled = true
      window.clearTimeout(timer)
    }
  }, [token, query, value])

  return (
    <Field data-invalid={!!error || undefined}>
      <FieldLabel htmlFor="featured_alumni_search">
        Featured alumni{required ? " *" : ""}
      </FieldLabel>
      {description ? <FieldDescription>{description}</FieldDescription> : null}

      {value ? (
        <div className="flex items-center justify-between gap-3 rounded-lg border px-3 py-2">
          <div className="min-w-0">
            <p className="truncate text-sm font-medium">{label || value}</p>
            <p className="truncate text-xs text-muted-foreground">{value}</p>
          </div>
          <Button
            type="button"
            size="icon-sm"
            variant="ghost"
            disabled={disabled}
            onClick={onClear}
          >
            <XIcon />
            <span className="sr-only">Clear featured alumni</span>
          </Button>
        </div>
      ) : (
        <div className="relative">
          <SearchIcon className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            id="featured_alumni_search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search alumni by name, email, or phone…"
            className="pl-8"
            disabled={disabled}
          />
        </div>
      )}

      {searching ? (
        <p className="text-xs text-muted-foreground">Searching alumni…</p>
      ) : null}

      {!value && results.length ? (
        <div className="max-h-64 overflow-auto rounded-lg border">
          {results.map((alumni) => (
            <button
              key={alumni.alumni_id}
              type="button"
              className="flex w-full items-center gap-3 border-b px-3 py-2 text-left last:border-b-0 hover:bg-muted/50"
              onClick={() => {
                onChange({
                  id: alumni.alumni_id,
                  label: alumni.full_name,
                })
                setQuery("")
                setResults([])
              }}
            >
              <Avatar className="size-8">
                {alumni.photo_url ? (
                  <AvatarImage src={alumni.photo_url} alt={alumni.full_name} />
                ) : null}
                <AvatarFallback className="text-xs">
                  {initialsFromName(alumni.full_name)}
                </AvatarFallback>
              </Avatar>
              <div className="min-w-0">
                <p className="truncate text-sm font-medium">{alumni.full_name}</p>
                <p className="truncate text-xs text-muted-foreground">
                  {alumni.email}
                  {alumni.graduation_year
                    ? ` · Class of ${alumni.graduation_year}`
                    : ""}
                </p>
              </div>
            </button>
          ))}
        </div>
      ) : null}

      {!value && query.trim().length >= 2 && !searching && !results.length ? (
        <p className="text-xs text-muted-foreground">No alumni matched that search.</p>
      ) : null}

      <FieldError>{error}</FieldError>
    </Field>
  )
}
