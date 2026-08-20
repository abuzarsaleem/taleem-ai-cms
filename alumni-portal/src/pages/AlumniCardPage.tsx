import { Download, IdCard, Loader2, Printer, ShieldCheck } from "lucide-react"
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
    <div className="relative mx-auto max-w-6xl space-y-8">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-44 overflow-hidden rounded-[1.5rem] opacity-90"
      >
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(54,186,188,0.14),transparent_55%),radial-gradient(ellipse_at_top_left,rgba(8,27,69,0.07),transparent_50%)]" />
      </div>

      <div className="relative">
        <PageHeader
          eyebrow="Verified identity"
          title="Digital Alumni ID"
          description="Credit-card sized digital identity. Download as PDF for print or wallet use."
          actions={
            <div className="flex flex-wrap gap-2.5">
              <Button
                type="button"
                className="no-print gap-1.5 rounded-xl shadow-[0_10px_22px_rgba(8,27,69,0.16)]"
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
              <Button
                type="button"
                variant="outline"
                className="no-print gap-1.5 rounded-xl"
                onClick={() => window.print()}
              >
                <Printer className="size-4" />
                Print
              </Button>
              <Link
                to="/profile"
                className={cn(
                  buttonVariants({ variant: "outline" }),
                  "no-print rounded-xl",
                )}
              >
                Edit profile
              </Link>
            </div>
          }
        />
      </div>

      <div className="relative grid items-start gap-6 lg:grid-cols-[1.15fr_0.85fr]">
        <div
          id="printable-alumni-card"
          className="relative flex justify-center rounded-[1.5rem] border border-[#e6ecf4] bg-[#f4f7fb] p-7 sm:p-10"
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

        <aside className="overflow-hidden rounded-[1.35rem] border border-[#e6ecf4] bg-white shadow-[0_14px_40px_rgba(8,27,69,0.06)]">
          <div className="border-b border-[#eef2f7] bg-[#f8fafc] px-5 py-4">
            <div className="flex items-center gap-2.5">
              <span className="grid size-9 place-items-center rounded-xl bg-primary/5 text-primary ring-1 ring-primary/10">
                <IdCard className="size-4" />
              </span>
              <div>
                <h3 className="font-semibold text-primary">
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
                className="flex items-center justify-between gap-3 border-b border-[#eef2f7] py-3.5"
              >
                <dt className="text-muted-foreground">{label}</dt>
                <dd className="font-semibold text-primary">{value}</dd>
              </div>
            ))}
            <div className="flex items-center justify-between gap-3 border-b border-[#eef2f7] py-3.5">
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

          <div className="mx-5 mb-5 rounded-2xl border border-[#d7f0ee] bg-gradient-to-br from-[#f3fbfb] to-[#eef8f8] p-4">
            <div className="flex items-start gap-2.5">
              <ShieldCheck className="mt-0.5 size-4 shrink-0 text-[#1e8f97]" />
              <div>
                <p className="text-sm font-semibold text-primary">
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
