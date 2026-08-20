import { useEffect, useState } from "react"
import { Link, useLocation, useParams } from "react-router-dom"
import { ArrowDownIcon, ArrowRightIcon, UserIcon } from "lucide-react"

import { useAuth } from "@/auth/AuthContext"
import { BackButton } from "@/components/admin/back-button"
import { ConfirmDialog } from "@/components/admin/confirm-dialog"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
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
  type DirectoryAlumniProfile,
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

function initialsFromName(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean)
  if (!parts.length) return "?"
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return `${parts[0][0]}${parts[1][0]}`.toUpperCase()
}

function fieldLabel(field: string) {
  return field
    .toLowerCase()
    .split(/[_\s-]+/)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ")
}

function requestedFieldsOf(item: ContactRequest) {
  if (item.requested_fields?.length) return item.requested_fields
  const match = item.request_reason.match(/Requested:\s*(.+)\s*$/i)
  if (!match) return []
  return match[1]
    .split(",")
    .map((value) => value.trim())
    .filter(Boolean)
}

function reasonText(reason: string) {
  return reason.replace(/\n*\s*Requested:\s*.+$/i, "").trim() || reason
}

function DetailRow({
  label,
  value,
}: {
  label: string
  value: React.ReactNode
}) {
  return (
    <div className="grid gap-1 border-b py-3 last:border-b-0 sm:grid-cols-[8rem_1fr] sm:gap-4">
      <dt className="text-sm text-muted-foreground">{label}</dt>
      <dd className="text-sm font-medium break-words">{value || "—"}</dd>
    </div>
  )
}

function PersonCard({
  title,
  description,
  alumni,
  alumniId,
  fallbackName,
}: {
  title: string
  description: string
  alumni: DirectoryAlumniProfile | null
  alumniId: string
  fallbackName?: string | null
}) {
  const location = useLocation()
  const name = alumni?.full_name ?? fallbackName?.trim() ?? "Unknown alumni"
  const locationLabel = [alumni?.city, alumni?.country].filter(Boolean).join(", ")
  const jobTitle =
    alumni?.professional?.[0]?.job_title ??
    alumni?.professional?.[0]?.role ??
    alumni?.primary_role
  const company = alumni?.professional?.[0]?.current_company
  const graduationYear =
    alumni?.academic?.[0]?.graduation_year ??
    alumni?.primary_graduation_year

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <div className="flex items-center gap-4">
          <Avatar className="size-16 after:rounded-lg" size="lg">
            {alumni?.photo_url ? (
              <AvatarImage src={alumni.photo_url} alt={name} />
            ) : null}
            <AvatarFallback className="rounded-lg text-base">
              {alumni || fallbackName ? (
                initialsFromName(name)
              ) : (
                <UserIcon className="size-6" />
              )}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0">
            <Link
              to={`/alumni/${alumniId}`}
              state={withNavTrail(location)}
              className="font-semibold underline-offset-4 hover:underline"
            >
              {name}
            </Link>
            {jobTitle ? (
              <p className="text-sm text-muted-foreground">{jobTitle}</p>
            ) : null}
            {graduationYear ? (
              <p className="text-sm text-muted-foreground">
                Class of {graduationYear}
              </p>
            ) : null}
          </div>
        </div>

        <dl>
          <DetailRow label="Email" value={alumni?.email} />
          <DetailRow label="Phone" value={alumni?.phone_number} />
          <DetailRow label="WhatsApp" value={alumni?.whatsapp_number} />
          <DetailRow label="Location" value={locationLabel} />
          <DetailRow label="Graduation year" value={graduationYear} />
          <DetailRow label="Company" value={company} />
        </dl>
      </CardContent>
    </Card>
  )
}

export default function ContactRequestDetailPage() {
  const { id } = useParams()
  const { token } = useAuth()
  const location = useLocation()
  const stateRequest =
    (location.state as LocationState | null)?.request ?? null

  const [item, setItem] = useState<ContactRequest | null>(
    stateRequest && stateRequest.id === id ? stateRequest : null,
  )
  const [requester, setRequester] = useState<DirectoryAlumniProfile | null>(null)
  const [target, setTarget] = useState<DirectoryAlumniProfile | null>(null)
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

    const request = stateRequest && stateRequest.id === id ? stateRequest : null
    if (!request) {
      setItem(null)
      setLoading(false)
      setError("Contact request not found")
      return
    }

    setItem(request)

    let cancelled = false

    void (async () => {
      setLoading(true)
      setError("")
      try {
        const [requesterProfile, targetProfile] = await Promise.all([
          alumniService
            .getDirectoryProfile(token, request.requester_alumni_id)
            .catch(() => null),
          alumniService
            .getDirectoryProfile(token, request.target_alumni_id)
            .catch(() => null),
        ])
        if (cancelled) return
        setRequester(requesterProfile)
        setTarget(targetProfile)
      } catch (err) {
        if (!cancelled) {
          setError(
            err instanceof ApiError
              ? err.message
              : "Failed to load alumni details",
          )
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()

    return () => {
      cancelled = true
    }
  }, [token, id, stateRequest])

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
        <div className="mt-4 grid gap-4 lg:grid-cols-2">
          <Skeleton className="h-72" />
          <Skeleton className="h-72" />
        </div>
        <Skeleton className="h-56 w-full" />
      </div>
    )
  }

  if (!item) {
    return (
      <div className="flex flex-1 flex-col gap-4 px-4 py-6 lg:px-6">
        <BackButton fallback="/contact-requests" />
        <p className="text-sm text-destructive">
          {error || "Contact request not found"}
        </p>
      </div>
    )
  }

  const canReview =
    item.status === "PENDING_ADMIN" || item.status === "PENDING_ALUMNI"
  const requestedFields = requestedFieldsOf(item)

  return (
    <div className="flex flex-1 flex-col gap-4 py-4 md:gap-6 md:py-6">
      <div className="flex flex-col gap-3 px-4 lg:px-6">
        <BackButton fallback="/contact-requests" />
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

      <div className="grid items-stretch gap-4 px-4 lg:grid-cols-[1fr_auto_1fr] lg:px-6">
        <PersonCard
          title="Requester"
          description="Alumni who sent this request"
          alumni={requester}
          alumniId={item.requester_alumni_id}
          fallbackName={item.requester_alumni_name}
        />
        <div className="flex items-center justify-center py-1 lg:px-1">
          <span className="flex size-10 items-center justify-center rounded-full border bg-card text-muted-foreground">
            <ArrowDownIcon className="size-4 lg:hidden" />
            <ArrowRightIcon className="hidden size-4 lg:block" />
            <span className="sr-only">from requester to</span>
          </span>
        </div>
        <PersonCard
          title="To"
          description="Alumni they want to contact"
          alumni={target}
          alumniId={item.target_alumni_id}
          fallbackName={item.target_alumni_name}
        />
      </div>

      <div className="grid gap-4 px-4 lg:grid-cols-3 lg:px-6">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Request details</CardTitle>
            <CardDescription>Why this introduction was requested</CardDescription>
          </CardHeader>
          <CardContent>
            <dl>
              <DetailRow
                label="Reason"
                value={reasonText(item.request_reason)}
              />
              <DetailRow
                label="Requested"
                value={
                  requestedFields.length ? (
                    <div className="flex flex-wrap gap-1.5">
                      {requestedFields.map((field) => (
                        <Badge
                          key={field}
                          variant="outline"
                          className="font-normal capitalize"
                        >
                          {fieldLabel(field)}
                        </Badge>
                      ))}
                    </div>
                  ) : (
                    "—"
                  )
                }
              />
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
