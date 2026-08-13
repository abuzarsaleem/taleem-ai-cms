import { IdCard } from "lucide-react"
import { useEffect, useState } from "react"
import { Link } from "react-router-dom"

import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { ApiError } from "@/lib/api-client"
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

  if (loading) {
    return <div className="h-72 animate-pulse rounded-xl bg-muted" />
  }

  if (error || !profile) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Alumni card unavailable</CardTitle>
          <CardDescription>{error || "Not found"}</CardDescription>
        </CardHeader>
        <CardContent>
          <Button onClick={() => void load()}>Retry</Button>
        </CardContent>
      </Card>
    )
  }

  const primaryAcademic =
    profile.academic.find((row) => row.is_verification) ?? profile.academic[0]
  const degreeLabel = primaryAcademic
    ? (degreeLabels.get(primaryAcademic.degree_program_id) ?? "Degree program")
    : null
  const hasQr = Boolean(profile.qr_code)

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Alumni card</h1>
        <p className="text-sm text-muted-foreground">
          Digital ID from your profile photo, academic details, and QR
        </p>
      </div>

      <div className="overflow-hidden rounded-2xl border border-border bg-gradient-to-br from-slate-900 via-slate-800 to-teal-900 text-white shadow-lg">
        <div className="flex items-center justify-between border-b border-white/10 px-5 py-3 text-xs uppercase tracking-[0.18em] text-white/70">
          <span className="inline-flex items-center gap-2">
            <IdCard className="size-3.5" />
            Taleem Alumni
          </span>
          <span>{profile.status}</span>
        </div>

        <div className="grid gap-6 p-5 sm:grid-cols-[1fr_auto] sm:items-center">
          <div className="flex gap-4">
            {profile.photo_url ? (
              <img
                src={profile.photo_url}
                alt={profile.full_name}
                className="size-24 shrink-0 rounded-xl object-cover ring-2 ring-white/20"
              />
            ) : (
              <div className="flex size-24 shrink-0 items-center justify-center rounded-xl bg-white/10 text-xl font-semibold">
                {profile.full_name
                  .split(/\s+/)
                  .slice(0, 2)
                  .map((p) => p[0])
                  .join("")}
              </div>
            )}
            <div className="min-w-0 space-y-1">
              <h2 className="text-xl font-semibold leading-tight">
                {profile.full_name}
              </h2>
              <p className="truncate text-sm text-white/75">{profile.email}</p>
              {degreeLabel ? (
                <p className="text-sm text-teal-200">
                  {degreeLabel}
                  {primaryAcademic?.graduation_year
                    ? ` · Class of ${primaryAcademic.graduation_year}`
                    : null}
                </p>
              ) : (
                <p className="text-sm text-white/60">
                  Add academic details on{" "}
                  <Link to="/profile" className="underline underline-offset-2">
                    Profile
                  </Link>
                </p>
              )}
              {primaryAcademic?.registration_roll_number ? (
                <p className="text-xs text-white/55">
                  Roll # {primaryAcademic.registration_roll_number}
                </p>
              ) : null}
              {(profile.city || profile.country) && (
                <p className="text-xs text-white/55">
                  {[profile.city, profile.country].filter(Boolean).join(", ")}
                </p>
              )}
            </div>
          </div>

          <div className="justify-self-center rounded-xl bg-white p-3 shadow-inner">
            {hasQr ? (
              <img
                src={profile.qr_code!}
                alt="Alumni verification QR"
                className="size-32"
              />
            ) : (
              <div className="flex size-32 items-center justify-center bg-slate-100 px-2 text-center text-xs text-slate-500">
                QR not issued yet
              </div>
            )}
          </div>
        </div>

        <div className="border-t border-white/10 px-5 py-3 text-xs text-white/55">
          {hasQr
            ? "Scan the QR to verify alumni identity"
            : "Your QR is created when the alumni card is issued by the university"}
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Card details</CardTitle>
          <CardDescription>
            Rendered from your profile. Update personal or academic info under
            Settings.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Link
            to="/profile"
            className="inline-flex h-7 items-center rounded-lg border border-border bg-background px-2.5 text-[0.8rem] font-medium hover:bg-muted"
          >
            Edit profile
          </Link>
        </CardContent>
      </Card>
    </div>
  )
}
