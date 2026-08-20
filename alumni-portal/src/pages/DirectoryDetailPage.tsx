import { Check, X } from "lucide-react"
import { useEffect, useState } from "react"
import { Link, useParams } from "react-router-dom"
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

function initials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("")
}

function degreeShort(label?: string | null) {
  return label?.split(" — ")[0] ?? null
}

function profileTags(
  alumni: DirectoryAlumni,
  degreeLabels: Map<string, string>,
) {
  const tags: string[] = []
  const degree = degreeShort(
    degreeLabels.get(alumni.academic[0]?.degree_program_id ?? ""),
  )
  const year =
    alumni.primary_graduation_year ?? alumni.academic[0]?.graduation_year
  const role =
    alumni.professional[0]?.job_title ??
    alumni.professional[0]?.role ??
    alumni.primary_role
  if (degree) tags.push(degree)
  if (year) tags.push(String(year))
  if (role) tags.push(role)
  return tags.slice(0, 3)
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
    return <div className="h-56 animate-pulse rounded-2xl bg-[#e8eef6]" />
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

  const tags = profileTags(alumni, degreeLabels)
  const role =
    alumni.professional[0]?.job_title ??
    alumni.professional[0]?.role ??
    alumni.primary_role ??
    "Alumni member"
  const companyCity = [
    alumni.professional[0]?.current_company,
    alumni.city,
  ]
    .filter(Boolean)
    .join(" · ")

  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <PageBreadcrumb
        current={alumni.full_name}
        fallback={{ label: "Directory", to: "/directory" }}
      />

      <article className="overflow-hidden rounded-2xl bg-white shadow-[0_12px_35px_rgba(8,27,69,0.06)] ring-1 ring-[#e5eaf1]">
        <div className="border-b border-[#eef2f7] px-5 py-4">
          <h1 className="text-lg font-semibold text-primary">
            {alumni.full_name}
          </h1>
        </div>

        <div className="space-y-5 px-5 py-5">
          <div className="flex items-start gap-4">
            {alumni.photo_url ? (
              <img
                src={alumni.photo_url}
                alt=""
                className="size-16 rounded-2xl object-cover"
              />
            ) : (
              <div className="flex size-16 items-center justify-center rounded-2xl bg-[#dce9ff] text-lg font-extrabold text-[#174ea6]">
                {initials(alumni.full_name)}
              </div>
            )}
            <div className="min-w-0">
              <p className="font-semibold text-primary">{role}</p>
              <p className="mt-0.5 text-sm text-muted-foreground">
                {companyCity ||
                  [alumni.city, alumni.country].filter(Boolean).join(", ") ||
                  "Location unavailable"}
              </p>
              <span className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-semibold text-emerald-800">
                <Check className="size-3.5" strokeWidth={2.5} />
                Verified Alumni
              </span>
            </div>
          </div>

          <div className="border-t border-[#eef2f7] pt-5">
            <h2 className="font-semibold text-primary">Professional profile</h2>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
              Experienced professional with a background in their field, open to
              meaningful alumni connections and collaboration.
            </p>
            <div className="mt-3 flex flex-wrap gap-1.5">
              {tags.map((tag) => (
                <span
                  key={tag}
                  className="rounded-full bg-[#e8eef8] px-2.5 py-1 text-[11px] font-medium text-primary"
                >
                  {tag}
                </span>
              ))}
              <span className="rounded-full bg-[#e8eef8] px-2.5 py-1 text-[11px] font-medium text-primary">
                Professional Network
              </span>
            </div>
          </div>

          {alumni.is_contact_revealed ? (
            <div className="border-t border-[#eef2f7] pt-5">
              <h2 className="font-semibold text-primary">Contact</h2>
              <div className="mt-3 grid gap-2 text-sm sm:grid-cols-2">
                <p>
                  <span className="font-medium text-primary">Email:</span>{" "}
                  {alumni.email || "—"}
                </p>
                <p>
                  <span className="font-medium text-primary">Phone:</span>{" "}
                  {alumni.phone_number || "—"}
                </p>
                <p>
                  <span className="font-medium text-primary">WhatsApp:</span>{" "}
                  {alumni.whatsapp_number || "—"}
                </p>
                <p>
                  <span className="font-medium text-primary">LinkedIn:</span>{" "}
                  {alumni.linkedin_url || "—"}
                </p>
              </div>
            </div>
          ) : null}

          {(alumni.academic.length > 0 || alumni.professional.length > 0) && (
            <div className="grid gap-4 border-t border-[#eef2f7] pt-5 sm:grid-cols-2">
              {alumni.academic.length > 0 ? (
                <div>
                  <h2 className="font-semibold text-primary">Academic</h2>
                  <ul className="mt-2 space-y-2 text-sm text-muted-foreground">
                    {alumni.academic.map((row, index) => (
                      <li key={`${row.degree_program_id}-${index}`}>
                        {degreeLabels.get(row.degree_program_id) ??
                          row.degree_program_id}
                        {row.graduation_year
                          ? ` · ${row.graduation_year}`
                          : ""}
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}
              {alumni.professional.length > 0 ? (
                <div>
                  <h2 className="font-semibold text-primary">Experience</h2>
                  <ul className="mt-2 space-y-2 text-sm text-muted-foreground">
                    {alumni.professional.map((row, index) => (
                      <li key={`${row.job_title}-${index}`}>
                        {row.job_title || row.role || "Role not specified"}
                        {row.current_company
                          ? ` · ${row.current_company}`
                          : ""}
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}
            </div>
          )}
        </div>

        <div className="flex flex-wrap justify-end gap-2 border-t border-[#eef2f7] px-5 py-4">
          <Link
            to="/directory"
            className="inline-flex h-9 items-center justify-center rounded-[11px] border border-border bg-background px-4 text-sm font-medium hover:bg-muted"
          >
            Close
          </Link>
          {alumni.alumni_id !== myAlumniId ? (
            alumni.is_contact_revealed ? (
              <Button type="button" className="rounded-[11px]" disabled>
                Connected
              </Button>
            ) : pending ? (
              <Button type="button" className="rounded-[11px]" disabled>
                Request pending
              </Button>
            ) : (
              <Button
                type="button"
                className="rounded-[11px]"
                onClick={() => {
                  setContactOpen(true)
                  setContactReason("")
                  setContactChannels(["email"])
                }}
              >
                Request contact
              </Button>
            )
          ) : null}
        </div>
      </article>

      <Dialog open={contactOpen} onOpenChange={setContactOpen}>
        <DialogContent
          showCloseButton={false}
          className="gap-0 overflow-hidden rounded-2xl p-0 sm:max-w-lg"
        >
          <div className="flex items-start justify-between gap-3 px-5 pt-5">
            <div>
              <DialogTitle className="text-lg font-semibold text-primary">
                Request contact information
              </DialogTitle>
              <DialogDescription className="mt-1.5 text-sm text-muted-foreground">
                Your request will be reviewed before consent is requested from
                the alumnus.
              </DialogDescription>
            </div>
            <button
              type="button"
              className="grid size-8 shrink-0 place-items-center rounded-full bg-[#f1f5f9] text-primary"
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
                className="text-sm font-semibold text-primary"
              >
                Purpose of request *
              </label>
              <Textarea
                id="detail-contact-reason"
                value={contactReason}
                onChange={(e) => setContactReason(e.target.value)}
                rows={4}
                placeholder="Explain why you would like to connect…"
                className="mt-2 min-h-28 rounded-xl border-[#e5eaf1]"
              />
            </div>

            <div>
              <p className="text-sm font-semibold text-primary">
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
                          ? "border-primary/30 bg-primary/[0.03] text-primary"
                          : "border-[#e5eaf1] text-primary",
                      )}
                    >
                      <span
                        className={cn(
                          "grid size-5 place-items-center rounded border",
                          checked
                            ? "border-primary bg-primary text-white"
                            : "border-[#c9d3e0] bg-white",
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

          <DialogFooter className="border-t border-[#eef2f7] px-5 py-4 sm:justify-end">
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
