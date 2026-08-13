import { useEffect, useState } from "react"
import { Link, useNavigate, useSearchParams } from "react-router-dom"
import { ChevronRightIcon, SearchIcon } from "lucide-react"

import { useAuth } from "@/auth/AuthContext"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { ApiError } from "@/lib/api"
import { cn } from "@/lib/utils"
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

function programLabel(item: AdminAlumniListItem) {
  if (!item.degree_program) return "—"
  const campus = item.degree_program.campus
    ? ` — ${item.degree_program.campus}`
    : ""
  return `${item.degree_program.degree} ${item.degree_program.program}${campus}`
}

function locationLabel(item: AdminAlumniListItem) {
  return [item.city, item.country].filter(Boolean).join(", ") || "—"
}

function TableSkeleton() {
  return (
    <div className="overflow-hidden rounded-xl border">
      <div className="border-b bg-muted/40 px-4 py-3">
        <Skeleton className="h-4 w-40" />
      </div>
      <div className="divide-y">
        {Array.from({ length: 6 }).map((_, index) => (
          <div key={index} className="flex items-center gap-3 px-4 py-3.5">
            <Skeleton className="size-9 rounded-full" />
            <div className="flex flex-1 flex-col gap-2">
              <Skeleton className="h-4 w-36" />
              <Skeleton className="h-3 w-48" />
            </div>
            <Skeleton className="hidden h-5 w-24 md:block" />
            <Skeleton className="h-5 w-16" />
          </div>
        ))}
      </div>
    </div>
  )
}

export default function AlumniDirectoryPage() {
  const { token } = useAuth()
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()

  const search = searchParams.get("search") ?? ""
  const graduationYear = searchParams.get("graduation_year") ?? ""
  const city = searchParams.get("city") ?? ""
  const page = Math.max(1, Number(searchParams.get("page") || 1) || 1)

  const [searchInput, setSearchInput] = useState(search)
  const [yearInput, setYearInput] = useState(graduationYear)
  const [cityInput, setCityInput] = useState(city)

  const [items, setItems] = useState<AdminAlumniListItem[]>([])
  const [total, setTotal] = useState(0)
  const [pageSize, setPageSize] = useState(20)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  useEffect(() => {
    setSearchInput(search)
    setYearInput(graduationYear)
    setCityInput(city)
  }, [search, graduationYear, city])

  useEffect(() => {
    if (!token) return

    let cancelled = false

    void (async () => {
      setLoading(true)
      setError("")
      try {
        const result = await alumniService.list(token, {
          search,
          graduation_year: graduationYear,
          city,
          page,
          page_size: 20,
        })
        if (!cancelled) {
          setItems(result.items)
          setTotal(result.total)
          setPageSize(result.page_size)
        }
      } catch (err) {
        if (!cancelled) {
          setError(
            err instanceof ApiError
              ? err.message
              : "Failed to load alumni directory",
          )
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()

    return () => {
      cancelled = true
    }
  }, [token, search, graduationYear, city, page])

  function applyFilters(event: React.FormEvent) {
    event.preventDefault()
    const next = new URLSearchParams()
    if (searchInput.trim()) next.set("search", searchInput.trim())
    if (yearInput.trim()) next.set("graduation_year", yearInput.trim())
    if (cityInput.trim()) next.set("city", cityInput.trim())
    next.set("page", "1")
    setSearchParams(next)
  }

  function clearFilters() {
    setSearchInput("")
    setYearInput("")
    setCityInput("")
    setSearchParams({})
  }

  function goToPage(nextPage: number) {
    const next = new URLSearchParams(searchParams)
    next.set("page", String(nextPage))
    setSearchParams(next)
  }

  const totalPages = Math.max(1, Math.ceil(total / pageSize))

  return (
    <div className="flex flex-1 flex-col gap-5 py-4 md:gap-6 md:py-6">
      <div className="px-4 lg:px-6">
        <h1 className="text-2xl font-bold tracking-tight">Alumni directory</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Search and browse active alumni
          {!loading ? (
            <span>
              {" "}
              · {total} result{total === 1 ? "" : "s"}
            </span>
          ) : null}
        </p>
      </div>

      <form
        onSubmit={applyFilters}
        className="flex flex-col gap-3 px-4 lg:flex-row lg:items-end lg:px-6"
      >
        <div className="relative min-w-0 flex-1">
          <SearchIcon className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Search name, email, phone…"
            className="pl-8"
          />
        </div>
        <Input
          value={yearInput}
          onChange={(e) => setYearInput(e.target.value)}
          placeholder="Graduation year"
          className="lg:w-40"
        />
        <Input
          value={cityInput}
          onChange={(e) => setCityInput(e.target.value)}
          placeholder="City"
          className="lg:w-40"
        />
        <div className="flex gap-2">
          <Button type="submit">Search</Button>
          <Button type="button" variant="outline" onClick={clearFilters}>
            Clear
          </Button>
        </div>
      </form>

      <div className="px-4 lg:px-6">
        {error ? (
          <p className="mb-3 text-sm text-destructive">{error}</p>
        ) : null}

        {loading ? (
          <TableSkeleton />
        ) : (
          <div className="overflow-hidden rounded-xl border bg-card">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead className="h-11 bg-muted/40 px-4 text-xs uppercase tracking-wide text-muted-foreground">
                    Alumni
                  </TableHead>
                  <TableHead className="hidden h-11 bg-muted/40 px-4 text-xs uppercase tracking-wide text-muted-foreground md:table-cell">
                    Program
                  </TableHead>
                  <TableHead className="hidden h-11 bg-muted/40 px-4 text-xs uppercase tracking-wide text-muted-foreground lg:table-cell">
                    Location
                  </TableHead>
                  <TableHead className="hidden h-11 bg-muted/40 px-4 text-xs uppercase tracking-wide text-muted-foreground sm:table-cell">
                    Year
                  </TableHead>
                  <TableHead className="hidden h-11 bg-muted/40 px-4 text-xs uppercase tracking-wide text-muted-foreground xl:table-cell">
                    Role
                  </TableHead>
                  <TableHead className="h-11 w-12 bg-muted/40 px-4" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.map((item) => (
                  <TableRow
                    key={item.alumni_id}
                    className="group cursor-pointer"
                    onClick={() =>
                      navigate(`/alumni/${item.alumni_id}`, {
                        state: { alumni: item },
                      })
                    }
                  >
                    <TableCell className="px-4 py-3">
                      <div className="flex min-w-0 items-center gap-3">
                        <Avatar className="size-9">
                          {item.photo_url ? (
                            <AvatarImage
                              src={item.photo_url}
                              alt={item.full_name}
                            />
                          ) : null}
                          <AvatarFallback className="bg-muted text-xs font-medium">
                            {initialsFromName(item.full_name)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="min-w-0">
                          <div className="truncate font-medium">
                            {item.full_name}
                          </div>
                          <div className="truncate text-xs text-muted-foreground">
                            {item.email}
                          </div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="hidden max-w-[16rem] px-4 py-3 md:table-cell">
                      <span className="line-clamp-2 whitespace-normal text-sm text-muted-foreground">
                        {programLabel(item)}
                      </span>
                    </TableCell>
                    <TableCell className="hidden px-4 py-3 text-sm text-muted-foreground lg:table-cell">
                      {locationLabel(item)}
                    </TableCell>
                    <TableCell className="hidden px-4 py-3 tabular-nums text-muted-foreground sm:table-cell">
                      {item.graduation_year ?? "—"}
                    </TableCell>
                    <TableCell className="hidden px-4 py-3 text-sm text-muted-foreground xl:table-cell">
                      {item.professional?.job_title ||
                        item.professional?.role ||
                        "—"}
                    </TableCell>
                    <TableCell className="px-4 py-3 text-right">
                      <Button
                        size="icon-sm"
                        variant="ghost"
                        className="text-muted-foreground opacity-60 transition-opacity group-hover:opacity-100"
                        render={
                          <Link
                            to={`/alumni/${item.alumni_id}`}
                            state={{ alumni: item }}
                            onClick={(e) => e.stopPropagation()}
                          />
                        }
                      >
                        <ChevronRightIcon />
                        <span className="sr-only">View {item.full_name}</span>
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}

                {!items.length ? (
                  <TableRow className="hover:bg-transparent">
                    <TableCell
                      colSpan={6}
                      className="h-28 px-4 text-center text-muted-foreground"
                    >
                      No alumni found.
                    </TableCell>
                  </TableRow>
                ) : null}
              </TableBody>
            </Table>
          </div>
        )}

        {!loading && totalPages > 1 ? (
          <div className="mt-4 flex items-center justify-between gap-3">
            <p className="text-sm text-muted-foreground">
              Page {page} of {totalPages}
            </p>
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="outline"
                disabled={page <= 1}
                onClick={() => goToPage(page - 1)}
              >
                Previous
              </Button>
              <Button
                size="sm"
                variant="outline"
                disabled={page >= totalPages}
                className={cn(page >= totalPages && "opacity-50")}
                onClick={() => goToPage(page + 1)}
              >
                Next
              </Button>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  )
}
