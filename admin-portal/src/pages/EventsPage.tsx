import { useEffect, useState } from "react"
import { Link, useLocation, useNavigate, useSearchParams } from "react-router-dom"
import {
  CalendarDaysIcon,
  ChevronRightIcon,
  PencilIcon,
  PlusIcon,
  Trash2Icon,
} from "lucide-react"

import { useAuth } from "@/auth/AuthContext"
import { ConfirmDialog } from "@/components/admin/confirm-dialog"
import { TablePagination } from "@/components/admin/table-pagination"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
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
import { toast } from "sonner"
import { withNavTrail } from "@/lib/nav-trail"
import { cn } from "@/lib/utils"
import {
  eventService,
  type AdminEvent,
  type EventListScope,
} from "@/services/event.service"

const SCOPES: Array<{ label: string; value: EventListScope }> = [
  { label: "Upcoming", value: "upcoming" },
  { label: "Past", value: "past" },
  { label: "All", value: "all" },
]

function typeLabel(type: string) {
  return type
    .toLowerCase()
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ")
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(value))
}

function formatTime(value: string | null) {
  if (!value) return ""
  return value.slice(0, 5)
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
            <Skeleton className="size-10 rounded-lg" />
            <div className="flex flex-1 flex-col gap-2">
              <Skeleton className="h-4 w-48" />
              <Skeleton className="h-3 w-40" />
            </div>
            <Skeleton className="h-5 w-16" />
          </div>
        ))}
      </div>
    </div>
  )
}

export default function EventsPage() {
  const { token } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [searchParams, setSearchParams] = useSearchParams()
  const scopeParam = searchParams.get("scope")
  const scope: EventListScope =
    scopeParam === "past" || scopeParam === "all" ? scopeParam : "upcoming"
  const page = Math.max(1, Number(searchParams.get("page") || 1) || 1)

  const [items, setItems] = useState<AdminEvent[]>([])
  const [total, setTotal] = useState(0)
  const [pageSize, setPageSize] = useState(10)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [pendingDelete, setPendingDelete] = useState<AdminEvent | null>(null)
  const [deleting, setDeleting] = useState(false)

  async function load() {
    if (!token) return
    setLoading(true)
    setError("")
    try {
      const result = await eventService.list(token, {
        scope,
        page,
        page_size: 10,
      })
      setItems(result.items)
      setTotal(result.total)
      setPageSize(result.page_size)
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to load events")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, scope, page])

  async function handleDelete() {
    if (!token || !pendingDelete) return

    setDeleting(true)
    setError("")
    try {
      await eventService.remove(token, pendingDelete.id)
      setPendingDelete(null)
      toast.success("Event deleted")
      await load()
    } catch (err) {
      const message =
        err instanceof ApiError ? err.message : "Failed to delete event"
      setError(message)
      toast.error(message)
    } finally {
      setDeleting(false)
    }
  }

  function setScope(next: EventListScope) {
    const params = new URLSearchParams(searchParams)
    if (next === "upcoming") params.delete("scope")
    else params.set("scope", next)
    params.set("page", "1")
    setSearchParams(params)
  }

  function goToPage(nextPage: number) {
    const params = new URLSearchParams(searchParams)
    params.set("page", String(nextPage))
    setSearchParams(params)
  }

  return (
    <div className="flex flex-1 flex-col gap-5 py-4 md:gap-6 md:py-6">
      <div className="flex flex-col gap-4 px-4 sm:flex-row sm:items-center sm:justify-between lg:px-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Events</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Create and manage alumni events
          </p>
        </div>
        <Button render={<Link to="/events/new" state={withNavTrail(location)} />}>
          <PlusIcon />
          New event
        </Button>
      </div>

      <div className="px-4 lg:px-6">
        <div className="inline-flex rounded-lg border bg-muted/40 p-1">
          {SCOPES.map((item) => (
            <button
              key={item.value}
              type="button"
              onClick={() => setScope(item.value)}
              className={cn(
                "rounded-md px-3 py-1.5 text-sm transition-colors",
                scope === item.value
                  ? "bg-background font-medium text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>

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
                    Event
                  </TableHead>
                  <TableHead className="hidden h-11 bg-muted/40 px-4 text-xs uppercase tracking-wide text-muted-foreground md:table-cell">
                    Type
                  </TableHead>
                  <TableHead className="hidden h-11 bg-muted/40 px-4 text-xs uppercase tracking-wide text-muted-foreground sm:table-cell">
                    Date
                  </TableHead>
                  <TableHead className="hidden h-11 bg-muted/40 px-4 text-xs uppercase tracking-wide text-muted-foreground lg:table-cell">
                    RSVP
                  </TableHead>
                  <TableHead className="h-11 bg-muted/40 px-4 text-xs uppercase tracking-wide text-muted-foreground">
                    Status
                  </TableHead>
                  <TableHead className="h-11 w-28 bg-muted/40 px-4 text-right text-xs uppercase tracking-wide text-muted-foreground">
                    Actions
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.map((item) => (
                  <TableRow
                    key={item.id}
                    className="group cursor-pointer"
                    onClick={() =>
                      navigate(`/events/${item.id}`, {
                        state: withNavTrail(location),
                      })
                    }
                  >
                    <TableCell className="px-4 py-3">
                      <div className="flex min-w-0 items-center gap-3">
                        {item.image_url ? (
                          <img
                            src={item.image_url}
                            alt=""
                            className="size-10 rounded-lg border object-cover"
                          />
                        ) : (
                          <div className="flex size-10 items-center justify-center rounded-lg border bg-muted/50 text-muted-foreground">
                            <CalendarDaysIcon className="size-4" />
                          </div>
                        )}
                        <div className="min-w-0">
                          <div className="truncate font-medium">{item.title}</div>
                          <div className="truncate text-xs text-muted-foreground">
                            {item.venue}
                          </div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="hidden px-4 py-3 md:table-cell">
                      <Badge variant="outline">{typeLabel(item.event_type)}</Badge>
                    </TableCell>
                    <TableCell className="hidden px-4 py-3 text-sm text-muted-foreground sm:table-cell">
                      {formatDate(item.event_date)}
                      <span className="mx-1.5 text-border">·</span>
                      {formatTime(item.start_time)}
                      {item.end_time ? `–${formatTime(item.end_time)}` : ""}
                    </TableCell>
                    <TableCell className="hidden px-4 py-3 lg:table-cell">
                      {item.rsvp_counts ? (
                        <span className="tabular-nums text-sm font-medium">
                          {item.rsvp_counts.total}
                        </span>
                      ) : (
                        <span className="text-sm text-muted-foreground">—</span>
                      )}
                    </TableCell>
                    <TableCell className="px-4 py-3">
                      <Badge
                        className={cn(
                          "font-normal",
                          item.is_draft
                            ? "border-transparent bg-amber-500/10 text-amber-700 dark:text-amber-400"
                            : "border-transparent bg-emerald-500/10 text-emerald-700 dark:text-emerald-400",
                        )}
                      >
                        {item.is_draft ? "Draft" : "Published"}
                      </Badge>
                    </TableCell>
                    <TableCell className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          size="icon-sm"
                          variant="ghost"
                          render={
                            <Link
                              to={`/events/${item.id}/edit`}
                              state={withNavTrail(location)}
                              onClick={(e) => e.stopPropagation()}
                            />
                          }
                        >
                          <PencilIcon />
                          <span className="sr-only">Edit</span>
                        </Button>
                        <Button
                          size="icon-sm"
                          variant="ghost"
                          className="text-destructive hover:text-destructive"
                          disabled={deleting && pendingDelete?.id === item.id}
                          onClick={(e) => {
                            e.stopPropagation()
                            setPendingDelete(item)
                          }}
                        >
                          <Trash2Icon />
                          <span className="sr-only">Delete</span>
                        </Button>
                        <Button
                          size="icon-sm"
                          variant="ghost"
                          className="text-muted-foreground opacity-60 group-hover:opacity-100"
                          render={
                            <Link
                              to={`/events/${item.id}`}
                              state={withNavTrail(location)}
                            />
                          }
                          onClick={(e) => e.stopPropagation()}
                        >
                          <ChevronRightIcon />
                          <span className="sr-only">View</span>
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}

                {!items.length ? (
                  <TableRow className="hover:bg-transparent">
                    <TableCell
                      colSpan={6}
                      className="h-28 px-4 text-center text-muted-foreground"
                    >
                      No events found.
                    </TableCell>
                  </TableRow>
                ) : null}
              </TableBody>
            </Table>
          </div>
        )}

        {!loading ? (
          <TablePagination
            page={page}
            total={total}
            pageSize={pageSize}
            onPageChange={goToPage}
          />
        ) : null}
      </div>

      <ConfirmDialog
        open={Boolean(pendingDelete)}
        title="Delete event"
        description={`Delete “${pendingDelete?.title ?? "this event"}”? This cannot be undone.`}
        confirmLabel="Delete"
        variant="destructive"
        busy={deleting}
        onOpenChange={(open) => {
          if (!open && !deleting) setPendingDelete(null)
        }}
        onConfirm={handleDelete}
      />
    </div>
  )
}
