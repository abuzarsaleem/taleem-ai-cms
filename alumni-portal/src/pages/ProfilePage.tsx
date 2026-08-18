import { Camera, Minus, Plus } from "lucide-react"
import { useEffect, useMemo, useRef, useState, type FormEvent } from "react"
import { Link, useLocation } from "react-router-dom"
import type { Value as E164Number } from "react-phone-number-input"

import { SearchableSelect } from "@/components/searchable-select"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { PhoneInput } from "@/components/ui/phone-input"
import { YearPicker } from "@/components/ui/year-picker"
import { ApiError } from "@/lib/api-client"
import {
  cityOptions,
  countryOptions,
  countryValue,
  isPakistan,
  selectedCity,
} from "@/lib/locations"
import {
  notifyProfileUpdated,
  refreshPortalRails,
} from "@/lib/portal-events"
import {
  MAX_GRADUATION_YEAR,
  MIN_GRADUATION_YEAR,
  validatePhotoFile,
} from "@/lib/registration-validation"
import { authService } from "@/services/auth.service"
import { catalogService } from "@/services/catalog.service"
import { careerService, profileService } from "@/services/profile.service"
import type {
  AlumniProfile,
  DegreeProgram,
  ProfileAcademic,
  ProfileProfessional,
} from "@/types/portal"

const GENDER_OPTIONS = [
  { value: "Male", label: "Male" },
  { value: "Female", label: "Female" },
  { value: "Other", label: "Other" },
  { value: "Prefer not to say", label: "Prefer not to say" },
]

type FormMessage = {
  section: "photo" | "personal" | "academic" | "professional"
  type: "success" | "error"
  text: string
}

export function ProfilePage() {
  const photoInputRef = useRef<HTMLInputElement>(null)
  const location = useLocation()
  const [personalOpen, setPersonalOpen] = useState(
    () =>
      typeof location.state === "object" &&
      location.state !== null &&
      "openPersonal" in location.state &&
      Boolean((location.state as { openPersonal?: boolean }).openPersonal),
  )
  const [profile, setProfile] = useState<AlumniProfile | null>(null)
  const [academic, setAcademic] = useState<ProfileAcademic[]>([])
  const [professional, setProfessional] = useState<ProfileProfessional[]>([])
  const [degreePrograms, setDegreePrograms] = useState<DegreeProgram[]>([])
  const [degreeLabels, setDegreeLabels] = useState<Map<string, string>>(
    new Map(),
  )
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [message, setMessage] = useState<FormMessage | null>(null)
  const [savingProfile, setSavingProfile] = useState(false)
  const [photoBusy, setPhotoBusy] = useState(false)

  const [country, setCountry] = useState(countryValue(null))
  const [city, setCity] = useState("")
  const [gender, setGender] = useState("")
  const [phoneNumber, setPhoneNumber] = useState<E164Number | undefined>()
  const [whatsappNumber, setWhatsappNumber] = useState<E164Number | undefined>()

  const [addingAcademic, setAddingAcademic] = useState(false)
  const [addingProfessional, setAddingProfessional] = useState(false)
  const [newDegreeId, setNewDegreeId] = useState("")
  const [newRegYear, setNewRegYear] = useState("")
  const [newGradYear, setNewGradYear] = useState("")

  const cities = useMemo(() => cityOptions(country, city), [country, city])
  const genderOptions = useMemo(() => {
    if (
      gender &&
      !GENDER_OPTIONS.some((option) => option.value === gender)
    ) {
      return [{ value: gender, label: gender }, ...GENDER_OPTIONS]
    }
    return GENDER_OPTIONS
  }, [gender])

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
      setCountry(countryValue(nextProfile.country))
      setCity(selectedCity(nextProfile.country, nextProfile.city))
      setGender(nextProfile.gender ?? "")
      setPhoneNumber((nextProfile.phone_number || undefined) as E164Number)
      setWhatsappNumber(
        (nextProfile.whatsapp_number || undefined) as E164Number,
      )
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to load profile")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void reload()
  }, [])

  useEffect(() => {
    if (
      typeof location.state === "object" &&
      location.state &&
      "openPersonal" in location.state &&
      Boolean((location.state as { openPersonal?: boolean }).openPersonal)
    ) {
      setPersonalOpen(true)
    }
  }, [location.state])

  function showMessage(next: FormMessage) {
    setMessage(next)
  }

  function StatusNote({
    section,
  }: {
    section: FormMessage["section"]
  }) {
    if (!message || message.section !== section) return null
    return (
      <p
        className={
          message.type === "success"
            ? "rounded-lg bg-emerald-500/10 px-3 py-2 text-sm text-emerald-800 dark:text-emerald-300"
            : "rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive"
        }
        role={message.type === "error" ? "alert" : "status"}
      >
        {message.text}
      </p>
    )
  }

  async function onSaveProfile(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!profile) return
    const form = new FormData(event.currentTarget)
    setSavingProfile(true)
    setMessage(null)
    try {
      const updated = await profileService.updateMyProfile({
        phone_number: phoneNumber || undefined,
        whatsapp_number: whatsappNumber || undefined,
        address: String(form.get("address") || "") || undefined,
        secondry_address: String(form.get("secondry_address") || "") || undefined,
        city: city || undefined,
        country: country || undefined,
        gender: gender || undefined,
        date_of_birth: String(form.get("date_of_birth") || "") || undefined,
        linkedin_url: String(form.get("linkedin_url") || "") || undefined,
      })
      setProfile(updated)
      notifyProfileUpdated()
      showMessage({
        section: "personal",
        type: "success",
        text: "Profile updated",
      })
    } catch (err) {
      showMessage({
        section: "personal",
        type: "error",
        text: err instanceof ApiError ? err.message : "Update failed",
      })
    } finally {
      setSavingProfile(false)
    }
  }

  async function onPhotoSelected(file: File | null) {
    if (!file) return
    const photoError = validatePhotoFile(file)
    if (photoError) {
      showMessage({ section: "photo", type: "error", text: photoError })
      return
    }
    setPhotoBusy(true)
    setMessage(null)
    try {
      const upload = await authService.uploadPhoto(file)
      if (!upload.media_id) {
        showMessage({
          section: "photo",
          type: "error",
          text: "Photo upload did not return a media id",
        })
        return
      }
      const updated = await profileService.updateMyProfile({
        media_id: upload.media_id,
      })
      setProfile(updated)
      notifyProfileUpdated()
      refreshPortalRails()
      showMessage({
        section: "photo",
        type: "success",
        text: "Profile picture updated",
      })
    } catch (err) {
      showMessage({
        section: "photo",
        type: "error",
        text: err instanceof ApiError ? err.message : "Photo update failed",
      })
    } finally {
      setPhotoBusy(false)
      if (photoInputRef.current) photoInputRef.current.value = ""
    }
  }

  async function onAddProfessional(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const form = new FormData(event.currentTarget)
    setMessage(null)
    try {
      await careerService.createProfessional({
        current_company: String(form.get("current_company") || "") || undefined,
        job_title: String(form.get("job_title") || "") || undefined,
        role: String(form.get("role") || "") || undefined,
        start_date: String(form.get("start_date")),
      })
      setProfessional(await careerService.listProfessional())
      setAddingProfessional(false)
      showMessage({
        section: "professional",
        type: "success",
        text: "Professional record added",
      })
    } catch (err) {
      showMessage({
        section: "professional",
        type: "error",
        text: err instanceof ApiError ? err.message : "Create failed",
      })
    }
  }

  async function onAddAcademic(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const form = new FormData(event.currentTarget)
    const cgpaRaw = String(form.get("cgpa") || "")
    if (cgpaRaw) {
      const cgpa = Number(cgpaRaw)
      if (Number.isNaN(cgpa) || cgpa < 0 || cgpa > 4) {
        showMessage({
          section: "academic",
          type: "error",
          text: "CGPA must be between 0 and 4",
        })
        return
      }
    }
    setMessage(null)
    try {
      await careerService.createAcademic({
        degree_program_id: newDegreeId,
        registration_roll_number: String(form.get("registration_roll_number")),
        registration_year: newRegYear,
        graduation_year: newGradYear,
        cgpa: cgpaRaw ? Number(cgpaRaw) : undefined,
      })
      setNewDegreeId("")
      setNewRegYear("")
      setNewGradYear("")
      const [nextProfile, nextAcademic] = await Promise.all([
        profileService.getMyProfile(),
        careerService.listAcademic(),
      ])
      setProfile(nextProfile)
      setAcademic(nextAcademic)
      setAddingAcademic(false)
      showMessage({
        section: "academic",
        type: "success",
        text: "Academic record added",
      })
    } catch (err) {
      showMessage({
        section: "academic",
        type: "error",
        text: err instanceof ApiError ? err.message : "Create failed",
      })
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
        <h1 className="font-display text-2xl font-semibold tracking-tight">
          My profile
        </h1>
        <p className="text-sm text-muted-foreground">
          Manage your photo, personal details, academic history, and career
        </p>
      </div>

      <Card>
        <CardContent className="flex flex-col gap-5 pt-6 sm:flex-row sm:items-center">
          <div className="relative mx-auto sm:mx-0">
            {profile.photo_url ? (
              <img
                src={profile.photo_url}
                alt={profile.full_name}
                className="size-24 rounded-full object-cover ring-2 ring-border"
              />
            ) : (
              <div className="flex size-24 items-center justify-center rounded-full bg-primary/15 text-2xl font-semibold text-primary ring-2 ring-border">
                {profile.full_name
                  .split(/\s+/)
                  .slice(0, 2)
                  .map((p) => p[0])
                  .join("")}
              </div>
            )}
            <button
              type="button"
              disabled={photoBusy}
              className="absolute right-0 bottom-0 flex size-8 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-sm hover:bg-primary/90 disabled:opacity-60"
              onClick={() => photoInputRef.current?.click()}
              aria-label="Change profile picture"
            >
              <Camera className="size-4" />
            </button>
            <input
              ref={photoInputRef}
              type="file"
              accept="image/*"
              className="sr-only"
              onChange={(event) =>
                void onPhotoSelected(event.target.files?.[0] ?? null)
              }
            />
          </div>
          <div className="min-w-0 flex-1 text-center sm:text-left">
            <h2 className="text-xl font-semibold">{profile.full_name}</h2>
            <p className="text-sm text-muted-foreground">
              {profile.email}
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              CNIC: {profile.cnic_national_id}
            </p>
            <Link
              to="/card"
              className="mt-3 inline-flex h-8 items-center rounded-lg border border-border bg-background px-3 text-sm font-medium hover:bg-muted"
            >
              View alumni card
            </Link>
            <div className="mt-3">
              <StatusNote section="photo" />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader
          className="cursor-pointer"
          onClick={() => setPersonalOpen((open) => !open)}
        >
          <CardTitle>Personal information</CardTitle>
          <CardDescription>
            Keep your location and contact details current for the directory
          </CardDescription>
          <CardAction>
            <Button
              type="button"
              variant="outline"
              size="icon"
              aria-label={
                personalOpen
                  ? "Hide personal information"
                  : "Open personal information"
              }
              aria-expanded={personalOpen}
              onClick={(event) => {
                event.stopPropagation()
                setPersonalOpen((open) => !open)
              }}
            >
              {personalOpen ? <Minus className="size-4" /> : <Plus className="size-4" />}
            </Button>
          </CardAction>
        </CardHeader>
        {personalOpen ? (
        <CardContent>
          <form
            id="profile-personal-form"
            onSubmit={onSaveProfile}
            className="grid gap-4 sm:grid-cols-2"
          >
            <div className="space-y-1.5">
              <Label htmlFor="phone_number">Phone</Label>
              <PhoneInput
                id="phone_number"
                international
                defaultCountry="PK"
                value={phoneNumber}
                onChange={(value) => setPhoneNumber(value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="whatsapp_number">WhatsApp</Label>
              <PhoneInput
                id="whatsapp_number"
                international
                defaultCountry="PK"
                value={whatsappNumber}
                onChange={(value) => setWhatsappNumber(value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="country">Country</Label>
              <SearchableSelect
                id="country"
                value={country}
                onChange={(value) => {
                  setCountry(value)
                  if (!isPakistan(value)) setCity("")
                }}
                options={countryOptions(country).map((item) => ({
                  value: item,
                  label: item,
                }))}
                placeholder="Select country"
                searchPlaceholder="Search country…"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="city">City</Label>
              {isPakistan(country) ? (
                <SearchableSelect
                  id="city"
                  value={city}
                  onChange={setCity}
                  options={cities.map((item) => ({ value: item, label: item }))}
                  placeholder="Select city"
                  searchPlaceholder="Search city…"
                />
              ) : (
                <Input
                  id="city"
                  value={city}
                  onChange={(event) => setCity(event.target.value)}
                  placeholder="Enter city"
                />
              )}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="gender">Gender</Label>
              <SearchableSelect
                id="gender"
                value={gender}
                onChange={setGender}
                options={genderOptions}
                placeholder="Select gender"
                searchPlaceholder="Search…"
              />
            </div>
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
            <div className="sm:col-span-2 flex flex-col items-end gap-3">
              <div className="w-full">
                <StatusNote section="personal" />
              </div>
              <Button type="submit" disabled={savingProfile}>
                {savingProfile ? "Saving…" : "Save"}
              </Button>
            </div>
          </form>
        </CardContent>
        ) : null}
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Academic information</CardTitle>
          <CardDescription>
            Degrees and years associated with your alumni record
          </CardDescription>
          <CardAction>
            <Button
              type="button"
              variant="outline"
              size="icon"
              aria-label={addingAcademic ? "Hide add academic form" : "Add academic information"}
              aria-expanded={addingAcademic}
              onClick={() => setAddingAcademic((open) => !open)}
            >
              {addingAcademic ? <Minus className="size-4" /> : <Plus className="size-4" />}
            </Button>
          </CardAction>
        </CardHeader>
        <CardContent className="space-y-4">
          {!addingAcademic ? <StatusNote section="academic" /> : null}
          {academic.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No academic records yet.
            </p>
          ) : (
            <div className="grid gap-3">
              {academic.map((row) => (
                <div
                  key={row.id}
                  className="flex flex-col gap-3 rounded-xl border border-border bg-muted/20 p-4 sm:flex-row sm:items-start sm:justify-between"
                >
                  <div className="text-sm">
                    <p className="font-semibold">
                      {degreeLabels.get(row.degree_program_id) ??
                        row.degree_program_id}
                    </p>
                    <p className="mt-1 text-muted-foreground">
                      Roll {row.registration_roll_number}
                    </p>
                    <p className="text-muted-foreground">
                      Registered {row.registration_year ?? "—"} · Graduated{" "}
                      {row.graduation_year}
                      {row.cgpa != null ? ` · CGPA ${row.cgpa}` : ""}
                    </p>
                    {row.is_verification ? (
                      <p className="mt-1 text-xs font-medium text-primary">
                        Primary verification record
                      </p>
                    ) : null}
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={async () => {
                      setMessage(null)
                      try {
                        await careerService.deleteAcademic(row.id)
                        setAcademic(await careerService.listAcademic())
                        showMessage({
                          section: "academic",
                          type: "success",
                          text: "Academic record deleted",
                        })
                      } catch (err) {
                        showMessage({
                          section: "academic",
                          type: "error",
                          text:
                            err instanceof ApiError
                              ? err.message
                              : "Delete failed",
                        })
                      }
                    }}
                  >
                    Delete
                  </Button>
                </div>
              ))}
            </div>
          )}

          {addingAcademic ? (
          <form
            onSubmit={onAddAcademic}
            className="grid gap-3 rounded-xl border border-dashed border-border p-4 sm:grid-cols-2"
          >
            <div className="space-y-1.5 sm:col-span-2">
              <Label htmlFor="degree_program_id">Degree program</Label>
              <SearchableSelect
                id="degree_program_id"
                value={newDegreeId}
                onChange={setNewDegreeId}
                options={degreePrograms.map((program) => ({
                  value: program.id,
                  label: program.label,
                }))}
                placeholder="Select degree program"
                searchPlaceholder="Search program…"
              />
            </div>
            <Field label="Roll number" name="registration_roll_number" required />
            <div className="space-y-1.5">
              <Label htmlFor="registration_year">Registration year</Label>
              <YearPicker
                id="registration_year"
                value={newRegYear}
                onChange={setNewRegYear}
                minYear={MIN_GRADUATION_YEAR}
                maxYear={MAX_GRADUATION_YEAR}
                placeholder="Select year"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="graduation_year">Graduation year</Label>
              <YearPicker
                id="graduation_year"
                value={newGradYear}
                onChange={setNewGradYear}
                minYear={MIN_GRADUATION_YEAR}
                maxYear={MAX_GRADUATION_YEAR}
                placeholder="Select year"
              />
            </div>
            <Field
              label="CGPA"
              name="cgpa"
              type="number"
              step="0.01"
              min="0"
              max="4"
              error={
                message?.section === "academic" && message.type === "error"
                  ? message.text
                  : undefined
              }
            />
            <div className="sm:col-span-2 flex justify-end">
              <Button type="submit" disabled={!newDegreeId || !newRegYear || !newGradYear}>
                Save
              </Button>
            </div>
          </form>
          ) : null}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Professional information</CardTitle>
          <CardDescription>
            Roles and companies that appear on your public alumni profile
          </CardDescription>
          <CardAction>
            <Button
              type="button"
              variant="outline"
              size="icon"
              aria-label={
                addingProfessional
                  ? "Hide add professional form"
                  : "Add professional information"
              }
              aria-expanded={addingProfessional}
              onClick={() => setAddingProfessional((open) => !open)}
            >
              {addingProfessional ? <Minus className="size-4" /> : <Plus className="size-4" />}
            </Button>
          </CardAction>
        </CardHeader>
        <CardContent className="space-y-4">
          {!addingProfessional ? <StatusNote section="professional" /> : null}
          {professional.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No professional records yet.
            </p>
          ) : (
            <div className="grid gap-3">
              {professional.map((row) => (
                <div
                  key={row.id}
                  className="flex flex-col gap-3 rounded-xl border border-border bg-muted/20 p-4 sm:flex-row sm:items-start sm:justify-between"
                >
                  <div className="text-sm">
                    <p className="font-semibold">
                      {row.job_title || row.role || "Role not specified"}
                    </p>
                    <p className="mt-1 text-muted-foreground">
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
                      setMessage(null)
                      try {
                        await careerService.deleteProfessional(row.id)
                        setProfessional(await careerService.listProfessional())
                        showMessage({
                          section: "professional",
                          type: "success",
                          text: "Professional record deleted",
                        })
                      } catch (err) {
                        showMessage({
                          section: "professional",
                          type: "error",
                          text:
                            err instanceof ApiError
                              ? err.message
                              : "Delete failed",
                        })
                      }
                    }}
                  >
                    Delete
                  </Button>
                </div>
              ))}
            </div>
          )}

          {addingProfessional ? (
          <form
            onSubmit={onAddProfessional}
            className="grid gap-3 rounded-xl border border-dashed border-border p-4 sm:grid-cols-2"
          >
            <Field label="Company" name="current_company" />
            <Field label="Job title" name="job_title" />
            <Field label="Role" name="role" />
            <Field label="Start date" name="start_date" type="date" required />
            <div className="sm:col-span-2 flex flex-col items-end gap-3">
              <div className="w-full">
                <StatusNote section="professional" />
              </div>
              <Button type="submit">Save</Button>
            </div>
          </form>
          ) : null}
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
  min,
  max,
  error,
  className,
}: {
  label: string
  name: string
  defaultValue?: string | null
  type?: string
  required?: boolean
  step?: string
  min?: string
  max?: string
  error?: string
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
        min={min}
        max={max}
        required={required}
        defaultValue={defaultValue ?? ""}
        aria-invalid={error ? true : undefined}
      />
      {error ? <p className="text-sm text-destructive">{error}</p> : null}
    </div>
  )
}
