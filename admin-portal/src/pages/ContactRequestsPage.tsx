import { Fragment, useEffect, useMemo, useState } from "react"
import { Link, useNavigate, useSearchParams } from "react-router-dom"
import { CheckIcon, ChevronRightIcon, MailIcon, XIcon } from "lucide-react"

import { useAuth } from "@/auth/AuthContext"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Field, FieldError, FieldLabel } from "@/components/ui/field"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Textarea } from "@/components/ui/textarea"
import { ApiError } from "@/lib/api"
import { cn } from "@/lib/utils"
import {
  alumniService,
  type AdminAlumniListItem,
} from "@/services/alumni.service"
import {
  contactRequestService,
  type ContactRequest,
  type ContactRequestStatus,
} from "@/services/contact-request.service"

const STATUS_FILTERS: Array<{
  label: string
  value: ContactRequestStatus | ""
}> = [
  { label: "All", value: "" },
  { label: "Pending admin", value: "PENDING_ADMIN" },
  { label: "Pending alumni", value: "PENDING_ALUMNI" },
  { label: "Approved", value: "APPROVED" },
  { label: "Rejected by admin", value: "REJECTED_BY_ADMIN" },
  { label: "Rejected by alumni", value: "REJECTED_BY_ALUMNI" },
]

function statusLabel(status: string) {
  return status
    .toLowerCase()
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ")
}

function statusClass(status: ContactRequestStatus) {
  switch (status) {
    case "APPROVED":
      return "border-transparent bg-emerald-500/10 text-emerald-700 dark:text-emerald-400"
    case "PENDING_ADMIN":
    case "PENDING_ALUMNI":
      return "border-transparent bg-amber-500/10 text-amber-700 dark:text-amber-400"
    case "REJECTED_BY_ADMIN":
    case "REJECTED_BY_ALUMNI":
      return "border-transparent bg-destructive/10 text-destructive"
    default:
      return ""
  }
}

function formatDate(value: string) {
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
            <div className="flex flex-1 flex-col gap-2">
              <Skeleton className="h-4 w-48" />
              <Skeleton className="h-3 w-64" />
            </div>
            <Skeleton className="h-5 w-24" />
          </div>
        ))}
      </div>
    </div>
  )
}

export default function ContactRequestsPage() {
  const { token } = useAuth()
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const statusParam = searchParams.get("status")
  const statusFilter =
    statusParam === "all"
      ? ""
      : statusParam === "PENDING_ADMIN" ||
          statusParam === "PENDING_ALUMNI" ||
          statusParam === "APPROVED" ||
          statusParam === "REJECTED_BY_ADMIN" ||
          statusParam === "REJECTED_BY_ALUMNI"
        ? statusParam
        : ""

  const [items, setItems] = useState<ContactRequest[]>([])
  const [alumniById, setAlumniById] = useState<
    Record<string, AdminAlumniListItem>
  >({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [busyId, setBusyId] = useState<string | null>(null)
  const [rejectingId, setRejectingId] = useState<string | null>(null)
  const [rejectionReason, setRejectionReason] = useState("")
  const [rejectError, setRejectError] = useState("")

  async function load() {
    if (!token) return
    setLoading(true)
    setError("")
    try {
      const [requests, alumni] = await Promise.all([
        contactRequestService.list(token, statusFilter),
        alumniService
          .list(token, { page: 1, page_size: 100 })
          .catch(() => ({ items: [] as AdminAlumniListItem[] })),
      ])
      setItems(requests)
      const map: Record<string, AdminAlumniListItem> = {}
      for (const item of alumni.items) map[item.alumni_id] = item
      setAlumniById(map)
    } catch (err) {
      setError(
        err instanceof ApiError
          ? err.message
          : "Failed to load contact requests",
      )
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, statusFilter])

  function setStatus(next: ContactRequestStatus | "") {
    if (!next) {
      setSearchParams({ status: "all" })
      return
    }
    setSearchParams({ status: next })
  }

  function alumniName(id: string) {
    return alumniById[id]?.full_name ?? id.slice(0, 8)
  }

  async function handleApprove(item: ContactRequest) {
    if (!token) return
    const confirmed = window.confirm(
      `Approve this contact request from ${alumniName(item.requester_alumni_id)} to ${alumniName(item.target_alumni_id)}?`,
    )
    if (!confirmed) return

    setBusyId(item.id)
    setError("")
    try {
      await contactRequestService.review(token, item.id, "APPROVE")
      setRejectingId(null)
      setRejectionReason("")
      await load()
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Approve failed")
    } finally {
      setBusyId(null)
    }
  }

  async function handleReject(item: ContactRequest) {
    if (!token) return
    if (!rejectionReason.trim()) {
      setRejectError("Rejection reason is required")
      return
    }

    setBusyId(item.id)
    setError("")
    setRejectError("")
    try {
      await contactRequestService.review(
        token,
        item.id,
        "REJECT",
        rejectionReason.trim(),
      )
      setRejectingId(null)
      setRejectionReason("")
      await load()
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Reject failed")
    } finally {
      setBusyId(null)
    }
  }

  const pendingCount = useMemo(
    () => items.filter((item) => item.status === "PENDING_ADMIN").length,
    [items],
  )

  return (
    <div className="flex flex-1 flex-col gap-5 py-4 md:gap-6 md:py-6">
      <div className="px-4 lg:px-6">
        <h1 className="text-2xl font-bold tracking-tight">Contact requests</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Review alumni contact requests
          {!loading ? (
            <span>
              {" "}
              · {items.length} result{items.length === 1 ? "" : "s"}
              {statusFilter === "" && pendingCount > 0
                ? ` · ${pendingCount} pending admin`
                : ""}
            </span>
          ) : null}
        </p>
      </div>

      <div className="px-4 lg:px-6">
        <div className="inline-flex max-w-full flex-wrap rounded-lg border bg-muted/40 p-1">
          {STATUS_FILTERS.map((filter) => (
            <button
              key={filter.label}
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
                    Request
                  </TableHead>
                  <TableHead className="hidden h-11 bg-muted/40 px-4 text-xs uppercase tracking-wide text-muted-foreground md:table-cell">
                    From → To
                  </TableHead>
                  <TableHead className="h-11 bg-muted/40 px-4 text-xs uppercase tracking-wide text-muted-foreground">
                    Status
                  </TableHead>
                  <TableHead className="hidden h-11 bg-muted/40 px-4 text-xs uppercase tracking-wide text-muted-foreground sm:table-cell">
                    Submitted
                  </TableHead>
                  <TableHead className="h-11 bg-muted/40 px-4 text-right text-xs uppercase tracking-wide text-muted-foreground">
                    Actions
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.map((item) => {
                  const isPending =
                    item.status === "PENDING_ADMIN" ||
                    item.status === "PENDING_ALUMNI"
                  const isRejecting = rejectingId === item.id
                  const isBusy = busyId === item.id

                  return (
                    <Fragment key={item.id}>
                      <TableRow className="group">
                        <TableCell className="px-4 py-3">
                          <div className="flex min-w-0 items-start gap-3">
                            <div className="mt-0.5 flex size-9 items-center justify-center rounded-lg border bg-muted/50 text-muted-foreground">
                              <MailIcon className="size-4" />
                            </div>
                            <div className="min-w-0">
                              <button
                                type="button"
                                className="line-clamp-1 text-left font-medium hover:underline"
                                onClick={() =>
                                  navigate(`/contact-requests/${item.id}`)
                                }
                              >
                                {item.request_reason}
                              </button>
                              <div className="mt-0.5 text-xs text-muted-foreground md:hidden">
                                {alumniName(item.requester_alumni_id)} →{" "}
                                {alumniName(item.target_alumni_id)}
                              </div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="hidden px-4 py-3 md:table-cell">
                          <div className="text-sm">
                            <Link
                              to={`/alumni/${item.requester_alumni_id}`}
                              className="font-medium hover:underline"
                            >
                              {alumniName(item.requester_alumni_id)}
                            </Link>
                            <span className="mx-1.5 text-muted-foreground">
                              →
                            </span>
                            <Link
                              to={`/alumni/${item.target_alumni_id}`}
                              className="font-medium hover:underline"
                            >
                              {alumniName(item.target_alumni_id)}
                            </Link>
                          </div>
                        </TableCell>
                        <TableCell className="px-4 py-3">
                          <Badge
                            className={cn(
                              "font-normal",
                              statusClass(item.status),
                            )}
                          >
                            {statusLabel(item.status)}
                          </Badge>
                        </TableCell>
                        <TableCell className="hidden px-4 py-3 text-sm text-muted-foreground sm:table-cell">
                          {formatDate(item.created_at)}
                        </TableCell>
                        <TableCell className="px-4 py-3 text-right">
                          <div className="flex items-center justify-end gap-1">
                            {isPending ? (
                              <>
                                <Button
                                  size="sm"
                                  disabled={isBusy}
                                  onClick={() => void handleApprove(item)}
                                >
                                  <CheckIcon />
                                  Approve
                                </Button>
                                <Button
                                  size="sm"
                                  variant="destructive"
                                  disabled={isBusy}
                                  onClick={() => {
                                    setRejectingId(item.id)
                                    setRejectionReason("")
                                    setRejectError("")
                                  }}
                                >
                                  <XIcon />
                                  Reject
                                </Button>
                              </>
                            ) : null}
                            <Button
                              size="icon-sm"
                              variant="ghost"
                              className="text-muted-foreground"
                              render={
                                <Link to={`/contact-requests/${item.id}`} />
                              }
                            >
                              <ChevronRightIcon />
                              <span className="sr-only">Open</span>
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>

                      {isRejecting ? (
                        <TableRow className="hover:bg-transparent">
                          <TableCell colSpan={5} className="bg-muted/20 px-4 py-4">
                            <div className="mx-auto flex max-w-2xl flex-col gap-3">
                              <Field>
                                <FieldLabel htmlFor={`reject-${item.id}`}>
                                  Rejection reason
                                </FieldLabel>
                                <Textarea
                                  id={`reject-${item.id}`}
                                  value={rejectionReason}
                                  onChange={(e) => {
                                    setRejectionReason(e.target.value)
                                    setRejectError("")
                                  }}
                                  placeholder="Explain why this request is rejected"
                                  rows={3}
                                  disabled={isBusy}
                                />
                                {rejectError ? (
                                  <FieldError>{rejectError}</FieldError>
                                ) : null}
                              </Field>
                              <div className="flex gap-2">
                                <Button
                                  variant="destructive"
                                  disabled={isBusy}
                                  onClick={() => void handleReject(item)}
                                >
                                  {isBusy ? "Rejecting…" : "Confirm reject"}
                                </Button>
                                <Button
                                  variant="outline"
                                  disabled={isBusy}
                                  onClick={() => {
                                    setRejectingId(null)
                                    setRejectionReason("")
                                    setRejectError("")
                                  }}
                                >
                                  Cancel
                                </Button>
                              </div>
                            </div>
                          </TableCell>
                        </TableRow>
                      ) : null}
                    </Fragment>
                  )
                })}

                {!items.length ? (
                  <TableRow className="hover:bg-transparent">
                    <TableCell
                      colSpan={5}
                      className="h-28 px-4 text-center text-muted-foreground"
                    >
                      No contact requests found.
                    </TableCell>
                  </TableRow>
                ) : null}
              </TableBody>
            </Table>
          </div>
        )}
      </div>
    </div>
  )
}
