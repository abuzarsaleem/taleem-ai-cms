import { useEffect, useState, type FormEvent } from "react"
import { Link } from "react-router-dom"
import { toast } from "sonner"

import { ApiError } from "@/lib/api-client"
import {
  cityOptions,
  COUNTRIES,
  countryValue,
  selectedCity,
} from "@/lib/locations"
import { catalogService } from "@/services/catalog.service"
import { careerService, profileService } from "@/services/profile.service"
import type {
  AlumniProfile,
  DegreeProgram,
  ProfileAcademic,
  ProfileProfessional,
} from "@/types/portal"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

export function ProfilePage() {
  const [profile, setProfile] = useState<AlumniProfile | null>(null)
  const [academic, setAcademic] = useState<ProfileAcademic[]>([])
  const [professional, setProfessional] = useState<ProfileProfessional[]>([])
  const [degreePrograms, setDegreePrograms] = useState<DegreeProgram[]>([])
  const [degreeLabels, setDegreeLabels] = useState<Map<string, string>>(
    new Map(),
  )
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [savingProfile, setSavingProfile] = useState(false)

  async function reload() {
    setLoading(true)
    setError("")
    try {
      const [nextProfile, nextAcademic, nextProfessional, programs] =
        await Promise.all([
          profileService.getMyProfile(),
          careerService.listAcademic(),
          careerService.listProfessional(),
          catalogService.listDegreePrograms(),
        ])
      setProfile(nextProfile)
      setAcademic(nextAcademic)
      setProfessional(nextProfessional)
      setDegreePrograms(programs)
      setDegreeLabels(new Map(programs.map((p) => [p.id, p.label])))
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to load profile")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void reload()
  }, [])

  async function onSaveProfile(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!profile) return
    const form = new FormData(event.currentTarget)
    setSavingProfile(true)
    try {
      const updated = await profileService.updateMyProfile({
        phone_number: String(form.get("phone_number") || "") || undefined,
        whatsapp_number: String(form.get("whatsapp_number") || "") || undefined,
        address: String(form.get("address") || "") || undefined,
        secondry_address: String(form.get("secondry_address") || "") || undefined,
        city: String(form.get("city") || "") || undefined,
        country: String(form.get("country") || "") || undefined,
        gender: String(form.get("gender") || "") || undefined,
        date_of_birth: String(form.get("date_of_birth") || "") || undefined,
        linkedin_url: String(form.get("linkedin_url") || "") || undefined,
      })
      setProfile(updated)
      toast.success("Profile updated")
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Update failed")
    } finally {
      setSavingProfile(false)
    }
  }

  async function onAddProfessional(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const form = new FormData(event.currentTarget)
    try {
      await careerService.createProfessional({
        current_company: String(form.get("current_company") || "") || undefined,
        job_title: String(form.get("job_title") || "") || undefined,
        role: String(form.get("role") || "") || undefined,
        start_date: String(form.get("start_date")),
      })
      toast.success("Professional record added")
      event.currentTarget.reset()
      setProfessional(await careerService.listProfessional())
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Create failed")
    }
  }

  async function onAddAcademic(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const form = new FormData(event.currentTarget)
    const cgpaRaw = String(form.get("cgpa") || "")
    try {
      await careerService.createAcademic({
        degree_program_id: String(form.get("degree_program_id")),
        registration_roll_number: String(form.get("registration_roll_number")),
        registration_year: String(form.get("registration_year")),
        graduation_year: String(form.get("graduation_year")),
        cgpa: cgpaRaw ? Number(cgpaRaw) : undefined,
      })
      toast.success("Academic record added")
      event.currentTarget.reset()
      const [nextProfile, nextAcademic] = await Promise.all([
        profileService.getMyProfile(),
        careerService.listAcademic(),
      ])
      setProfile(nextProfile)
      setAcademic(nextAcademic)
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Create failed")
    }
  }

  if (loading) {
    return <div className="h-56 animate-pulse rounded-xl bg-muted" />
  }

  if (error || !profile) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Profile unavailable</CardTitle>
          <CardDescription>{error || "Not found"}</CardDescription>
        </CardHeader>
        <CardContent>
          <Button onClick={() => void reload()}>Retry</Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">My profile</h1>
        <p className="text-sm text-muted-foreground">
          Manage your personal, academic, and professional details
        </p>
      </div>

      <Card>
        <CardHeader className="flex-row items-center gap-4">
          {profile.photo_url ? (
            <img
              src={profile.photo_url}
              alt={profile.full_name}
              className="size-16 rounded-full object-cover"
            />
          ) : (
            <div className="flex size-16 items-center justify-center rounded-full bg-primary/15 text-lg font-semibold text-primary">
              {profile.full_name
                .split(/\s+/)
                .slice(0, 2)
                .map((p) => p[0])
                .join("")}
            </div>
          )}
          <div>
            <CardTitle>{profile.full_name}</CardTitle>
            <CardDescription>
              {profile.email} · {profile.status}
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent className="grid gap-2 text-sm sm:grid-cols-2">
          <p>
            <span className="font-medium">CNIC:</span> {profile.cnic_national_id}
          </p>
          <div className="sm:col-span-2">
            <Link
              to="/card"
              className="inline-flex h-7 items-center rounded-lg border border-border bg-background px-2.5 text-[0.8rem] font-medium hover:bg-muted"
            >
              View alumni card
            </Link>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Personal & contact</CardTitle>
        </CardHeader>
        <CardContent>
          <form
            onSubmit={onSaveProfile}
            className="grid gap-3 sm:grid-cols-2"
          >
            <Field label="Phone" name="phone_number" defaultValue={profile.phone_number} />
            <Field
              label="WhatsApp"
              name="whatsapp_number"
              defaultValue={profile.whatsapp_number}
            />
            <div className="space-y-1.5">
              <Label htmlFor="country">Country</Label>
              <select
                id="country"
                name="country"
                defaultValue={countryValue(profile.country)}
                className="h-8 w-full rounded-lg border border-input bg-transparent px-2.5 text-sm"
              >
                {COUNTRIES.map((country) => (
                  <option key={country} value={country}>
                    {country}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="city">City</Label>
              <select
                id="city"
                name="city"
                defaultValue={selectedCity(profile.city)}
                className="h-8 w-full rounded-lg border border-input bg-transparent px-2.5 text-sm"
              >
                <option value="">Select city</option>
                {cityOptions(profile.city).map((city) => (
                  <option key={city} value={city}>
                    {city}
                  </option>
                ))}
              </select>
            </div>
            <Field label="Gender" name="gender" defaultValue={profile.gender} />
            <Field
              label="Date of birth"
              name="date_of_birth"
              type="date"
              defaultValue={profile.date_of_birth?.slice(0, 10) ?? ""}
            />
            <Field
              label="Address"
              name="address"
              defaultValue={profile.address}
              className="sm:col-span-2"
            />
            <Field
              label="Secondary address"
              name="secondry_address"
              defaultValue={profile.secondry_address}
              className="sm:col-span-2"
            />
            <Field
              label="LinkedIn URL"
              name="linkedin_url"
              defaultValue={profile.linkedin_url}
              className="sm:col-span-2"
            />
            <div className="sm:col-span-2">
              <Button type="submit" disabled={savingProfile}>
                {savingProfile ? "Saving…" : "Save profile"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Academic information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {academic.length === 0 ? (
            <p className="text-sm text-muted-foreground">No academic records yet.</p>
          ) : (
            <div className="space-y-3">
              {academic.map((row) => (
                <div
                  key={row.id}
                  className="flex flex-col gap-2 rounded-lg border border-border/70 p-3 sm:flex-row sm:items-start sm:justify-between"
                >
                  <div className="text-sm">
                    <p className="font-medium">
                      {degreeLabels.get(row.degree_program_id) ??
                        row.degree_program_id}
                    </p>
                    <p className="text-muted-foreground">
                      Roll {row.registration_roll_number} · Reg{" "}
                      {row.registration_year ?? "—"} · Grad {row.graduation_year}
                      {row.cgpa != null ? ` · CGPA ${row.cgpa}` : ""}
                      {row.is_verification ? " · Primary" : ""}
                    </p>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={async () => {
                      try {
                        await careerService.deleteAcademic(row.id)
                        toast.success("Academic record deleted")
                        setAcademic(await careerService.listAcademic())
                      } catch (err) {
                        toast.error(
                          err instanceof ApiError
                            ? err.message
                            : "Delete failed",
                        )
                      }
                    }}
                  >
                    Delete
                  </Button>
                </div>
              ))}
            </div>
          )}

          <form
            onSubmit={onAddAcademic}
            className="grid gap-3 rounded-lg border border-dashed border-border p-3 sm:grid-cols-2"
          >
            <div className="space-y-1.5 sm:col-span-2">
              <Label htmlFor="degree_program_id">Degree program</Label>
              <select
                id="degree_program_id"
                name="degree_program_id"
                required
                className="h-8 w-full rounded-lg border border-input bg-transparent px-2.5 text-sm"
              >
                <option value="">Select degree program</option>
                {degreePrograms.map((program) => (
                  <option key={program.id} value={program.id}>
                    {program.label}
                  </option>
                ))}
              </select>
            </div>
            <Field label="Roll number" name="registration_roll_number" required />
            <Field label="Registration year" name="registration_year" required />
            <Field label="Graduation year" name="graduation_year" required />
            <Field label="CGPA" name="cgpa" type="number" step="0.01" />
            <div className="sm:col-span-2">
              <Button type="submit">Add academic record</Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Professional information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {professional.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No professional records yet.
            </p>
          ) : (
            <div className="space-y-3">
              {professional.map((row) => (
                <div
                  key={row.id}
                  className="flex flex-col gap-2 rounded-lg border border-border/70 p-3 sm:flex-row sm:items-start sm:justify-between"
                >
                  <div className="text-sm">
                    <p className="font-medium">
                      {row.job_title || row.role || "Role not specified"}
                    </p>
                    <p className="text-muted-foreground">
                      {[row.current_company, row.role].filter(Boolean).join(" · ")}
                    </p>
                    <p className="text-muted-foreground">
                      {String(row.start_date).slice(0, 10)}
                      {row.end_date
                        ? ` → ${String(row.end_date).slice(0, 10)}`
                        : " → Present"}
                    </p>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={async () => {
                      try {
                        await careerService.deleteProfessional(row.id)
                        toast.success("Professional record deleted")
                        setProfessional(await careerService.listProfessional())
                      } catch (err) {
                        toast.error(
                          err instanceof ApiError
                            ? err.message
                            : "Delete failed",
                        )
                      }
                    }}
                  >
                    Delete
                  </Button>
                </div>
              ))}
            </div>
          )}

          <form
            onSubmit={onAddProfessional}
            className="grid gap-3 rounded-lg border border-dashed border-border p-3 sm:grid-cols-2"
          >
            <Field label="Company" name="current_company" />
            <Field label="Job title" name="job_title" />
            <Field label="Role" name="role" />
            <Field label="Start date" name="start_date" type="date" required />
            <div className="sm:col-span-2">
              <Button type="submit">Add professional record</Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}

function Field({
  label,
  name,
  defaultValue,
  type = "text",
  required,
  step,
  className,
}: {
  label: string
  name: string
  defaultValue?: string | null
  type?: string
  required?: boolean
  step?: string
  className?: string
}) {
  return (
    <div className={`space-y-1.5 ${className ?? ""}`}>
      <Label htmlFor={name}>{label}</Label>
      <Input
        id={name}
        name={name}
        type={type}
        step={step}
        required={required}
        defaultValue={defaultValue ?? ""}
      />
    </div>
  )
}
