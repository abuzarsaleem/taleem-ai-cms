import { useEffect, useState } from "react"
import { Link, useLocation, useNavigate, useParams } from "react-router-dom"
import { ArrowLeftIcon, UserIcon } from "lucide-react"

import { useAuth } from "@/auth/AuthContext"
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
import { backToFromTrail, type NavTrailItem } from "@/lib/nav-trail"
import { cn } from "@/lib/utils"
import {
  alumniService,
  type AdminAlumniListItem,
  type DirectoryAlumniProfile,
  type DirectoryProfessional,
} from "@/services/alumni.service"

type LocationState = {
  alumni?: AdminAlumniListItem
  fromTrail?: NavTrailItem[]
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

function ProfileField({
  label,
  value,
}: {
  label: string
  value: React.ReactNode
}) {
  return (
    <div className="border-b py-3 last:border-b-0">
      <dt className="text-sm text-muted-foreground">{label}</dt>
      <dd className="mt-0.5 text-sm font-medium break-words">{value || "—"}</dd>
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
  const navState = (location.state as LocationState | null) ?? null
  const stateAlumni = navState?.alumni ?? null
  const fromTrail = navState?.fromTrail
  const backTo = backToFromTrail(fromTrail, "/alumni")

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
          render={<Link to={backTo} />}
        >
          <ArrowLeftIcon />
          Back
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
  const locationLabel = [city, country].filter(Boolean).join(", ")
  const address = profile?.address
  const secondaryAddress = profile?.secondry_address
  const linkedinUrl = profile?.linkedin_url
  const graduationYear =
    profile?.primary_graduation_year ??
    profile?.academic?.[0]?.graduation_year ??
    listItem?.graduation_year
  const jobTitle =
    profile?.professional?.[0]?.job_title ??
    listItem?.professional?.job_title ??
    profile?.primary_role ??
    listItem?.professional?.role ??
    null

  const professionalItems: DirectoryProfessional[] =
    profile?.professional?.length
      ? profile.professional
      : listItem?.professional
        ? [listItem.professional]
        : []

  const academicItems = profile?.academic ?? []

  return (
    <div className="flex flex-1 flex-col gap-4 py-4 md:gap-6 md:py-6">
      <div className="flex flex-col gap-3 px-4 lg:px-6">
        <Button
          variant="outline"
          size="sm"
          className="w-fit"
          onClick={() => navigate(backTo)}
        >
          <ArrowLeftIcon />
          Back
        </Button>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{name}</h1>
          <p className="text-muted-foreground">{email}</p>
        </div>
      </div>

      <div className="grid gap-4 px-4 lg:grid-cols-3 lg:px-6">
        <div className="flex flex-col gap-4 lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Educational</CardTitle>
              <CardDescription>Degree and academic records</CardDescription>
            </CardHeader>
            <CardContent>
              {academicItems.length > 0 ? (
                <div className="space-y-2">
                  {academicItems.map((item, index) => (
                    <dl
                      key={`${item.degree_program_id}-${index}`}
                      className={cn(index > 0 && "border-t pt-2")}
                    >
                      <DetailRow
                        label="Degree program"
                        value={
                          item.degree_program_id === listItem?.degree_program_id
                            ? programFromList(listItem)
                            : degreeProgramLabel(item.degree_program_id)
                        }
                      />
                      <DetailRow
                        label="Graduation year"
                        value={item.graduation_year}
                      />
                      {index === 0 ? (
                        <>
                          <DetailRow
                            label="Roll number"
                            value={listItem?.registration_roll_number}
                          />
                          <DetailRow
                            label="Department"
                            value={listItem?.degree_program?.department}
                          />
                        </>
                      ) : null}
                    </dl>
                  ))}
                </div>
              ) : (
                <dl>
                  <DetailRow
                    label="Degree program"
                    value={programFromList(listItem)}
                  />
                  <DetailRow label="Graduation year" value={graduationYear} />
                  <DetailRow
                    label="Roll number"
                    value={listItem?.registration_roll_number}
                  />
                  <DetailRow
                    label="Department"
                    value={listItem?.degree_program?.department}
                  />
                </dl>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Professional</CardTitle>
              <CardDescription>Work and career details</CardDescription>
            </CardHeader>
            <CardContent>
              {professionalItems.length > 0 ? (
                <div className="space-y-2">
                  {professionalItems.map((item, index) => (
                    <dl
                      key={`${item.job_title ?? "role"}-${index}`}
                      className={cn(index > 0 && "border-t pt-2")}
                    >
                      <DetailRow label="Company" value={item.current_company} />
                      <DetailRow label="Job title" value={item.job_title} />
                      <DetailRow label="Role" value={item.role} />
                    </dl>
                  ))}
                </div>
              ) : (
                <div className="flex items-center gap-2 py-2 text-sm text-muted-foreground">
                  <UserIcon className="size-4" />
                  No professional details available.
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <Card className="h-fit">
          <CardHeader>
            <CardTitle>Profile</CardTitle>
            <CardDescription>Photo and personal information</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <div className="flex flex-col items-center gap-3 rounded-lg border p-4">
              {photoUrl ? (
                <img
                  src={photoUrl}
                  alt={`${name} profile`}
                  className="size-40 rounded-lg border object-cover"
                />
              ) : (
                <div className="flex size-40 flex-col items-center justify-center gap-2 rounded-lg border border-dashed bg-muted/40 text-muted-foreground">
                  <UserIcon className="size-10" />
                  <span className="text-xs">No photo uploaded</span>
                </div>
              )}
              {jobTitle ? (
                <p className="text-center text-sm text-muted-foreground">
                  {jobTitle}
                </p>
              ) : null}
            </div>

            <dl>
              <ProfileField label="Full name" value={name} />
              <ProfileField label="Email" value={email} />
              <ProfileField label="Phone" value={phone} />
              <ProfileField label="WhatsApp" value={whatsapp} />
              <ProfileField label="Location" value={locationLabel} />
              <ProfileField
                label="LinkedIn"
                value={
                  linkedinUrl ? (
                    <a
                      href={linkedinUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="text-primary underline-offset-4 hover:underline"
                    >
                      {linkedinUrl}
                    </a>
                  ) : null
                }
              />
              <ProfileField label="Address" value={address} />
              <ProfileField
                label="Secondary address"
                value={secondaryAddress}
              />
            </dl>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
