import { useEffect, useState } from "react"
import { useParams } from "react-router-dom"
import { QrCodeIcon, UserIcon } from "lucide-react"

import { useAuth } from "@/auth/AuthContext"
import { BackButton } from "@/components/admin/back-button"
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
import { Input } from "@/components/ui/input"
import { Skeleton } from "@/components/ui/skeleton"
import { Textarea } from "@/components/ui/textarea"
import { ApiError } from "@/lib/api"
import { toast } from "sonner"
import {
  degreeProgramLabel,
  formatDateTime,
  registrationStatusVariant,
} from "@/lib/registration-utils"
import { cn } from "@/lib/utils"
import {
  registrationService,
  type RegistrationDetail,
} from "@/services/registration.service"

function DetailSkeleton() {
  return (
    <div className="flex flex-1 flex-col gap-4 py-4 md:gap-6 md:py-6">
      <div className="px-4 lg:px-6">
        <Skeleton className="mb-4 h-8 w-32" />
        <Skeleton className="h-8 w-64" />
        <Skeleton className="mt-2 h-4 w-48" />
      </div>
      <div className="grid gap-4 px-4 lg:grid-cols-3 lg:px-6">
        <Skeleton className="h-72 lg:col-span-2" />
        <Skeleton className="h-72" />
      </div>
    </div>
  )
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

export default function RegistrationDetailPage() {
  const { id } = useParams()
  const { token } = useAuth()

  const [item, setItem] = useState<RegistrationDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState("")
  const [message, setMessage] = useState("")
  const [cnic, setCnic] = useState("")
  const [rejectionReason, setRejectionReason] = useState("")
  const [fieldError, setFieldError] = useState("")
  const [confirmAction, setConfirmAction] = useState<"APPROVED" | "REJECTED" | null>(
    null,
  )

  async function load() {
    if (!token || !id) return
    setLoading(true)
    setError("")
    try {
      const result = await registrationService.getById(token, id)
      setItem(result)
      setCnic(result.cnic_national_id ?? "")
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to load")
      setItem(null)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, token])

  function requestReview(status: "APPROVED" | "REJECTED") {
    if (!cnic.trim()) {
      setFieldError("CNIC is required to confirm this registration")
      return
    }

    if (status === "REJECTED" && !rejectionReason.trim()) {
      setFieldError("Rejection reason is required")
      return
    }

    setFieldError("")
    setConfirmAction(status)
  }

  async function handleReview() {
    if (!token || !id || !item || !confirmAction) return
    const status = confirmAction

    setBusy(true)
    setError("")
    setMessage("")
    setFieldError("")

    try {
      const result = await registrationService.review(token, id, {
        status,
        cnic_national_id: cnic.trim(),
        ...(status === "REJECTED"
          ? { rejection_reason: rejectionReason.trim() }
          : {}),
      })

      if (result.status === "APPROVED") {
        const notes = [
          result.notification_failed ? "activation email failed to send" : null,
          result.qr_failed ? "QR generation failed" : null,
        ].filter(Boolean)
        const successMessage = notes.length
          ? `Approved (${notes.join(", ")}).`
          : "Registration approved."
        setMessage(successMessage)
        toast.success(successMessage)
      } else {
        const successMessage = result.notification_failed
          ? "Rejected (notification failed to send)."
          : "Registration rejected."
        setMessage(successMessage)
        toast.success(successMessage)
      }

      setConfirmAction(null)
      await load()
    } catch (err) {
      const failMessage =
        err instanceof ApiError
          ? err.message
          : status === "APPROVED"
            ? "Approve failed"
            : "Reject failed"
      setError(failMessage)
      toast.error(failMessage)
    } finally {
      setBusy(false)
    }
  }

  if (loading) return <DetailSkeleton />

  if (!item) {
    return (
      <div className="flex flex-1 flex-col gap-4 px-4 py-6 lg:px-6">
        <BackButton fallback="/registrations" />
        <p className="text-sm text-destructive">
          {error || "Registration not found"}
        </p>
      </div>
    )
  }

  const isPending = item.status === "PENDING"
  const profilePhotoUrl = item.alumni?.photo_url ?? item.photo_url
  const qrCodeUrl = item.alumni?.qr_code ?? null

  return (
    <div className="flex flex-1 flex-col gap-4 py-4 md:gap-6 md:py-6">
      <div className="flex flex-col gap-3 px-4 lg:px-6">
        <BackButton fallback="/registrations" />
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight">
              {item.full_name}
            </h1>
            <Badge
              variant={registrationStatusVariant(item.status)}
              className={cn(
                item.status === "PENDING" &&
                  "bg-amber-500/15 text-amber-700 dark:text-amber-400",
              )}
            >
              {item.status}
            </Badge>
          </div>
          <p className="text-muted-foreground">
            {item.reference_number ? (
              <span className="font-medium text-foreground">
                {item.reference_number}
              </span>
            ) : null}
            {item.reference_number ? " · " : null}
            {item.email}
          </p>
        </div>
      </div>

      <div className="grid gap-4 px-4 lg:grid-cols-3 lg:px-6">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Applicant details</CardTitle>
            <CardDescription>
              Submitted {formatDateTime(item.submitted_at)}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <dl>
              <DetailRow
                label="Reference no"
                value={item.reference_number}
              />
              <DetailRow label="Full name" value={item.full_name} />
              <DetailRow label="Email" value={item.email} />
              <DetailRow label="Phone" value={item.phone_number} />
              <DetailRow label="WhatsApp" value={item.whatsapp_number} />
              <DetailRow label="CNIC" value={item.cnic_national_id} />
              <DetailRow
                label="Roll number"
                value={item.registration_roll_number}
              />
              <DetailRow label="Graduation year" value={item.graduation_year} />
              <DetailRow
                label="Degree program"
                value={
                  item.degree_program_name ||
                  degreeProgramLabel(item.degree_program_id)
                }
              />
              {item.rejection_reason ? (
                <DetailRow
                  label="Rejection reason"
                  value={item.rejection_reason}
                />
              ) : null}
              {item.reviewed_at ? (
                <DetailRow
                  label="Reviewed at"
                  value={formatDateTime(item.reviewed_at)}
                />
              ) : null}
              {item.alumni ? (
                <>
                  <DetailRow label="Alumni ID" value={item.alumni.alumni_id} />
                  <DetailRow
                    label="Alumni status"
                    value={item.alumni.status}
                  />
                </>
              ) : null}
            </dl>
          </CardContent>
        </Card>

        <div className="flex flex-col gap-4">
          <Card>
            <CardHeader>
              <CardTitle>Profile & QR</CardTitle>
              <CardDescription>
                Alumni photo and membership QR code
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-4">
              <div className="flex flex-col items-center gap-3 rounded-lg border p-4">
                <p className="w-full text-xs font-medium text-muted-foreground">
                  Profile photo
                </p>
                {profilePhotoUrl ? (
                  <img
                    src={profilePhotoUrl}
                    alt={`${item.full_name} profile`}
                    className="size-40 rounded-lg border object-cover"
                  />
                ) : (
                  <div className="flex size-40 flex-col items-center justify-center gap-2 rounded-lg border border-dashed bg-muted/40 text-muted-foreground">
                    <UserIcon className="size-10" />
                    <span className="text-xs">No photo uploaded</span>
                  </div>
                )}
              </div>

              <div className="flex flex-col items-center gap-3 rounded-lg border p-4">
                <p className="w-full text-xs font-medium text-muted-foreground">
                  Alumni QR code
                </p>
                {qrCodeUrl ? (
                  <>
                    <img
                      src={qrCodeUrl}
                      alt={`${item.full_name} QR code`}
                      className="size-40 rounded-lg border bg-white object-contain p-2"
                    />
                    <Button
                      size="sm"
                      variant="outline"
                      render={
                        <a
                          href={qrCodeUrl}
                          target="_blank"
                          rel="noreferrer"
                        />
                      }
                    >
                      <QrCodeIcon />
                      Open QR
                    </Button>
                  </>
                ) : (
                  <div className="flex size-40 flex-col items-center justify-center gap-2 rounded-lg border border-dashed bg-muted/40 text-muted-foreground">
                    <QrCodeIcon className="size-10" />
                    <span className="text-xs">
                      {item.alumni ? "QR not available" : "Available after approval"}
                    </span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>{isPending ? "Review decision" : "Status"}</CardTitle>
              <CardDescription>
                {isPending
                  ? "Confirm CNIC, then approve or reject."
                  : "This registration has already been reviewed."}
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-4">
              {isPending ? (
                <>
                  <Field>
                    <FieldLabel htmlFor="cnic">Confirm CNIC</FieldLabel>
                    <Input
                      id="cnic"
                      value={cnic}
                      onChange={(e) => {
                        setCnic(e.target.value)
                        setFieldError("")
                      }}
                      placeholder="#####-#######-#"
                      disabled={busy}
                    />
                  </Field>

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
                      placeholder="Required only when rejecting"
                      rows={4}
                      disabled={busy}
                    />
                  </Field>

                  {fieldError ? <FieldError>{fieldError}</FieldError> : null}

                  <div className="flex flex-col gap-2">
                    <Button
                      disabled={busy}
                      onClick={() => requestReview("APPROVED")}
                    >
                      {busy ? "Working…" : "Approve"}
                    </Button>
                    <Button
                      variant="destructive"
                      disabled={busy}
                      onClick={() => requestReview("REJECTED")}
                    >
                      Reject
                    </Button>
                  </div>
                </>
              ) : (
                <p className="text-sm text-muted-foreground">
                  No further review actions are available for{" "}
                  <span className="font-medium text-foreground">
                    {item.status}
                  </span>{" "}
                  registrations.
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
      </div>

      <ConfirmDialog
        open={confirmAction === "APPROVED"}
        title="Approve registration"
        description={`Approve ${item.full_name}? This will activate their alumni account.`}
        confirmLabel="Approve"
        busy={busy}
        onOpenChange={(open) => {
          if (!open && !busy) setConfirmAction(null)
        }}
        onConfirm={handleReview}
      />
      <ConfirmDialog
        open={confirmAction === "REJECTED"}
        title="Reject registration"
        description={`Reject ${item.full_name}? This cannot be undone.`}
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
