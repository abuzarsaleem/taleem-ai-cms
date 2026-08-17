import { useEffect, useState } from "react"
import { Link, useLocation, useNavigate, useParams } from "react-router-dom"
import { ArrowLeftIcon } from "lucide-react"

import { useAuth } from "@/auth/AuthContext"
import { ConfirmDialog } from "@/components/admin/confirm-dialog"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Field, FieldError, FieldLabel } from "@/components/ui/field"
import { Skeleton } from "@/components/ui/skeleton"
import { Textarea } from "@/components/ui/textarea"
import { ApiError } from "@/lib/api"
import { withNavTrail } from "@/lib/nav-trail"
import { toast } from "sonner"
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

type LocationState = {
  request?: ContactRequest
}

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

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(value))
}

function DetailRow({
  label,
  value,
}: {
  label: string
  value: React.ReactNode
}) {
  return (
    <div className="grid gap-1 border-b py-3 last:border-b-0 sm:grid-cols-[10rem_1fr] sm:gap-4">
      <dt className="text-sm text-muted-foreground">{label}</dt>
      <dd className="text-sm font-medium break-words">{value || "—"}</dd>
    </div>
  )
}

function AlumniLink({
  alumni,
  alumniId,
}: {
  alumni?: AdminAlumniListItem
  alumniId: string
}) {
  const location = useLocation()
  return (
    <Link
      to={`/alumni/${alumniId}`}
      state={withNavTrail(location.pathname, { alumni })}
      className="text-primary underline-offset-4 hover:underline"
    >
      {alumni?.full_name ?? alumniId}
      {alumni?.email ? (
        <span className="ml-2 text-xs font-normal text-muted-foreground">
          {alumni.email}
        </span>
      ) : null}
    </Link>
  )
}

export default function ContactRequestDetailPage() {
  const { id } = useParams()
  const { token } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const stateRequest =
    (location.state as LocationState | null)?.request ?? null

  const [item, setItem] = useState<ContactRequest | null>(
    stateRequest && stateRequest.id === id ? stateRequest : null,
  )
  const [requester, setRequester] = useState<AdminAlumniListItem | null>(null)
  const [target, setTarget] = useState<AdminAlumniListItem | null>(null)
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState("")
  const [message, setMessage] = useState("")
  const [rejectionReason, setRejectionReason] = useState("")
  const [fieldError, setFieldError] = useState("")
  const [confirmAction, setConfirmAction] = useState<"APPROVE" | "REJECT" | null>(
    null,
  )

  useEffect(() => {
    if (!token || !id) return

    let cancelled = false

    void (async () => {
      setLoading(true)
      setError("")
      try {
        const list = await contactRequestService.list(token)
        const found = list.find((request) => request.id === id) ?? null
        if (cancelled) return
        setItem(found)

        if (found) {
          const alumni = await alumniService
            .list(token, { page: 1, page_size: 100 })
            .catch(() => ({ items: [] as AdminAlumniListItem[] }))
          if (cancelled) return
          setRequester(
            alumni.items.find(
              (row) => row.alumni_id === found.requester_alumni_id,
            ) ?? null,
          )
          setTarget(
            alumni.items.find(
              (row) => row.alumni_id === found.target_alumni_id,
            ) ?? null,
          )
        }
      } catch (err) {
        if (!cancelled) {
          setError(
            err instanceof ApiError
              ? err.message
              : "Failed to load contact request",
          )
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()

    return () => {
      cancelled = true
    }
  }, [token, id])

  function requestReview(action: "APPROVE" | "REJECT") {
    if (action === "REJECT" && !rejectionReason.trim()) {
      setFieldError("Rejection reason is required")
      return
    }
    setFieldError("")
    setConfirmAction(action)
  }

  async function handleReview() {
    if (!token || !item || !confirmAction) return
    const action = confirmAction

    setBusy(true)
    setError("")
    setMessage("")
    setFieldError("")

    try {
      const updated = await contactRequestService.review(
        token,
        item.id,
        action,
        action === "REJECT" ? rejectionReason.trim() : undefined,
      )
      setItem(updated)
      setConfirmAction(null)
      const successMessage =
        action === "APPROVE"
          ? "Contact request approved."
          : "Contact request rejected."
      setMessage(successMessage)
      toast.success(successMessage)
    } catch (err) {
      const failMessage =
        err instanceof ApiError
          ? err.message
          : action === "APPROVE"
            ? "Approve failed"
            : "Reject failed"
      setError(failMessage)
      toast.error(failMessage)
    } finally {
      setBusy(false)
    }
  }

  if (loading) {
    return (
      <div className="flex flex-1 flex-col gap-4 px-4 py-6 lg:px-6">
        <Skeleton className="h-8 w-32" />
        <Skeleton className="h-8 w-64" />
        <Skeleton className="mt-4 h-72 w-full" />
      </div>
    )
  }

  if (!item) {
    return (
      <div className="flex flex-1 flex-col gap-4 px-4 py-6 lg:px-6">
        <Button
          variant="outline"
          size="sm"
          className="w-fit"
          render={<Link to="/contact-requests" />}
        >
          <ArrowLeftIcon />
          Back
        </Button>
        <p className="text-sm text-destructive">
          {error || "Contact request not found"}
        </p>
      </div>
    )
  }

  const canReview =
    item.status === "PENDING_ADMIN" || item.status === "PENDING_ALUMNI"

  return (
    <div className="flex flex-1 flex-col gap-4 py-4 md:gap-6 md:py-6">
      <div className="flex flex-col gap-3 px-4 lg:px-6">
        <Button
          variant="outline"
          size="sm"
          className="w-fit"
          onClick={() => navigate("/contact-requests")}
        >
          <ArrowLeftIcon />
          Back
        </Button>
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight">
              Contact request
            </h1>
            <Badge className={cn("font-normal", statusClass(item.status))}>
              {statusLabel(item.status)}
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground">
            Submitted {formatDateTime(item.created_at)}
          </p>
        </div>
      </div>

      <div className="grid gap-4 px-4 lg:grid-cols-3 lg:px-6">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Request details</CardTitle>
            <CardDescription>
              Alumni contact request details
            </CardDescription>
          </CardHeader>
          <CardContent>
            <dl>
              <DetailRow
                label="Requester"
                value={
                  <AlumniLink
                    alumni={requester ?? undefined}
                    alumniId={item.requester_alumni_id}
                  />
                }
              />
              <DetailRow
                label="Target"
                value={
                  <AlumniLink
                    alumni={target ?? undefined}
                    alumniId={item.target_alumni_id}
                  />
                }
              />
              <DetailRow label="Reason" value={item.request_reason} />
              <DetailRow label="Status" value={statusLabel(item.status)} />
              {item.rejection_reason ? (
                <DetailRow
                  label="Rejection reason"
                  value={item.rejection_reason}
                />
              ) : null}
              <DetailRow
                label="Updated"
                value={formatDateTime(item.updated_at)}
              />
            </dl>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{canReview ? "Admin review" : "Status"}</CardTitle>
            <CardDescription>
              {canReview
                ? "Approve or reject this request. Reject requires a reason."
                : "No further admin action is available for this status."}
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            {canReview ? (
              <>
                <Button
                  disabled={busy}
                  onClick={() => requestReview("APPROVE")}
                >
                  {busy ? "Working…" : "Approve"}
                </Button>

                <Field>
                  <FieldLabel htmlFor="rejection_reason">
                    Rejection reason
                  </FieldLabel>
                  <Textarea
                    id="rejection_reason"
                    value={rejectionReason}
                    onChange={(e) => {
                      setRejectionReason(e.target.value)
                      setFieldError("")
                    }}
                    placeholder="Required when rejecting"
                    rows={4}
                    disabled={busy}
                  />
                </Field>
                {fieldError ? <FieldError>{fieldError}</FieldError> : null}
                <Button
                  variant="destructive"
                  disabled={busy}
                  onClick={() => requestReview("REJECT")}
                >
                  Reject
                </Button>
              </>
            ) : (
              <p className="text-sm text-muted-foreground">
                Current status is{" "}
                <span className="font-medium text-foreground">
                  {statusLabel(item.status)}
                </span>
                .
              </p>
            )}

            {error ? <p className="text-sm text-destructive">{error}</p> : null}
            {message ? (
              <p className="text-sm text-emerald-600 dark:text-emerald-400">
                {message}
              </p>
            ) : null}
          </CardContent>
        </Card>
      </div>

      <ConfirmDialog
        open={confirmAction === "APPROVE"}
        title="Approve contact request"
        description="Approve this request? Both alumni will be able to see each other's contact details."
        confirmLabel="Approve"
        busy={busy}
        onOpenChange={(open) => {
          if (!open && !busy) setConfirmAction(null)
        }}
        onConfirm={handleReview}
      />
      <ConfirmDialog
        open={confirmAction === "REJECT"}
        title="Reject contact request"
        description="Reject this request? This cannot be undone."
        confirmLabel="Reject"
        variant="destructive"
        busy={busy}
        onOpenChange={(open) => {
          if (!open && !busy) setConfirmAction(null)
        }}
        onConfirm={handleReview}
      />
    </div>
  )
}
