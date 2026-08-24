import { Download, IdCard, Loader2, ShieldCheck } from "lucide-react"
import { useEffect, useState } from "react"
import { Link } from "react-router-dom"
import { toast } from "sonner"

import { AlumniIdCard } from "@/components/alumni-id-card"
import { PageHeader } from "@/components/portal/page-header"
import { StatusPill } from "@/components/portal/status-pill"
import { Button, buttonVariants } from "@/components/ui/button"
import { ApiError } from "@/lib/api-client"
import { downloadAlumniCardPdf } from "@/lib/download-alumni-card-pdf"
import { cn } from "@/lib/utils"
import { catalogService } from "@/services/catalog.service"
import { profileService } from "@/services/profile.service"
import type { AlumniProfile } from "@/types/portal"

export function AlumniCardPage() {
  const [profile, setProfile] = useState<AlumniProfile | null>(null)
  const [degreeLabels, setDegreeLabels] = useState<Map<string, string>>(
    new Map(),
  )
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [pdfBusy, setPdfBusy] = useState(false)

  async function load() {
    setLoading(true)
    setError("")
    try {
      const [nextProfile, labels] = await Promise.all([
        profileService.getMyProfile(),
        catalogService.getDegreeProgramMap(),
      ])
      setProfile(nextProfile)
      setDegreeLabels(labels)
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to load card")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void load()
  }, [])

  async function onDownloadPdf() {
    if (!profile) return
    setPdfBusy(true)
    try {
      const primary =
        profile.academic.find((row) => row.is_verification) ??
        profile.academic[0]
      const degree = primary
        ? (degreeLabels.get(primary.degree_program_id) ?? null)
        : null
      const campusFromDegree = degree?.includes(" — ")
        ? degree.split(" — ").slice(1).join(" — ")
        : null
      const safeName = profile.full_name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, "")
      await downloadAlumniCardPdf(
        {
          fullName: profile.full_name,
          photoUrl: profile.photo_url,
          degreeLabel: degree,
          graduationYear: primary?.graduation_year ?? null,
          registrationRollNumber: primary?.registration_roll_number ?? null,
          campus: campusFromDegree,
          cnic: profile.cnic_national_id,
          alumniId: profile.public_alumni_code || profile.alumni_id,
          qrCodeUrl: profile.qr_code,
        },
        `alumni-id-${safeName || "card"}.pdf`,
      )
      toast.success("PDF downloaded")
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Could not create PDF",
      )
    } finally {
      setPdfBusy(false)
    }
  }

  if (loading) {
    return (
      <div className="h-72 animate-pulse rounded-[1.35rem] bg-gradient-to-br from-[#e4ebf5] to-[#edf2f8]" />
    )
  }

  if (error || !profile) {
    return (
      <div className="portal-card p-6">
        <h2 className="font-semibold">Digital ID unavailable</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          {error || "Not found"}
        </p>
        <Button className="mt-4 rounded-[11px]" onClick={() => void load()}>
          Retry
        </Button>
      </div>
    )
  }

  const primaryAcademic =
    profile.academic.find((row) => row.is_verification) ?? profile.academic[0]
  const degreeLabel = primaryAcademic
    ? (degreeLabels.get(primaryAcademic.degree_program_id) ?? null)
    : null
  const campus = degreeLabel?.includes(" — ")
    ? degreeLabel.split(" — ").slice(1).join(" — ")
    : null

  return (
    <div className="space-y-8">
      <PageHeader
        tone="hero"
        eyebrow="Verified identity"
        title="Digital Alumni ID"
        description="Credit-card sized digital identity. Download as PDF for print or wallet use."
        actions={
          <div className="flex flex-wrap gap-2.5">
            <Button
              type="button"
              className="no-print gap-1.5 rounded-xl border-0 bg-accent font-semibold text-accent-foreground shadow-[0_10px_22px_rgba(8,27,69,0.16)] hover:bg-accent/90"
              disabled={pdfBusy}
              onClick={() => void onDownloadPdf()}
            >
              {pdfBusy ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <Download className="size-4" />
              )}
              {pdfBusy ? "Preparing…" : "Download PDF"}
            </Button>
            <Link
              to="/profile"
              className={cn(
                buttonVariants({ variant: "outline" }),
                "no-print rounded-xl border-white/25 bg-white/10 text-white hover:bg-white/15 hover:text-white",
              )}
            >
              Edit profile
            </Link>
          </div>
        }
      />

      <div className="relative mx-auto grid max-w-6xl items-start gap-6 lg:grid-cols-[1.15fr_0.85fr]">
        <div
          id="printable-alumni-card"
          className="relative flex justify-center rounded-[1.5rem] border border-border bg-muted/50 p-4 sm:p-10"
        >
          <AlumniIdCard
            data={{
              fullName: profile.full_name,
              photoUrl: profile.photo_url,
              degreeLabel,
              graduationYear: primaryAcademic?.graduation_year ?? null,
              registrationRollNumber:
                primaryAcademic?.registration_roll_number ?? null,
              campus,
              cnic: profile.cnic_national_id,
              alumniId: profile.public_alumni_code || profile.alumni_id,
            }}
            showQr
            qrCodeUrl={profile.qr_code}
          />
        </div>

        <aside className="overflow-hidden rounded-[1.35rem] border border-border bg-card text-card-foreground shadow-[var(--portal-shadow)]">
          <div className="border-b border-border bg-muted/40 px-5 py-4">
            <div className="flex items-center gap-2.5">
              <span className="grid size-9 place-items-center rounded-xl bg-primary/10 text-foreground ring-1 ring-primary/15">
                <IdCard className="size-4" />
              </span>
              <div>
                <h3 className="font-semibold text-foreground">
                  Identity information
                </h3>
                <p className="text-xs text-muted-foreground">
                  CR80 print-ready card details
                </p>
              </div>
            </div>
          </div>

          <dl className="space-y-0 px-5 py-2 text-sm">
            {(
              [
                ["Card size", "85.6 × 53.98 mm (CR80)"],
                [
                  "Alumni ID",
                  profile.public_alumni_code ||
                    profile.alumni_id.slice(0, 8).toUpperCase(),
                ],
              ] as const
            ).map(([label, value]) => (
              <div
                key={label}
                className="flex items-center justify-between gap-3 border-b border-border py-3.5"
              >
                <dt className="text-muted-foreground">{label}</dt>
                <dd className="font-semibold text-foreground">{value}</dd>
              </div>
            ))}
            <div className="flex items-center justify-between gap-3 border-b border-border py-3.5">
              <dt className="text-muted-foreground">Identity status</dt>
              <dd>
                <StatusPill variant="success">Active</StatusPill>
              </dd>
            </div>
            <div className="flex items-center justify-between gap-3 py-3.5">
              <dt className="text-muted-foreground">QR verification</dt>
              <dd>
                <StatusPill variant="info">
                  {profile.alumni_id ? "Enabled" : "Pending"}
                </StatusPill>
              </dd>
            </div>
          </dl>

          <div className="mx-5 mb-5 rounded-2xl border border-accent/25 bg-accent/10 p-4">
            <div className="flex items-start gap-2.5">
              <ShieldCheck className="mt-0.5 size-4 shrink-0 text-accent" />
              <div>
                <p className="text-sm font-semibold text-foreground">
                  Campus access
                </p>
                <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                  Present this Digital Alumni Identity to authorized campus
                  personnel. Download the PDF for a print-ready CR80 card.
                </p>
              </div>
            </div>
          </div>
        </aside>
      </div>
    </div>
  )
}
