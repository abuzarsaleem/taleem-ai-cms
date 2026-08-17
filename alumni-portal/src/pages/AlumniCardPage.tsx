import { useEffect, useState } from "react"
import { Link } from "react-router-dom"

import { AlumniIdCard } from "@/components/alumni-id-card"
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
    ? (degreeLabels.get(primaryAcademic.degree_program_id) ?? null)
    : null

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

      <AlumniIdCard
        data={{
          fullName: profile.full_name,
          photoUrl: profile.photo_url,
          degreeLabel,
          graduationYear: primaryAcademic?.graduation_year ?? null,
          registrationRollNumber:
            primaryAcademic?.registration_roll_number ?? null,
        }}
        showQr
        qrCodeUrl={profile.qr_code}
      />

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
