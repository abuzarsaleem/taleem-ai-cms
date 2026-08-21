import {
  Briefcase,
  Check,
  GraduationCap,
  User,
  UserRound,
  X,
  type LucideIcon,
} from "lucide-react"
import { useEffect, useState, type ReactNode } from "react"
import { useParams } from "react-router-dom"
import { toast } from "sonner"

import { PageBreadcrumb } from "@/components/page-breadcrumb"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogTitle,
} from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { ApiError } from "@/lib/api-client"
import { cn } from "@/lib/utils"
import { catalogService } from "@/services/catalog.service"
import { contactRequestService } from "@/services/contact-requests.service"
import { directoryService } from "@/services/directory.service"
import { profileService } from "@/services/profile.service"
import type { DirectoryAlumni } from "@/types/portal"

type ContactChannel = "email" | "mobile" | "whatsapp"

const STEPS = [
  {
    id: "personal",
    title: "Personal & Contact",
    heading: "Personal Details",
    description: "Contact and identity details for this alumni.",
    icon: UserRound,
  },
  {
    id: "educational",
    title: "Academic",
    heading: "Academic Records",
    description: "Degree and academic records.",
    icon: GraduationCap,
  },
  {
    id: "professional",
    title: "Professional",
    heading: "Professional Details",
    description: "Work history and career details.",
    icon: Briefcase,
  },
] as const satisfies ReadonlyArray<{
  id: string
  title: string
  heading: string
  description: string
  icon: LucideIcon
}>

function ReadField({
  label,
  value,
  className,
}: {
  label: string
  value: ReactNode
  className?: string
}) {
  return (
    <div className={cn("grid gap-1.5", className)}>
      <dt className="text-[11px] font-medium tracking-wider text-muted-foreground uppercase">
        {label}
      </dt>
      <dd className="min-h-10 rounded-lg border border-border bg-muted/40 px-3 py-2.5 text-sm font-medium break-words text-foreground">
        {value || "—"}
      </dd>
    </div>
  )
}

export function DirectoryDetailPage() {
  const { alumniId = "" } = useParams()
  const [alumni, setAlumni] = useState<DirectoryAlumni | null>(null)
  const [degreeLabels, setDegreeLabels] = useState<Map<string, string>>(
    new Map(),
  )
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(true)
  const [myAlumniId, setMyAlumniId] = useState<string | null>(null)
  const [pending, setPending] = useState(false)
  const [contactOpen, setContactOpen] = useState(false)
  const [contactReason, setContactReason] = useState("")
  const [contactChannels, setContactChannels] = useState<ContactChannel[]>([
    "email",
  ])
  const [submitting, setSubmitting] = useState(false)
  const [stepIndex, setStepIndex] = useState(0)

  useEffect(() => {
    void catalogService.getDegreeProgramMap().then(setDegreeLabels)
    void profileService.getMyProfile().then((profile) => {
      setMyAlumniId(profile.alumni_id)
    })
  }, [])

  useEffect(() => {
    let cancelled = false
    async function load() {
      setLoading(true)
      setError("")
      try {
        const data = await directoryService.getOne(alumniId)
        if (cancelled) return
        setAlumni(data)
        const sent = await contactRequestService.listSent().catch(() => [])
        if (cancelled) return
        setPending(
          sent.some(
            (r) =>
              r.target_alumni_id === alumniId &&
              ["PENDING_ADMIN", "APPROVED", "PENDING"].includes(r.status),
          ),
        )
      } catch (err) {
        if (!cancelled) {
          setError(
            err instanceof ApiError ? err.message : "Failed to load profile",
          )
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    if (alumniId) void load()
    return () => {
      cancelled = true
    }
  }, [alumniId])

  function toggleChannel(channel: ContactChannel) {
    setContactChannels((current) => {
      if (current.includes(channel)) {
        if (current.length === 1) return current
        return current.filter((item) => item !== channel)
      }
      return [...current, channel]
    })
  }

  async function submitContactRequest() {
    if (!alumni) return
    if (contactReason.trim().length < 5) {
      toast.error("Please explain the purpose of your request")
      return
    }
    setSubmitting(true)
    try {
      await contactRequestService.create({
        target_alumni_id: alumni.alumni_id,
        request_reason: contactReason.trim(),
        requested_fields: contactChannels,
      })
      toast.success("Contact request sent")
      setPending(true)
      setContactOpen(false)
      setContactReason("")
      setContactChannels(["email"])
    } catch (err) {
      toast.error(
        err instanceof ApiError ? err.message : "Failed to submit request",
      )
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="mx-auto max-w-6xl space-y-4">
        <div className="h-8 w-48 animate-pulse rounded-lg bg-muted" />
        <div className="grid gap-6 lg:grid-cols-[minmax(280px,320px)_1fr]">
          <div className="h-[28rem] animate-pulse rounded-xl bg-muted" />
          <div className="h-[28rem] animate-pulse rounded-xl bg-muted" />
        </div>
      </div>
    )
  }

  if (error || !alumni) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Alumni unavailable</CardTitle>
          <CardDescription>{error || "Not found"}</CardDescription>
        </CardHeader>
      </Card>
    )
  }

  const role =
    alumni.professional[0]?.job_title ??
    alumni.professional[0]?.role ??
    alumni.primary_role ??
    "Alumni member"
  const locationLabel = [alumni.city, alumni.country].filter(Boolean).join(", ")
  const companyCity = [
    alumni.professional[0]?.current_company,
    alumni.city,
  ]
    .filter(Boolean)
    .join(" · ")
  const step = STEPS[stepIndex]
  const isFirst = stepIndex === 0
  const isLast = stepIndex === STEPS.length - 1
  const isSelf = alumni.alumni_id === myAlumniId

  const sectionHasData = {
    personal: Boolean(
      alumni.is_contact_revealed
        ? alumni.email || alumni.phone_number || alumni.address
        : locationLabel || alumni.full_name,
    ),
    educational: alumni.academic.length > 0,
    professional: alumni.professional.length > 0,
  }

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <PageBreadcrumb
        current={alumni.full_name}
        fallback={{ label: "Directory", to: "/directory" }}
      />

      <div className="grid items-stretch gap-6 lg:grid-cols-[minmax(280px,320px)_1fr]">
        <aside className="flex h-full flex-col gap-6 rounded-xl bg-card p-6 text-card-foreground shadow-sm ring-1 ring-border">
          <div className="flex flex-col items-center text-center">
            {alumni.photo_url ? (
              <img
                src={alumni.photo_url}
                alt={alumni.full_name}
                className="size-28 rounded-full border-4 border-accent object-cover shadow-sm ring-4 ring-accent/15"
              />
            ) : (
              <div className="flex size-28 items-center justify-center rounded-full border-4 border-accent bg-muted text-muted-foreground shadow-sm ring-4 ring-accent/15">
                <User className="size-10" />
              </div>
            )}
            <h1 className="mt-4 text-xl font-semibold tracking-tight text-foreground">
              {alumni.full_name}
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              {companyCity || locationLabel || role}
            </p>
            <span className="mt-3 inline-flex items-center gap-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-1 text-[11px] font-semibold text-emerald-800 dark:text-emerald-300">
              <Check className="size-3.5" strokeWidth={2.5} />
              Verified Alumni
            </span>
          </div>

          <nav className="space-y-1" aria-label="Profile sections">
            {STEPS.map((item, index) => {
              const active = index === stepIndex
              const Icon = item.icon
              const done = sectionHasData[item.id]
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setStepIndex(index)}
                  className={cn(
                    "flex w-full items-center gap-3 rounded-lg px-3 py-3 text-left text-sm transition-colors",
                    active
                      ? "bg-primary/8 font-semibold text-foreground ring-1 ring-primary/20"
                      : "text-muted-foreground hover:bg-muted/60 hover:text-foreground",
                  )}
                >
                  <Icon className="size-4 shrink-0" />
                  <span className="min-w-0 flex-1 truncate">{item.title}</span>
                  {done ? (
                    <Check className="size-4 shrink-0 text-accent" />
                  ) : null}
                </button>
              )
            })}
          </nav>
        </aside>

        <section className="flex min-h-[28rem] flex-col rounded-xl bg-card p-6 text-card-foreground shadow-sm ring-1 ring-border md:p-8">
          <div>
            <h2 className="text-2xl font-semibold tracking-tight text-foreground">
              {step.heading}
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              {step.description}
            </p>
          </div>

          <div className="mt-8 flex-1">
            {step.id === "personal" ? (
              <dl className="grid gap-4 sm:grid-cols-2">
                <ReadField
                  label="Full name"
                  value={alumni.full_name}
                  className="sm:col-span-2"
                />
                {alumni.is_contact_revealed ? (
                  <>
                    <ReadField label="Email address" value={alumni.email} />
                    <ReadField
                      label="Mobile / WhatsApp"
                      value={alumni.whatsapp_number || alumni.phone_number}
                    />
                    <ReadField label="Phone" value={alumni.phone_number} />
                    <ReadField label="Location" value={locationLabel} />
                    <ReadField
                      label="LinkedIn"
                      value={
                        alumni.linkedin_url ? (
                          <a
                            href={alumni.linkedin_url}
                            target="_blank"
                            rel="noreferrer"
                            className="text-foreground underline-offset-4 hover:underline"
                          >
                            {alumni.linkedin_url}
                          </a>
                        ) : null
                      }
                      className="sm:col-span-2"
                    />
                    <ReadField label="Address" value={alumni.address} />
                    <ReadField
                      label="Secondary address"
                      value={alumni.secondry_address}
                    />
                  </>
                ) : (
                  <>
                    <ReadField label="Location" value={locationLabel} />
                    <ReadField label="Role" value={role} />
                    <div className="rounded-lg border border-dashed border-border bg-muted/30 px-4 py-4 sm:col-span-2">
                      <p className="text-sm text-muted-foreground">
                        Contact details are private.{" "}
                        {!isSelf
                          ? pending
                            ? "Your contact request is pending review."
                            : "Request access to email, phone, or WhatsApp."
                          : "This is your own profile."}
                      </p>
                      {!isSelf ? (
                        <Button
                          type="button"
                          className="mt-3 rounded-[11px]"
                          disabled={pending}
                          onClick={() => {
                            if (pending) return
                            setContactOpen(true)
                            setContactReason("")
                            setContactChannels(["email"])
                          }}
                        >
                          {pending ? "Request pending" : "Request contact"}
                        </Button>
                      ) : null}
                    </div>
                  </>
                )}
              </dl>
            ) : null}

            {step.id === "educational" ? (
              alumni.academic.length > 0 ? (
                <div className="grid gap-6">
                  {alumni.academic.map((item, index) => (
                    <dl
                      key={`${item.degree_program_id}-${index}`}
                      className={cn(
                        "grid gap-4 sm:grid-cols-2",
                        index > 0 && "border-t border-border pt-6",
                      )}
                    >
                      <ReadField
                        label="Degree program"
                        value={
                          degreeLabels.get(item.degree_program_id) ??
                          item.degree_program_id
                        }
                        className="sm:col-span-2"
                      />
                      <ReadField
                        label="Graduation year"
                        value={item.graduation_year}
                      />
                    </dl>
                  ))}
                </div>
              ) : (
                <div className="flex items-center gap-2 py-8 text-sm text-muted-foreground">
                  <GraduationCap className="size-4" />
                  No academic details available.
                </div>
              )
            ) : null}

            {step.id === "professional" ? (
              alumni.professional.length > 0 ? (
                <div className="grid gap-6">
                  {alumni.professional.map((item, index) => (
                    <dl
                      key={`${item.job_title ?? "role"}-${index}`}
                      className={cn(
                        "grid gap-4 sm:grid-cols-2",
                        index > 0 && "border-t border-border pt-6",
                      )}
                    >
                      <ReadField
                        label="Company"
                        value={item.current_company}
                      />
                      <ReadField label="Job title" value={item.job_title} />
                      <ReadField
                        label="Role"
                        value={item.role}
                        className="sm:col-span-2"
                      />
                    </dl>
                  ))}
                </div>
              ) : (
                <div className="flex items-center gap-2 py-8 text-sm text-muted-foreground">
                  <User className="size-4" />
                  No professional details available.
                </div>
              )
            ) : null}
          </div>

          <div className="mt-8 flex items-center justify-end gap-2 border-t border-border pt-5">
            {!isFirst ? (
              <Button
                type="button"
                variant="outline"
                className="rounded-[11px]"
                onClick={() => setStepIndex((current) => current - 1)}
              >
                Back
              </Button>
            ) : null}
            {!isLast ? (
              <Button
                type="button"
                className="rounded-[11px]"
                onClick={() => setStepIndex((current) => current + 1)}
              >
                Next
              </Button>
            ) : null}
          </div>
        </section>
      </div>

      <Dialog open={contactOpen} onOpenChange={setContactOpen}>
        <DialogContent
          showCloseButton={false}
          className="gap-0 overflow-hidden rounded-2xl border-border bg-card p-0 text-card-foreground sm:max-w-lg"
        >
          <div className="flex items-start justify-between gap-3 px-5 pt-5">
            <div>
              <DialogTitle className="text-lg font-semibold text-foreground">
                Request contact information
              </DialogTitle>
              <DialogDescription className="mt-1.5 text-sm text-muted-foreground">
                Your request will be reviewed before consent is requested from
                the alumnus.
              </DialogDescription>
            </div>
            <button
              type="button"
              className="grid size-8 shrink-0 place-items-center rounded-full bg-muted text-foreground"
              onClick={() => setContactOpen(false)}
              aria-label="Close"
            >
              <X className="size-4" />
            </button>
          </div>

          <div className="space-y-5 px-5 py-5">
            <div>
              <label
                htmlFor="detail-contact-reason"
                className="text-sm font-semibold text-foreground"
              >
                Purpose of request *
              </label>
              <Textarea
                id="detail-contact-reason"
                value={contactReason}
                onChange={(e) => setContactReason(e.target.value)}
                rows={4}
                placeholder="Explain why you would like to connect…"
                className="mt-2 min-h-28 rounded-xl"
              />
            </div>

            <div>
              <p className="text-sm font-semibold text-foreground">
                Requested information
              </p>
              <div className="mt-2 space-y-2">
                {(
                  [
                    ["email", "Email"],
                    ["mobile", "Mobile"],
                    ["whatsapp", "WhatsApp"],
                  ] as const
                ).map(([value, label]) => {
                  const checked = contactChannels.includes(value)
                  return (
                    <button
                      key={value}
                      type="button"
                      onClick={() => toggleChannel(value)}
                      className={cn(
                        "flex w-full items-center justify-between rounded-xl border px-4 py-3 text-sm font-medium transition-colors",
                        checked
                          ? "border-primary/30 bg-primary/5 text-foreground"
                          : "border-border text-foreground",
                      )}
                    >
                      <span
                        className={cn(
                          "grid size-5 place-items-center rounded border",
                          checked
                            ? "border-primary bg-primary text-primary-foreground"
                            : "border-border bg-card",
                        )}
                      >
                        {checked ? (
                          <Check className="size-3" strokeWidth={3} />
                        ) : null}
                      </span>
                      <span>{label}</span>
                    </button>
                  )
                })}
              </div>
            </div>
          </div>

          <DialogFooter className="border-t border-border px-5 py-4 sm:justify-end">
            <Button
              type="button"
              variant="outline"
              className="rounded-[11px]"
              onClick={() => setContactOpen(false)}
              disabled={submitting}
            >
              Cancel
            </Button>
            <Button
              type="button"
              className="rounded-[11px]"
              onClick={() => void submitContactRequest()}
              disabled={submitting || contactReason.trim().length < 5}
            >
              {submitting ? "Submitting…" : "Submit request"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
