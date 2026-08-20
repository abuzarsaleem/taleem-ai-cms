import { useEffect, useState } from "react"
import { useLocation, useParams } from "react-router-dom"
import { UserIcon } from "lucide-react"

import { useAuth } from "@/auth/AuthContext"
import { BackButton } from "@/components/admin/back-button"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { ApiError } from "@/lib/api"
import { degreeProgramLabel } from "@/lib/registration-utils"
import { type NavTrailItem } from "@/lib/nav-trail"
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

const STEPS = [
  {
    id: "personal",
    number: "01",
    title: "Personal",
    heading: "Personal Information",
    description: "Contact and identity details for this alumni.",
  },
  {
    id: "educational",
    number: "02",
    title: "Educational",
    heading: "Educational Information",
    description: "Degree and academic records.",
  },
  {
    id: "professional",
    number: "03",
    title: "Professional",
    heading: "Professional Information",
    description: "Work history and career details.",
  },
] as const

function DetailSkeleton() {
  return (
    <div className="flex flex-1 flex-col gap-4 py-4 md:gap-6 md:py-6">
      <div className="px-4 lg:px-6">
        <Skeleton className="mb-4 h-8 w-32" />
        <Skeleton className="h-8 w-64" />
        <Skeleton className="mt-2 h-4 w-48" />
      </div>
      <div className="px-4 lg:px-6">
        <Skeleton className="h-[32rem] w-full rounded-xl" />
      </div>
    </div>
  )
}

function ReadField({
  label,
  value,
  className,
}: {
  label: string
  value: React.ReactNode
  className?: string
}) {
  return (
    <div className={cn("grid gap-1.5", className)}>
      <dt className="text-[11px] font-medium tracking-wider text-muted-foreground uppercase">
        {label}
      </dt>
      <dd className="min-h-10 rounded-lg border bg-muted/40 px-3 py-2.5 text-sm font-medium break-words">
        {value || "—"}
      </dd>
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
  const location = useLocation()
  const navState = (location.state as LocationState | null) ?? null
  const stateAlumni = navState?.alumni ?? null

  const [listItem, setListItem] = useState<AdminAlumniListItem | null>(
    stateAlumni && stateAlumni.alumni_id === id ? stateAlumni : null,
  )
  const [profile, setProfile] = useState<DirectoryAlumniProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [stepIndex, setStepIndex] = useState(0)

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
        <BackButton fallback="/alumni" />
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
  const step = STEPS[stepIndex]
  const isFirst = stepIndex === 0
  const isLast = stepIndex === STEPS.length - 1

  return (
    <div className="flex flex-1 flex-col gap-4 py-4 md:gap-6 md:py-6">
      <div className="px-4 lg:px-6">
        <BackButton fallback="/alumni" />
      </div>

      <div className="px-4 lg:px-6">
        <div className="grid overflow-hidden ring-1 ring-foreground/10 md:grid-cols-[minmax(16rem,20rem)_1fr]">
          <aside className="flex flex-col gap-8 bg-sidebar p-6 text-sidebar-foreground md:p-8">
            <div>
              <p className="text-[11px] font-medium tracking-[0.18em] text-sidebar-foreground/55 uppercase">
                Alumni profile
              </p>
              <h1 className="mt-3 font-serif text-3xl leading-tight">
                {name}
              </h1>
              <p className="mt-2 text-sm text-sidebar-foreground/70">
                {email}
              </p>
            </div>

            <nav className="flex flex-col gap-2" aria-label="Profile sections">
              {STEPS.map((item, index) => {
                const active = index === stepIndex
                const done = index < stepIndex
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setStepIndex(index)}
                    className={cn(
                      "flex items-center gap-3 px-3 py-3 text-left transition-colors",
                      active
                        ? "bg-sidebar-accent text-sidebar-accent-foreground ring-1 ring-sidebar-primary"
                        : "text-sidebar-foreground/55 hover:bg-sidebar-accent/70 hover:text-sidebar-foreground",
                    )}
                  >
                    <span
                      className={cn(
                        "flex size-9 shrink-0 items-center justify-center rounded-full text-xs font-semibold",
                        active
                          ? "bg-sidebar-primary text-sidebar-primary-foreground"
                          : done
                            ? "border border-sidebar-primary text-sidebar-primary"
                            : "border border-sidebar-foreground/25",
                      )}
                    >
                      {item.number}
                    </span>
                    <span className="text-sm font-medium">{item.title}</span>
                  </button>
                )
              })}
            </nav>
          </aside>

          <section className="flex min-h-[28rem] flex-col bg-card p-6 text-card-foreground md:p-8">
              <div>
                <h2 className="font-serif text-2xl">{step.heading}</h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  {step.description}
                </p>
              </div>

              <div className="mt-8 flex-1">
            {step.id === "personal" ? (
              <div className="grid gap-6">
                <div className="flex items-center gap-4">
                  {photoUrl ? (
                    <img
                      src={photoUrl}
                      alt={`${name} profile`}
                      className="size-20 rounded-lg border object-cover"
                    />
                  ) : (
                    <div className="flex size-20 items-center justify-center rounded-lg border border-dashed bg-muted/40 text-muted-foreground">
                      <UserIcon className="size-8" />
                    </div>
                  )}
                  <div>
                    <p className="font-medium">{name}</p>
                    {jobTitle ? (
                      <p className="text-sm text-muted-foreground">{jobTitle}</p>
                    ) : null}
                  </div>
                </div>

                <dl className="grid gap-4 sm:grid-cols-2">
                  <ReadField
                    label="Full name"
                    value={name}
                    className="sm:col-span-2"
                  />
                  <ReadField label="Email address" value={email} />
                  <ReadField
                    label="Mobile / WhatsApp"
                    value={whatsapp || phone}
                  />
                  <ReadField label="Phone" value={phone} />
                  <ReadField label="Location" value={locationLabel} />
                  <ReadField
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
                    className="sm:col-span-2"
                  />
                  <ReadField label="Address" value={address} />
                  <ReadField
                    label="Secondary address"
                    value={secondaryAddress}
                  />
                </dl>
              </div>
            ) : null}

            {step.id === "educational" ? (
              academicItems.length > 0 ? (
                <div className="grid gap-6">
                  {academicItems.map((item, index) => (
                    <dl
                      key={`${item.degree_program_id}-${index}`}
                      className={cn(
                        "grid gap-4 sm:grid-cols-2",
                        index > 0 && "border-t pt-6",
                      )}
                    >
                      <ReadField
                        label="Degree program"
                        value={
                          item.degree_program_id === listItem?.degree_program_id
                            ? programFromList(listItem)
                            : degreeProgramLabel(item.degree_program_id)
                        }
                        className="sm:col-span-2"
                      />
                      <ReadField
                        label="Graduation year"
                        value={item.graduation_year}
                      />
                      {index === 0 ? (
                        <>
                          <ReadField
                            label="Roll number"
                            value={listItem?.registration_roll_number}
                          />
                          <ReadField
                            label="Department"
                            value={listItem?.degree_program?.department}
                            className="sm:col-span-2"
                          />
                        </>
                      ) : null}
                    </dl>
                  ))}
                </div>
              ) : (
                <dl className="grid gap-4 sm:grid-cols-2">
                  <ReadField
                    label="Degree program"
                    value={programFromList(listItem)}
                    className="sm:col-span-2"
                  />
                  <ReadField label="Graduation year" value={graduationYear} />
                  <ReadField
                    label="Roll number"
                    value={listItem?.registration_roll_number}
                  />
                  <ReadField
                    label="Department"
                    value={listItem?.degree_program?.department}
                    className="sm:col-span-2"
                  />
                </dl>
              )
            ) : null}

            {step.id === "professional" ? (
              professionalItems.length > 0 ? (
                <div className="grid gap-6">
                  {professionalItems.map((item, index) => (
                    <dl
                      key={`${item.job_title ?? "role"}-${index}`}
                      className={cn(
                        "grid gap-4 sm:grid-cols-2",
                        index > 0 && "border-t pt-6",
                      )}
                    >
                      <ReadField label="Company" value={item.current_company} />
                      <ReadField label="Job title" value={item.job_title} />
                      <ReadField
                        label="Role"
                        value={item.role}
                        className="sm:col-span-2"
                      />
                    </dl>
                  ))}
                </div>
              ) : (
                <div className="flex items-center gap-2 py-8 text-sm text-muted-foreground">
                  <UserIcon className="size-4" />
                  No professional details available.
                </div>
              )
            ) : null}
              </div>

            <div className="mt-8 flex items-center justify-between border-t pt-5">
              <p className="text-sm text-muted-foreground">
                {stepIndex + 1} / {STEPS.length}
              </p>
              <div className="flex gap-2">
                {!isFirst ? (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setStepIndex((current) => current - 1)}
                  >
                    Back
                  </Button>
                ) : null}
                {!isLast ? (
                  <Button
                    type="button"
                    onClick={() => setStepIndex((current) => current + 1)}
                  >
                    Continue
                  </Button>
                ) : null}
              </div>
              </div>
            </section>
        </div>
      </div>
    </div>
  )
}
