import { useEffect, useState } from "react"
import { Link, useLocation, useNavigate, useSearchParams } from "react-router-dom"
import {
  ChevronRightIcon,
  MegaphoneIcon,
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
  announcementService,
  type Announcement,
} from "@/services/announcement.service"

type AnnouncementStatusTab = "published" | "draft" | "all"

const STATUS_FILTERS: Array<{ label: string; value: AnnouncementStatusTab }> = [
  { label: "Published", value: "published" },
  { label: "Draft", value: "draft" },
  { label: "All", value: "all" },
]

function categoryLabel(category: string) {
  return category
    .toLowerCase()
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ")
}

function formatDate(value: string | null) {
  if (!value) return "—"
  return new Intl.DateTimeFormat(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(value))
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
              <Skeleton className="h-3 w-64" />
            </div>
            <Skeleton className="h-5 w-16" />
          </div>
        ))}
      </div>
    </div>
  )
}

export default function AnnouncementsPage() {
  const { token } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [searchParams, setSearchParams] = useSearchParams()
  const statusParam = searchParams.get("status")
  const statusFilter: AnnouncementStatusTab =
    statusParam === "draft" || statusParam === "all" ? statusParam : "published"
  const page = Math.max(1, Number(searchParams.get("page") || 1) || 1)

  const [items, setItems] = useState<Announcement[]>([])
  const [total, setTotal] = useState(0)
  const [pageSize, setPageSize] = useState(10)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [pendingDelete, setPendingDelete] = useState<Announcement | null>(null)
  const [deleting, setDeleting] = useState(false)

  async function load() {
    if (!token) return
    setLoading(true)
    setError("")
    try {
      if (statusFilter === "draft") {
        const pageSize = 10
        const collected: Announcement[] = []
        let fetchedPage = 1
        let remoteTotal = Number.POSITIVE_INFINITY

        while (collected.length < remoteTotal && fetchedPage <= 20) {
          const result = await announcementService.list(token, {
            page: fetchedPage,
            page_size: 100,
            include_drafts: true,
          })
          collected.push(...result.items)
          remoteTotal = result.total
          if (result.items.length === 0) break
          fetchedPage += 1
        }

        const drafts = collected.filter((item) => !item.is_published)
        setItems(drafts.slice((page - 1) * pageSize, page * pageSize))
        setTotal(drafts.length)
        setPageSize(pageSize)
      } else {
        const result = await announcementService.list(token, {
          page,
          page_size: 10,
          include_drafts: statusFilter === "all",
        })
        setItems(result.items)
        setTotal(result.total)
        setPageSize(result.page_size)
      }
    } catch (err) {
      setError(
        err instanceof ApiError
          ? err.message
          : "Failed to load announcements",
      )
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, page, statusFilter])

  async function handleDelete() {
    if (!token || !pendingDelete) return

    setDeleting(true)
    setError("")
    try {
      await announcementService.remove(token, pendingDelete.id)
      setPendingDelete(null)
      toast.success("Announcement deleted")
      await load()
    } catch (err) {
      const message =
        err instanceof ApiError ? err.message : "Failed to delete announcement"
      setError(message)
      toast.error(message)
    } finally {
      setDeleting(false)
    }
  }

  function setStatus(next: AnnouncementStatusTab) {
    const params = new URLSearchParams()
    if (next !== "published") params.set("status", next)
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
          <h1 className="text-2xl font-bold tracking-tight">Announcements</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Create and manage alumni announcements
          </p>
        </div>
        <Button render={<Link to="/announcements/new" state={withNavTrail(location)} />}>
          <PlusIcon />
          New announcement
        </Button>
      </div>

      <div className="px-4 lg:px-6">
        <div className="inline-flex rounded-lg border bg-muted/40 p-1">
          {STATUS_FILTERS.map((filter) => (
            <button
              key={filter.value}
              type="button"
              onClick={() => setStatus(filter.value)}
              className={cn(
                "rounded-md px-3 py-1.5 text-sm transition-colors",
                statusFilter === filter.value
                  ? "bg-background font-medium text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              {filter.label}
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
                    Announcement
                  </TableHead>
                  <TableHead className="hidden h-11 bg-muted/40 px-4 text-xs uppercase tracking-wide text-muted-foreground md:table-cell">
                    Category
                  </TableHead>
                  <TableHead className="h-11 bg-muted/40 px-4 text-xs uppercase tracking-wide text-muted-foreground">
                    Status
                  </TableHead>
                  <TableHead className="hidden h-11 bg-muted/40 px-4 text-xs uppercase tracking-wide text-muted-foreground sm:table-cell">
                    Published
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
                      navigate(`/announcements/${item.id}`, {
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
                            <MegaphoneIcon className="size-4" />
                          </div>
                        )}
                        <div className="min-w-0">
                          <div className="truncate font-medium">{item.title}</div>
                          <div className="line-clamp-1 text-xs text-muted-foreground">
                            {item.content}
                          </div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="hidden px-4 py-3 md:table-cell">
                      <Badge variant="outline">
                        {categoryLabel(item.category)}
                      </Badge>
                    </TableCell>
                    <TableCell className="px-4 py-3">
                      <Badge
                        variant={item.is_published ? "default" : "secondary"}
                        className={cn(
                          "font-normal",
                          item.is_published
                            ? "border-transparent bg-emerald-500/10 text-emerald-700 dark:text-emerald-400"
                            : "border-transparent bg-amber-500/10 text-amber-700 dark:text-amber-400",
                        )}
                      >
                        {item.is_published ? "Published" : "Draft"}
                      </Badge>
                    </TableCell>
                    <TableCell className="hidden px-4 py-3 text-sm text-muted-foreground sm:table-cell">
                      {formatDate(item.published_at)}
                    </TableCell>
                    <TableCell className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          size="icon-sm"
                          variant="ghost"
                          render={
                            <Link
                              to={`/announcements/${item.id}/edit`}
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
                              to={`/announcements/${item.id}`}
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
                      colSpan={5}
                      className="h-28 px-4 text-center text-muted-foreground"
                    >
                      No announcements found.
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
        title="Delete announcement"
        description={`Delete “${pendingDelete?.title ?? "this announcement"}”? This cannot be undone.`}
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
