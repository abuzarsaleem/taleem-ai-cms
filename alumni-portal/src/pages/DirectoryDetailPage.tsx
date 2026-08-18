import { useEffect, useState } from "react"
import { useParams } from "react-router-dom"
import { toast } from "sonner"

import { PageBreadcrumb } from "@/components/page-breadcrumb"
import { ApiError } from "@/lib/api-client"
import { catalogService } from "@/services/catalog.service"
import { contactRequestService } from "@/services/contact-requests.service"
import { directoryService } from "@/services/directory.service"
import type { DirectoryAlumni } from "@/types/portal"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"

export function DirectoryDetailPage() {
  const { alumniId = "" } = useParams()
  const [alumni, setAlumni] = useState<DirectoryAlumni | null>(null)
  const [degreeLabels, setDegreeLabels] = useState<Map<string, string>>(
    new Map(),
  )
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(true)
  const [reason, setReason] = useState("")
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    void catalogService.getDegreeProgramMap().then(setDegreeLabels)
  }, [])

  useEffect(() => {
    let cancelled = false
    async function load() {
      setLoading(true)
      setError("")
      try {
        const data = await directoryService.getOne(alumniId)
        if (!cancelled) setAlumni(data)
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

  async function requestContact() {
    if (!alumni) return
    setSubmitting(true)
    try {
      await contactRequestService.create({
        target_alumni_id: alumni.alumni_id,
        request_reason: reason.trim(),
      })
      toast.success("Contact request submitted")
      setReason("")
    } catch (err) {
      toast.error(
        err instanceof ApiError ? err.message : "Failed to submit request",
      )
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return <div className="h-56 animate-pulse rounded-xl bg-muted" />
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

  return (
    <div className="space-y-4">
      <PageBreadcrumb
        current={alumni.full_name}
        fallback={{ label: "Directory", to: "/directory" }}
      />

      <Card>
        <CardHeader className="flex-row items-center gap-4">
          {alumni.photo_url ? (
            <img
              src={alumni.photo_url}
              alt={alumni.full_name}
              className="size-20 rounded-full object-cover"
            />
          ) : (
            <div className="flex size-20 items-center justify-center rounded-full bg-primary/15 text-xl font-semibold text-primary">
              {alumni.full_name
                .split(/\s+/)
                .slice(0, 2)
                .map((p) => p[0])
                .join("")}
            </div>
          )}
          <div>
            <CardTitle className="text-2xl">{alumni.full_name}</CardTitle>
            <CardDescription>
              {[alumni.city, alumni.country].filter(Boolean).join(", ") ||
                "Location unavailable"}
            </CardDescription>
          </div>
        </CardHeader>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Contact</CardTitle>
          <CardDescription>
            {alumni.is_contact_revealed
              ? "Contact details are visible for this alumni."
              : "Contact details are masked until a request is approved."}
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-2 text-sm sm:grid-cols-2">
          <p>
            <span className="font-medium">Email:</span> {alumni.email || "—"}
          </p>
          <p>
            <span className="font-medium">Phone:</span>{" "}
            {alumni.phone_number || "—"}
          </p>
          <p>
            <span className="font-medium">WhatsApp:</span>{" "}
            {alumni.whatsapp_number || "—"}
          </p>
          <p>
            <span className="font-medium">LinkedIn:</span>{" "}
            {alumni.linkedin_url || "—"}
          </p>
          <p className="sm:col-span-2">
            <span className="font-medium">Address:</span>{" "}
            {[alumni.address, alumni.secondry_address]
              .filter(Boolean)
              .join(" / ") || "—"}
          </p>
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Academic information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            {alumni.academic.length === 0 ? (
              <p className="text-muted-foreground">No academic records</p>
            ) : (
              alumni.academic.map((row, index) => (
                <div
                  key={`${row.degree_program_id}-${index}`}
                  className="rounded-lg border border-border/70 p-3"
                >
                  <p className="font-medium">
                    {degreeLabels.get(row.degree_program_id) ??
                      row.degree_program_id}
                  </p>
                  <p className="text-muted-foreground">
                    Graduation year: {row.graduation_year}
                  </p>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Professional information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            {alumni.professional.length === 0 ? (
              <p className="text-muted-foreground">No professional records</p>
            ) : (
              alumni.professional.map((row, index) => (
                <div
                  key={`${row.job_title}-${index}`}
                  className="rounded-lg border border-border/70 p-3"
                >
                  <p className="font-medium">
                    {row.job_title || row.role || "Role not specified"}
                  </p>
                  {row.role && row.job_title ? (
                    <p className="text-muted-foreground">Role: {row.role}</p>
                  ) : null}
                  <p className="text-muted-foreground">
                    {row.current_company || "Company not specified"}
                  </p>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>

      {!alumni.is_contact_revealed ? (
        <Card>
          <CardHeader>
            <CardTitle>Request contact access</CardTitle>
            <CardDescription>
              An admin must approve your request before contact details are
              revealed.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Why do you want to connect?"
              minLength={5}
            />
            <Button
              disabled={submitting || reason.trim().length < 5}
              onClick={() => void requestContact()}
            >
              {submitting ? "Submitting…" : "Submit request"}
            </Button>
          </CardContent>
        </Card>
      ) : null}
    </div>
  )
}
