import { Send } from "lucide-react"
import { useEffect, useMemo, useState } from "react"
import { Link } from "react-router-dom"
import { toast } from "sonner"

import { ApiError } from "@/lib/api-client"
import { catalogService } from "@/services/catalog.service"
import { contactRequestService } from "@/services/contact-requests.service"
import { directoryService } from "@/services/directory.service"
import { profileService } from "@/services/profile.service"
import type { DegreeProgram, DirectoryAlumni } from "@/types/portal"
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
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { cn } from "@/lib/utils"

const avatarTones = [
  "bg-sky-500/20 text-sky-300",
  "bg-emerald-500/20 text-emerald-300",
  "bg-orange-500/20 text-orange-300",
  "bg-rose-500/20 text-rose-300",
]

function initials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("")
}

function alumniSubtitle(
  alumni: DirectoryAlumni,
  degreeLabels: Map<string, string>,
) {
  const degreeId = alumni.academic[0]?.degree_program_id
  const degree =
    (degreeId ? degreeLabels.get(degreeId) : null)?.split(" — ")[0] ?? null
  const year =
    alumni.primary_graduation_year ?? alumni.academic[0]?.graduation_year ?? null
  const role =
    alumni.professional[0]?.job_title ??
    alumni.professional[0]?.role ??
    alumni.primary_role ??
    null
  const company = alumni.professional[0]?.current_company ?? null

  const academicLine = [degree, year ? `batch ${year}` : null]
    .filter(Boolean)
    .join(", ")
  const professionalLine = [role, company].filter(Boolean).join(" · ")

  return academicLine || professionalLine || "Alumni"
}

export function DirectoryPage() {
  const [items, setItems] = useState<DirectoryAlumni[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [pageSize] = useState(12)
  const [degreePrograms, setDegreePrograms] = useState<DegreeProgram[]>([])
  const [degreeLabels, setDegreeLabels] = useState<Map<string, string>>(
    new Map(),
  )

  const [name, setName] = useState("")
  const [graduationYear, setGraduationYear] = useState("")
  const [degreeProgramId, setDegreeProgramId] = useState("")
  const [city, setCity] = useState("")
  const [country, setCountry] = useState("")
  const [applied, setApplied] = useState({
    name: "",
    graduation_year: "",
    degree_program_id: "",
    city: "",
    country: "",
  })

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [myAlumniId, setMyAlumniId] = useState<string | null>(null)
  const [pendingTargets, setPendingTargets] = useState<Set<string>>(new Set())
  const [contactTarget, setContactTarget] = useState<DirectoryAlumni | null>(
    null,
  )
  const [contactReason, setContactReason] = useState(
    "I'd like to connect through the alumni portal.",
  )
  const [contactBusy, setContactBusy] = useState(false)

  useEffect(() => {
    void catalogService.listDegreePrograms().then((programs) => {
      setDegreePrograms(programs)
      setDegreeLabels(new Map(programs.map((p) => [p.id, p.label])))
    })
    void profileService.getMyProfile().then((profile) => {
      setMyAlumniId(profile.alumni_id)
    })
    void contactRequestService
      .listSent()
      .then((sent) => {
        setPendingTargets(
          new Set(
            sent
              .filter((r) =>
                [
                  "PENDING_ADMIN",
                  "PENDING_ALUMNI",
                  "APPROVED",
                  "PENDING",
                ].includes(r.status),
              )
              .map((r) => r.target_alumni_id),
          ),
        )
      })
      .catch(() => {
        /* directory still usable without sent-request status */
      })
  }, [])

  useEffect(() => {
    let cancelled = false
    async function load() {
      setLoading(true)
      setError("")
      try {
        const result = await directoryService.list({
          page,
          page_size: pageSize,
          name: applied.name || undefined,
          graduation_year: applied.graduation_year || undefined,
          degree_program_id: applied.degree_program_id || undefined,
          city: applied.city || undefined,
          country: applied.country || undefined,
        })
        if (cancelled) return
        setItems(result.items)
        setTotal(result.total)
      } catch (err) {
        if (!cancelled) {
          setError(
            err instanceof ApiError ? err.message : "Failed to load directory",
          )
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    void load()
    return () => {
      cancelled = true
    }
  }, [applied, page, pageSize])

  const totalPages = useMemo(
    () => Math.max(1, Math.ceil(total / pageSize)),
    [total, pageSize],
  )

  function applyFilters(event: React.FormEvent) {
    event.preventDefault()
    setPage(1)
    setApplied({
      name: name.trim(),
      graduation_year: graduationYear.trim(),
      degree_program_id: degreeProgramId,
      city: city.trim(),
      country: country.trim(),
    })
  }

  function clearFilters() {
    setName("")
    setGraduationYear("")
    setDegreeProgramId("")
    setCity("")
    setCountry("")
    setPage(1)
    setApplied({
      name: "",
      graduation_year: "",
      degree_program_id: "",
      city: "",
      country: "",
    })
  }

  async function submitContactRequest() {
    if (!contactTarget) return
    setContactBusy(true)
    try {
      await contactRequestService.create({
        target_alumni_id: contactTarget.alumni_id,
        request_reason: contactReason.trim() || "Alumni connection request",
      })
      setPendingTargets((prev) => new Set(prev).add(contactTarget.alumni_id))
      toast.success("Contact request sent")
      setContactTarget(null)
    } catch (err) {
      toast.error(
        err instanceof ApiError ? err.message : "Failed to send request",
      )
    } finally {
      setContactBusy(false)
    }
  }

  return (
    <div className="mx-auto max-w-3xl space-y-4">
      <div>
        <h1 className="font-display text-2xl font-semibold tracking-tight">
          Directory
        </h1>
        <p className="text-sm text-muted-foreground">
          {total.toLocaleString()} alumni in your network
        </p>
      </div>

      <form
        onSubmit={applyFilters}
        className="grid gap-2 rounded-lg border border-border bg-card p-3 sm:grid-cols-2 lg:grid-cols-3"
      >
          <Input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Name"
          />
          <Input
            value={graduationYear}
            onChange={(e) => setGraduationYear(e.target.value)}
            placeholder="Graduation year"
          />
          <select
            className="h-8 rounded-lg border border-input bg-transparent px-2.5 text-sm"
            value={degreeProgramId}
            onChange={(e) => setDegreeProgramId(e.target.value)}
          >
            <option value="">All degree programs</option>
            {degreePrograms.map((program) => (
              <option key={program.id} value={program.id}>
                {program.label}
              </option>
            ))}
          </select>
          <Input
            value={city}
            onChange={(e) => setCity(e.target.value)}
            placeholder="City"
          />
          <Input
            value={country}
            onChange={(e) => setCountry(e.target.value)}
            placeholder="Country"
          />
          <div className="flex gap-2">
            <Button type="submit" className="flex-1">
              Filter
            </Button>
            <Button type="button" variant="outline" onClick={clearFilters}>
              Clear
            </Button>
          </div>
      </form>

      {loading ? (
        <div className="overflow-hidden rounded-lg border border-border bg-card">
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className="h-[76px] animate-pulse border-b border-border bg-muted/40 last:border-b-0"
            />
          ))}
        </div>
      ) : error ? (
        <Card>
          <CardHeader>
            <CardTitle>Directory unavailable</CardTitle>
            <CardDescription>{error}</CardDescription>
          </CardHeader>
        </Card>
      ) : items.length === 0 ? (
        <div className="rounded-lg border border-border bg-card p-8 text-center text-sm text-muted-foreground">
          No alumni found.
        </div>
      ) : (
        <>
          <div className="overflow-hidden rounded-lg border border-border bg-card">
            {items.map((alumni, index) => {
              const isSelf = alumni.alumni_id === myAlumniId
              const connected = alumni.is_contact_revealed
              const pending = pendingTargets.has(alumni.alumni_id)

              return (
                <div
                  key={alumni.alumni_id}
                  className={cn(
                    "flex items-center gap-3 px-4 py-3",
                    index < items.length - 1 && "border-b border-border",
                  )}
                >
                  <Link
                    to={`/directory/${alumni.alumni_id}`}
                    className="flex min-w-0 flex-1 items-start gap-3"
                  >
                    {alumni.photo_url ? (
                      <img
                        src={alumni.photo_url}
                        alt=""
                        className="size-12 rounded-full object-cover"
                      />
                    ) : (
                      <div
                        className={cn(
                          "flex size-12 items-center justify-center rounded-full text-sm font-semibold",
                          avatarTones[index % avatarTones.length],
                        )}
                      >
                        {initials(alumni.full_name)}
                      </div>
                    )}
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-semibold hover:underline">
                        {alumni.full_name}
                      </p>
                      <p className="truncate text-sm text-muted-foreground">
                        {alumniSubtitle(alumni, degreeLabels)}
                      </p>
                      <p className="mt-0.5 truncate text-xs text-muted-foreground">
                        {[alumni.city, alumni.country]
                          .filter(Boolean)
                          .join(", ") || "Location unavailable"}
                      </p>
                    </div>
                  </Link>

                  {!isSelf ? (
                    <div className="shrink-0">
                      {connected ? (
                        <span className="text-xs font-medium text-emerald-600 dark:text-emerald-400">
                          Connected
                        </span>
                      ) : pending ? (
                        <span className="rounded-full bg-muted px-2.5 py-1 text-xs font-medium text-muted-foreground">
                          Pending
                        </span>
                      ) : (
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-8 gap-1.5 rounded-full px-3"
                          onClick={() => setContactTarget(alumni)}
                        >
                          <Send className="size-3.5" />
                          <span className="hidden sm:inline">
                            Send contact request
                          </span>
                          <span className="sm:hidden">Connect</span>
                        </Button>
                      )}
                    </div>
                  ) : null}
                </div>
              )
            })}
          </div>

          <div className="flex items-center justify-between gap-3">
            <p className="text-sm text-muted-foreground">
              Page {page} of {totalPages}
            </p>
            <div className="flex gap-2">
              <Button
                variant="outline"
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
              >
                Previous
              </Button>
              <Button
                variant="outline"
                disabled={page >= totalPages}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              >
                Next
              </Button>
            </div>
          </div>
        </>
      )}

      <Dialog
        open={Boolean(contactTarget)}
        onOpenChange={(open) => {
          if (!open) setContactTarget(null)
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Send contact request</DialogTitle>
            <DialogDescription>
              {contactTarget
                ? `Connect with ${contactTarget.full_name}. An admin may review before contact details are shared.`
                : null}
            </DialogDescription>
          </DialogHeader>
          <Textarea
            value={contactReason}
            onChange={(e) => setContactReason(e.target.value)}
            rows={4}
            placeholder="Why would you like to connect?"
          />
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setContactTarget(null)}
              disabled={contactBusy}
            >
              Cancel
            </Button>
            <Button
              onClick={() => void submitContactRequest()}
              disabled={contactBusy || !contactReason.trim()}
            >
              {contactBusy ? "Sending…" : "Send request"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
