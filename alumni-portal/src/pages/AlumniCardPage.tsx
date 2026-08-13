import { GraduationCap } from "lucide-react"
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

function CornerAccents() {
  return (
    <>
      {/* Top-left */}
      <div className="pointer-events-none absolute top-0 left-0" aria-hidden>
        <div className="absolute top-0 left-0 h-[72px] w-[18px] bg-[#0b4d3c]" />
        <div className="absolute top-0 left-[22px] h-[18px] w-[72px] bg-[#0b4d3c]" />
        <div className="absolute top-[6px] left-[6px] h-[52px] w-[8px] bg-[#c9a227]" />
        <div className="absolute top-[6px] left-[6px] h-[8px] w-[52px] bg-[#c9a227]" />
      </div>
      {/* Top-right */}
      <div className="pointer-events-none absolute top-0 right-0" aria-hidden>
        <div className="absolute top-0 right-0 h-[72px] w-[18px] bg-[#0b4d3c]" />
        <div className="absolute top-0 right-[22px] h-[18px] w-[72px] bg-[#0b4d3c]" />
        <div className="absolute top-[6px] right-[6px] h-[52px] w-[8px] bg-[#c9a227]" />
        <div className="absolute top-[6px] right-[6px] h-[8px] w-[52px] bg-[#c9a227]" />
      </div>
      {/* Bottom-left */}
      <div className="pointer-events-none absolute bottom-0 left-0" aria-hidden>
        <div className="absolute bottom-0 left-0 h-[72px] w-[18px] bg-[#0b4d3c]" />
        <div className="absolute bottom-0 left-[22px] h-[18px] w-[72px] bg-[#0b4d3c]" />
        <div className="absolute bottom-[6px] left-[6px] h-[52px] w-[8px] bg-[#c9a227]" />
        <div className="absolute bottom-[6px] left-[6px] h-[8px] w-[52px] bg-[#c9a227]" />
      </div>
      {/* Bottom-right */}
      <div className="pointer-events-none absolute right-0 bottom-0" aria-hidden>
        <div className="absolute right-0 bottom-0 h-[72px] w-[18px] bg-[#0b4d3c]" />
        <div className="absolute right-[22px] bottom-0 h-[18px] w-[72px] bg-[#0b4d3c]" />
        <div className="absolute right-[6px] bottom-[6px] h-[52px] w-[8px] bg-[#c9a227]" />
        <div className="absolute right-[6px] bottom-[6px] h-[8px] w-[52px] bg-[#c9a227]" />
      </div>
    </>
  )
}

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
    ? (degreeLabels.get(primaryAcademic.degree_program_id) ?? null)
    : null
  const degreeShort =
    degreeLabel?.split(" — ")[0] ??
    degreeLabel ??
    "Alumni member"
  const hasQr = Boolean(profile.qr_code)
  const initials = profile.full_name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("")

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h1 className="font-display text-2xl font-semibold tracking-tight">
          Alumni card
        </h1>
        <p className="text-sm text-muted-foreground">
          Digital ID from your profile photo, academic details, and QR
        </p>
      </div>

      <div className="mx-auto w-full max-w-[340px]">
        <div
          className="relative overflow-hidden rounded-[14px] bg-white"
          style={{
            aspectRatio: "54 / 86",
            boxShadow:
              "0 1px 0 rgba(255,255,255,0.9) inset, 0 18px 40px -20px rgba(11,77,60,0.45), 0 6px 16px rgba(15,23,42,0.08)",
          }}
        >
          <CornerAccents />

          <div className="relative flex h-full flex-col items-center px-7 pt-9 pb-8">
            {/* Brand header */}
            <div className="flex w-full items-center justify-between gap-3">
              <div className="flex size-11 shrink-0 items-center justify-center rounded-full bg-[#0b4d3c] text-[#c9a227] shadow-sm">
                <GraduationCap className="size-5" strokeWidth={2.25} />
              </div>
              <div className="min-w-0 text-right">
                <p className="font-display text-[17px] leading-none font-bold tracking-[0.04em] text-[#0b4d3c] uppercase">
                  Taleem
                </p>
                <p className="mt-1 text-[10px] font-semibold tracking-[0.22em] text-[#0b4d3c]/80 uppercase">
                  Alumni
                </p>
              </div>
            </div>

            {/* Portrait */}
            <div className="mt-8">
              {profile.photo_url ? (
                <img
                  src={profile.photo_url}
                  alt={profile.full_name}
                  className="size-[118px] rounded-full object-cover ring-[3px] ring-[#0b4d3c]"
                />
              ) : (
                <div className="flex size-[118px] items-center justify-center rounded-full bg-[#0b4d3c]/10 text-3xl font-semibold text-[#0b4d3c] ring-[3px] ring-[#0b4d3c]">
                  {initials}
                </div>
              )}
            </div>

            {/* Identity */}
            <div className="mt-5 w-full text-center">
              <h2 className="text-[20px] leading-tight font-bold tracking-wide text-[#0b4d3c] uppercase">
                {profile.full_name}
              </h2>
              <p className="mt-2 text-[11px] font-medium tracking-[0.18em] text-[#0b4d3c]/75 uppercase">
                {degreeShort}
                {primaryAcademic?.graduation_year
                  ? ` · ${primaryAcademic.graduation_year}`
                  : ""}
              </p>
              {primaryAcademic?.registration_roll_number ? (
                <p className="mt-1.5 text-[11px] text-[#0b4d3c]/55">
                  Roll # {primaryAcademic.registration_roll_number}
                </p>
              ) : null}
            </div>

            {/* QR */}
            <div className="mt-auto flex flex-col items-center pt-5">
              <div className="rounded-md bg-white p-1.5 ring-1 ring-[#0b4d3c]/15">
                {hasQr ? (
                  <img
                    src={profile.qr_code!}
                    alt="Alumni verification QR"
                    className="size-[108px]"
                  />
                ) : (
                  <div className="flex size-[108px] items-center justify-center bg-[#0b4d3c]/5 px-3 text-center text-[11px] leading-snug text-[#0b4d3c]/60">
                    QR not issued yet
                  </div>
                )}
              </div>

              <p className="mt-4 text-[15px] font-bold tracking-[0.28em] text-[#0b4d3c] uppercase">
                Alumni
              </p>
              <p className="mt-1 text-[10px] tracking-wide text-[#0b4d3c]/45">
                {hasQr
                  ? "Scan to verify identity"
                  : "Issued after university approval"}
              </p>
            </div>
          </div>
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
