import { useEffect, useState } from "react"
import { Link, useLocation, useNavigate, useSearchParams } from "react-router-dom"
import { CheckIcon, ChevronRightIcon, MailIcon, XIcon } from "lucide-react"

import { useAuth } from "@/auth/AuthContext"
import { ConfirmDialog } from "@/components/admin/confirm-dialog"
import { TablePagination } from "@/components/admin/table-pagination"
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
import { withNavTrail } from "@/lib/nav-trail"
import { toast } from "sonner"
import { cn } from "@/lib/utils"
import {
  contactRequestService,
  type ContactRequest,
  type ContactRequestStatus,
} from "@/services/contact-request.service"

const STATUS_FILTERS: Array<{
  label: string
  value: ContactRequestStatus | ""
}> = [
  { label: "Pending", value: "PENDING_ADMIN" },
  { label: "Approved", value: "APPROVED" },
  { label: "All", value: "" },
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
  const location = useLocation()
  const [searchParams, setSearchParams] = useSearchParams()
  const statusParam = searchParams.get("status")
  const statusFilter =
    statusParam === "all"
      ? ""
      : statusParam === "PENDING_ADMIN" || statusParam === "APPROVED"
        ? statusParam
        : "PENDING_ADMIN"
  const page = Math.max(1, Number(searchParams.get("page") || 1) || 1)
  const pageSize = 10

  const [items, setItems] = useState<ContactRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [busyId, setBusyId] = useState<string | null>(null)
  const [pendingApprove, setPendingApprove] = useState<ContactRequest | null>(
    null,
  )
  const [pendingReject, setPendingReject] = useState<ContactRequest | null>(
    null,
  )
  const [rejectionReason, setRejectionReason] = useState("")
  const [rejectError, setRejectError] = useState("")

  async function load() {
    if (!token) return
    setLoading(true)
    setError("")
    try {
      const requests = await contactRequestService.list(token, statusFilter)
      setItems(requests)
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
    const params = new URLSearchParams()
    if (!next) params.set("status", "all")
    else params.set("status", next)
    params.set("page", "1")
    setSearchParams(params)
  }

  function goToPage(nextPage: number) {
    const params = new URLSearchParams(searchParams)
    params.set("page", String(nextPage))
    setSearchParams(params)
  }

  function partyName(
    item: ContactRequest,
    party: "requester" | "target",
  ) {
    const name =
      party === "requester"
        ? item.requester_alumni_name
        : item.target_alumni_name
    const id =
      party === "requester" ? item.requester_alumni_id : item.target_alumni_id
    return name?.trim() || id.slice(0, 8)
  }

  const pagedItems = items.slice((page - 1) * pageSize, page * pageSize)

  async function handleApprove() {
    if (!token || !pendingApprove) return

    setBusyId(pendingApprove.id)
    setError("")
    try {
      await contactRequestService.review(token, pendingApprove.id, "APPROVE")
      setPendingApprove(null)
      toast.success("Contact request approved")
      await load()
    } catch (err) {
      const message =
        err instanceof ApiError ? err.message : "Approve failed"
      setError(message)
      toast.error(message)
    } finally {
      setBusyId(null)
    }
  }

  async function handleReject() {
    if (!token || !pendingReject) return
    if (!rejectionReason.trim()) {
      setRejectError("Rejection reason is required")
      return
    }

    setBusyId(pendingReject.id)
    setError("")
    setRejectError("")
    try {
      await contactRequestService.review(
        token,
        pendingReject.id,
        "REJECT",
        rejectionReason.trim(),
      )
      setPendingReject(null)
      setRejectionReason("")
      toast.success("Contact request rejected")
      await load()
    } catch (err) {
      const message =
        err instanceof ApiError ? err.message : "Reject failed"
      setError(message)
      toast.error(message)
    } finally {
      setBusyId(null)
    }
  }

  return (
    <div className="flex flex-1 flex-col gap-5 py-4 md:gap-6 md:py-6">
      <div className="px-4 lg:px-6">
        <h1 className="text-2xl font-bold tracking-tight">Contact requests</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Review alumni contact requests
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
                {pagedItems.map((item) => {
                  const isPending = item.status === "PENDING_ADMIN"
                  const isBusy = busyId === item.id

                  return (
                    <TableRow key={item.id} className="group">
                        <TableCell className="px-4 py-3">
                          <div className="flex min-w-0 items-center gap-3">
                            <div className="flex size-9 shrink-0 items-center justify-center rounded-lg border bg-muted/50 text-muted-foreground">
                              <MailIcon className="size-4" />
                            </div>
                            <div className="min-w-0">
                              <button
                                type="button"
                                className="line-clamp-1 text-left font-medium hover:underline"
                                onClick={() =>
                                  navigate(`/contact-requests/${item.id}`, {
                                    state: withNavTrail(location, { request: item }),
                                  })
                                }
                              >
                                {item.request_reason}
                              </button>
                              <div className="mt-0.5 text-xs text-muted-foreground md:hidden">
                                {partyName(item, "requester")} →{" "}
                                {partyName(item, "target")}
                              </div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="hidden px-4 py-3 md:table-cell">
                          <div className="text-sm">
                            <Link
                              to={`/alumni/${item.requester_alumni_id}`}
                              state={withNavTrail(location)}
                              className="font-medium hover:underline"
                            >
                              {partyName(item, "requester")}
                            </Link>
                            <span className="mx-1.5 text-muted-foreground">
                              →
                            </span>
                            <Link
                              to={`/alumni/${item.target_alumni_id}`}
                              state={withNavTrail(location)}
                              className="font-medium hover:underline"
                            >
                              {partyName(item, "target")}
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
                                  onClick={() => setPendingApprove(item)}
                                >
                                  <CheckIcon />
                                  Approve
                                </Button>
                                <Button
                                  size="sm"
                                  variant="destructive"
                                  disabled={isBusy}
                                  onClick={() => {
                                    setPendingReject(item)
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
                                <Link
                                  to={`/contact-requests/${item.id}`}
                                  state={withNavTrail(location, { request: item })}
                                />
                              }
                            >
                              <ChevronRightIcon />
                              <span className="sr-only">Open</span>
                            </Button>
                      </div>
                    </TableCell>
                  </TableRow>
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

        {!loading ? (
          <TablePagination
            page={page}
            total={items.length}
            pageSize={pageSize}
            onPageChange={goToPage}
          />
        ) : null}
      </div>

      <ConfirmDialog
        open={Boolean(pendingApprove)}
        title="Approve contact request"
        description={`Approve the request from ${pendingApprove ? partyName(pendingApprove, "requester") : "this alumni"} to ${pendingApprove ? partyName(pendingApprove, "target") : "the target alumni"}?`}
        confirmLabel="Approve"
        busy={Boolean(busyId && pendingApprove)}
        onOpenChange={(open) => {
          if (!open && !busyId) setPendingApprove(null)
        }}
        onConfirm={handleApprove}
      />
      <ConfirmDialog
        open={Boolean(pendingReject)}
        title="Reject contact request"
        description={`Reject the request from ${pendingReject ? partyName(pendingReject, "requester") : "this alumni"}? A reason is required.`}
        confirmLabel="Reject"
        variant="destructive"
        busy={Boolean(busyId && pendingReject)}
        onOpenChange={(open) => {
          if (!open && !busyId) {
            setPendingReject(null)
            setRejectionReason("")
            setRejectError("")
          }
        }}
        onConfirm={handleReject}
      >
        <Field>
          <FieldLabel htmlFor="reject-reason">Rejection reason</FieldLabel>
          <Textarea
            id="reject-reason"
            value={rejectionReason}
            onChange={(e) => {
              setRejectionReason(e.target.value)
              setRejectError("")
            }}
            placeholder="Explain why this request is rejected"
            rows={3}
            disabled={Boolean(busyId)}
          />
          {rejectError ? <FieldError>{rejectError}</FieldError> : null}
        </Field>
      </ConfirmDialog>
    </div>
  )
}
