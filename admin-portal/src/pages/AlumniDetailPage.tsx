import { useEffect, useState } from "react"
import { Link, useLocation, useNavigate, useParams } from "react-router-dom"
import { ArrowLeftIcon, UserIcon } from "lucide-react"

import { useAuth } from "@/auth/AuthContext"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { ApiError } from "@/lib/api"
import { degreeProgramLabel } from "@/lib/registration-utils"
import {
  alumniService,
  type AdminAlumniListItem,
  type DirectoryAlumniProfile,
} from "@/services/alumni.service"

type LocationState = {
  alumni?: AdminAlumniListItem
}

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

function programFromList(item: AdminAlumniListItem | null) {
  if (!item?.degree_program) {
    return item?.degree_program_id
      ? degreeProgramLabel(item.degree_program_id)
      : "—"
  }
  const campus = item.degree_program.campus
    ? ` — ${item.degree_program.campus}`
    : ""
  return `${item.degree_program.degree} ${item.degree_program.program}${campus}`
}

export default function AlumniDetailPage() {
  const { id } = useParams()
  const { token } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const stateAlumni = (location.state as LocationState | null)?.alumni ?? null

  const [listItem, setListItem] = useState<AdminAlumniListItem | null>(
    stateAlumni && stateAlumni.alumni_id === id ? stateAlumni : null,
  )
  const [profile, setProfile] = useState<DirectoryAlumniProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  useEffect(() => {
    if (!token || !id) return

    let cancelled = false

    void (async () => {
      setLoading(true)
      setError("")

      let nextListItem =
        stateAlumni && stateAlumni.alumni_id === id ? stateAlumni : null

      try {
        if (!nextListItem) {
          const listed = await alumniService.list(token, {
            page: 1,
            page_size: 100,
          })
          nextListItem =
            listed.items.find((item) => item.alumni_id === id) ?? null
        }

        if (!cancelled) setListItem(nextListItem)

        try {
          const directoryProfile = await alumniService.getDirectoryProfile(
            token,
            id,
          )
          if (!cancelled) setProfile(directoryProfile)
        } catch {
          // Directory endpoint is alumni-scoped; admin list data is enough.
          if (!cancelled) setProfile(null)
        }

        if (!cancelled && !nextListItem) {
          setError("Alumni not found")
        }
      } catch (err) {
        if (!cancelled) {
          setError(
            err instanceof ApiError ? err.message : "Failed to load alumni",
          )
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()

    return () => {
      cancelled = true
    }
  }, [token, id, stateAlumni])

  if (loading) return <DetailSkeleton />

  const name = profile?.full_name ?? listItem?.full_name
  const email = profile?.email ?? listItem?.email
  const photoUrl = profile?.photo_url ?? listItem?.photo_url ?? null

  if (!name) {
    return (
      <div className="flex flex-1 flex-col gap-4 px-4 py-6 lg:px-6">
        <Button
          variant="outline"
          size="sm"
          className="w-fit"
          render={<Link to="/alumni" />}
        >
          <ArrowLeftIcon />
          Back to directory
        </Button>
        <p className="text-sm text-destructive">
          {error || "Alumni not found"}
        </p>
      </div>
    )
  }

  const phone = profile?.phone_number ?? listItem?.phone_number
  const whatsapp = profile?.whatsapp_number ?? listItem?.whatsapp_number
  const city = profile?.city ?? listItem?.city
  const country = profile?.country ?? listItem?.country
  const graduationYear =
    profile?.primary_graduation_year ??
    profile?.academic?.[0]?.graduation_year ??
    listItem?.graduation_year
  const professional =
    profile?.professional?.[0] ?? listItem?.professional ?? null

  return (
    <div className="flex flex-1 flex-col gap-4 py-4 md:gap-6 md:py-6">
      <div className="flex flex-col gap-3 px-4 lg:px-6">
        <Button
          variant="outline"
          size="sm"
          className="w-fit"
          onClick={() => navigate("/alumni")}
        >
          <ArrowLeftIcon />
          Back
        </Button>
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight">{name}</h1>
            {profile?.is_contact_revealed ? (
              <Badge variant="secondary">Contacts visible</Badge>
            ) : null}
          </div>
          <p className="text-muted-foreground">{email}</p>
        </div>
      </div>

      <div className="grid gap-4 px-4 lg:grid-cols-3 lg:px-6">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Alumni profile</CardTitle>
            <CardDescription>Directory and contact details</CardDescription>
          </CardHeader>
          <CardContent>
            <dl>
              <DetailRow label="Full name" value={name} />
              <DetailRow label="Email" value={email} />
              <DetailRow label="Phone" value={phone} />
              <DetailRow label="WhatsApp" value={whatsapp} />
              <DetailRow
                label="Location"
                value={[city, country].filter(Boolean).join(", ")}
              />
              <DetailRow label="Address" value={profile?.address} />
              <DetailRow
                label="Secondary address"
                value={profile?.secondry_address}
              />
              <DetailRow
                label="LinkedIn"
                value={
                  profile?.linkedin_url ? (
                    <a
                      href={profile.linkedin_url}
                      target="_blank"
                      rel="noreferrer"
                      className="text-primary underline-offset-4 hover:underline"
                    >
                      {profile.linkedin_url}
                    </a>
                  ) : null
                }
              />
              <DetailRow label="Graduation year" value={graduationYear} />
              <DetailRow
                label="Roll number"
                value={listItem?.registration_roll_number}
              />
              <DetailRow
                label="Degree program"
                value={programFromList(listItem)}
              />
              <DetailRow
                label="Department"
                value={listItem?.degree_program?.department}
              />
              <DetailRow label="Company" value={professional?.current_company} />
              <DetailRow label="Job title" value={professional?.job_title} />
              <DetailRow label="Role" value={professional?.role} />
            </dl>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Profile photo</CardTitle>
            <CardDescription>Alumni directory image</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col items-center gap-3 rounded-lg border p-4">
              {photoUrl ? (
                <img
                  src={photoUrl}
                  alt={name}
                  className="size-40 rounded-lg border object-cover"
                />
              ) : (
                <div className="flex size-40 flex-col items-center justify-center gap-2 rounded-lg border border-dashed bg-muted/40 text-muted-foreground">
                  <UserIcon className="size-10" />
                  <span className="text-xs">No photo uploaded</span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
