import {
  Briefcase,
  Camera,
  Check,
  GraduationCap,
  Loader2,
  Minus,
  Plus,
  Sparkles,
  UserRound,
} from "lucide-react"
import { useEffect, useMemo, useRef, useState, type FormEvent, type MouseEvent } from "react"
import { Link, useLocation } from "react-router-dom"
import type { Value as E164Number } from "react-phone-number-input"

import { AuthFieldLabel } from "@/components/auth-flow-layout"
import { SearchableSelect } from "@/components/searchable-select"
import { Button, buttonVariants } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { PhoneInput } from "@/components/ui/phone-input"
import { YearPicker } from "@/components/ui/year-picker"
import { ApiError } from "@/lib/api-client"
import { cn } from "@/lib/utils"
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

type ProfileSection = "personal" | "academic" | "professional"

const SECTION_META: Record<
  ProfileSection,
  { eyebrow: string; title: string; description: string }
> = {
  personal: {
    eyebrow: "Personal information",
    title: "Personal Details",
    description:
      "Keep your contact and location details current for the alumni directory.",
  },
  academic: {
    eyebrow: "Academic information",
    title: "Academic Records",
    description: "Degrees and years associated with your alumni record.",
  },
  professional: {
    eyebrow: "Professional information",
    title: "Career History",
    description:
      "Roles and companies that appear on your public alumni profile.",
  },
}

export function ProfilePage() {
  const photoInputRef = useRef<HTMLInputElement>(null)
  const location = useLocation()
  const [activeSection, setActiveSection] = useState<ProfileSection>("personal")
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
  const [personalSaveAction, setPersonalSaveAction] = useState<
    "save" | "next" | null
  >(null)
  const [savingAcademic, setSavingAcademic] = useState(false)
  const [savingProfessional, setSavingProfessional] = useState(false)
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

  const primaryRoll = useMemo(() => {
    const verification = academic.find((row) => row.is_verification)
    return (
      verification?.registration_roll_number ??
      academic[0]?.registration_roll_number ??
      null
    )
  }, [academic])

  const completionChecks = useMemo(() => {
    if (!profile) return []
    return [
      Boolean(profile.photo_url),
      Boolean(phoneNumber || profile.phone_number),
      Boolean(city || profile.city),
      Boolean(country || profile.country),
      Boolean(gender || profile.gender),
      academic.length > 0,
      professional.length > 0,
    ]
  }, [profile, phoneNumber, city, country, gender, academic, professional])

  const completion = useMemo(() => {
    if (completionChecks.length === 0) return 0
    return Math.round(
      (completionChecks.filter(Boolean).length / completionChecks.length) * 100,
    )
  }, [completionChecks])

  const sectionStatus = useMemo(() => {
    const personalDone =
      Boolean(phoneNumber || profile?.phone_number) &&
      Boolean(city || profile?.city) &&
      Boolean(country || profile?.country)
    const personalPct = Math.round(
      ([
        Boolean(phoneNumber || profile?.phone_number),
        Boolean(city || profile?.city),
        Boolean(country || profile?.country),
        Boolean(gender || profile?.gender),
        Boolean(profile?.date_of_birth),
        Boolean(profile?.address),
      ].filter(Boolean).length /
        6) *
        100,
    )
    return {
      personal: {
        done: personalDone,
        pct: personalPct,
      },
      academic: {
        done: academic.length > 0,
        pct: academic.length > 0 ? 100 : 0,
      },
      professional: {
        done: professional.length > 0,
        pct: professional.length > 0 ? 100 : 0,
      },
    }
  }, [profile, phoneNumber, city, country, gender, academic, professional])

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
      setActiveSection("personal")
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

  async function savePersonalProfile(
    form: HTMLFormElement,
    action: "save" | "next",
  ): Promise<boolean> {
    if (!profile) return false
    const data = new FormData(form)
    setPersonalSaveAction(action)
    setSavingProfile(true)
    setMessage(null)
    try {
      const updated = await profileService.updateMyProfile({
        phone_number: phoneNumber || undefined,
        whatsapp_number: whatsappNumber || undefined,
        address: String(data.get("address") || "") || undefined,
        secondry_address:
          String(data.get("secondry_address") || "") || undefined,
        city: city || undefined,
        country: country || undefined,
        gender: gender || undefined,
        date_of_birth: String(data.get("date_of_birth") || "") || undefined,
        linkedin_url: String(data.get("linkedin_url") || "") || undefined,
      })
      setProfile(updated)
      notifyProfileUpdated()
      showMessage({
        section: "personal",
        type: "success",
        text: "Profile updated",
      })
      return true
    } catch (err) {
      showMessage({
        section: "personal",
        type: "error",
        text: err instanceof ApiError ? err.message : "Update failed",
      })
      return false
    } finally {
      setSavingProfile(false)
      setPersonalSaveAction(null)
    }
  }

  async function onSaveProfile(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    await savePersonalProfile(event.currentTarget, "save")
  }

  async function onNextPersonal(event: MouseEvent<HTMLButtonElement>) {
    const form = event.currentTarget.form
    if (!form) return
    const saved = await savePersonalProfile(form, "next")
    if (saved) setActiveSection("academic")
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
    setSavingProfessional(true)
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
    } finally {
      setSavingProfessional(false)
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
    setSavingAcademic(true)
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
    } finally {
      setSavingAcademic(false)
    }
  }

  if (loading) {
    return <div className="h-56 animate-pulse rounded-xl bg-muted" />
  }

  if (error || !profile) {
    return (
      <div className="portal-card space-y-4 p-6">
        <div>
          <h2 className="font-display text-xl font-semibold text-primary">
            Profile unavailable
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            {error || "Not found"}
          </p>
        </div>
        <Button onClick={() => void reload()}>Retry</Button>
      </div>
    )
  }

  const meta = SECTION_META[activeSection]
  const navItems: {
    id: ProfileSection
    label: string
    icon: typeof UserRound
  }[] = [
    { id: "personal", label: "Personal & Contact", icon: UserRound },
    { id: "academic", label: "Academic", icon: GraduationCap },
    { id: "professional", label: "Professional", icon: Briefcase },
  ]

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(280px,320px)_1fr] lg:items-start">
      {/* Sidebar */}
      <aside className="portal-card flex flex-col gap-6 p-6">
        <div className="flex flex-col items-center text-center">
          <div className="relative">
            {profile.photo_url ? (
              <img
                src={profile.photo_url}
                alt={profile.full_name}
                className="size-[112px] rounded-full border-[4px] border-[#36babc] object-cover shadow-sm ring-4 ring-[#36babc]/15"
              />
            ) : (
              <div className="flex size-[112px] items-center justify-center rounded-full border-[4px] border-[#36babc] bg-gradient-to-br from-[#d9f6f3] to-[#c7d8ff] text-3xl font-extrabold text-primary shadow-sm ring-4 ring-[#36babc]/15">
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
              className="absolute right-1 bottom-1 flex size-8 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-sm hover:bg-primary/90 disabled:opacity-60"
              onClick={() => photoInputRef.current?.click()}
              aria-label="Change profile picture"
            >
              {photoBusy ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <Camera className="size-4" />
              )}
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

          <h2 className="mt-4 font-display text-xl font-semibold text-primary">
            {profile.full_name}
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            {primaryRoll
              ? `Roll ${primaryRoll}`
              : `ID ${profile.public_alumni_code || profile.alumni_id.slice(0, 8).toUpperCase()}`}
          </p>
          <span className="mt-3 inline-flex items-center rounded-md border border-[#159570]/30 bg-[#159570]/8 px-2.5 py-1 text-xs font-semibold text-[#159570]">
            Verified Alumni
          </span>

          <div className="mt-3 w-full">
            <StatusNote section="photo" />
          </div>
        </div>

        <div>
          <div className="mb-2 flex items-center justify-between text-xs font-semibold tracking-wide text-muted-foreground uppercase">
            <span>Profile completion</span>
            <span className="text-primary">{completion}%</span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-secondary">
            <div
              className="h-full rounded-full bg-[#36babc] transition-[width] duration-300"
              style={{ width: `${completion}%` }}
            />
          </div>
        </div>

        <nav className="space-y-1" aria-label="Profile sections">
          {navItems.map((item) => {
            const status = sectionStatus[item.id]
            const active = activeSection === item.id
            const Icon = item.icon
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setActiveSection(item.id)}
                className={cn(
                  "flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm transition-colors",
                  active
                    ? "bg-primary/8 font-semibold text-primary"
                    : "text-muted-foreground hover:bg-muted/60 hover:text-foreground",
                )}
              >
                <Icon className="size-4 shrink-0" />
                <span className="min-w-0 flex-1 truncate">{item.label}</span>
                {status.done ? (
                  <Check
                    className="size-4 shrink-0 text-[#159570]"
                    aria-label="Complete"
                  />
                ) : (
                  <span className="shrink-0 text-[11px] font-semibold text-muted-foreground">
                    {status.pct}%
                  </span>
                )}
              </button>
            )
          })}
        </nav>

        <div className="mt-auto rounded-xl border border-border bg-[#f6f8fb] p-4 dark:bg-muted/40">
          <div className="flex items-start gap-3">
            <Sparkles className="mt-0.5 size-4 shrink-0 text-[#1e8f97]" />
            <div>
              <p className="text-xs font-semibold tracking-wide text-primary uppercase">
                AI Profile Assistant
              </p>
              <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                Complete each section to strengthen your alumni directory
                presence and Digital ID.
              </p>
            </div>
          </div>
        </div>

        <Link
          to="/card"
          className={cn(
            buttonVariants({ variant: "outline" }),
            "w-full rounded-[11px]",
          )}
        >
          Digital ID
        </Link>
      </aside>

      {/* Main panel */}
      <section className="portal-card p-6 sm:p-8">
        <header className="mb-10">
          <p className="text-[11px] font-semibold tracking-[0.16em] text-[#1e8f97] uppercase">
            {meta.eyebrow}
          </p>
          <h1 className="mt-2.5 font-display text-3xl font-semibold tracking-tight text-primary sm:text-[2.15rem]">
            {meta.title}
          </h1>
          <p className="mt-3 max-w-xl text-[15px] leading-relaxed text-muted-foreground">
            {meta.description}
          </p>
        </header>

        {activeSection === "personal" ? (
          <form
            id="profile-personal-form"
            onSubmit={onSaveProfile}
            className="grid gap-5 sm:grid-cols-2"
          >
            <div className="space-y-1.5">
              <AuthFieldLabel htmlFor="phone_number">Phone</AuthFieldLabel>
              <PhoneInput
                id="phone_number"
                international
                defaultCountry="PK"
                value={phoneNumber}
                onChange={(value) => setPhoneNumber(value)}
              />
            </div>
            <div className="space-y-1.5">
              <AuthFieldLabel htmlFor="whatsapp_number">
                WhatsApp
              </AuthFieldLabel>
              <PhoneInput
                id="whatsapp_number"
                international
                defaultCountry="PK"
                value={whatsappNumber}
                onChange={(value) => setWhatsappNumber(value)}
              />
            </div>
            <div className="space-y-1.5">
              <AuthFieldLabel htmlFor="country">Country</AuthFieldLabel>
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
              <AuthFieldLabel htmlFor="city">City</AuthFieldLabel>
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
              <AuthFieldLabel htmlFor="gender">Gender</AuthFieldLabel>
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
            <div className="sm:col-span-2 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="w-full sm:flex-1">
                <StatusNote section="personal" />
              </div>
              <div className="flex shrink-0 gap-2">
                <Button
                  type="button"
                  variant="outline"
                  disabled={savingProfile}
                  onClick={(event) => void onNextPersonal(event)}
                >
                  {personalSaveAction === "next" ? (
                    <span className="inline-flex items-center gap-2">
                      <Loader2 className="size-4 animate-spin" />
                      Saving…
                    </span>
                  ) : (
                    "Next"
                  )}
                </Button>
                <Button type="submit" disabled={savingProfile}>
                  {personalSaveAction === "save" ? (
                    <span className="inline-flex items-center gap-2">
                      <Loader2 className="size-4 animate-spin" />
                      Saving…
                    </span>
                  ) : (
                    "Save"
                  )}
                </Button>
              </div>
            </div>
          </form>
        ) : null}

        {activeSection === "academic" ? (
          <div className="space-y-5">
            <div className="flex items-center justify-between gap-3">
              <p className="text-sm text-muted-foreground">
                {academic.length} record{academic.length === 1 ? "" : "s"}
              </p>
              <Button
                type="button"
                variant="outline"
                size="icon"
                aria-label={
                  addingAcademic
                    ? "Hide add academic form"
                    : "Add academic information"
                }
                aria-expanded={addingAcademic}
                onClick={() => setAddingAcademic((open) => !open)}
              >
                {addingAcademic ? (
                  <Minus className="size-4" />
                ) : (
                  <Plus className="size-4" />
                )}
              </Button>
            </div>

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
                      <p className="font-semibold text-primary">
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
                        <p className="mt-1 text-xs font-medium text-[#1e8f97]">
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
                className="grid gap-4 rounded-xl border border-dashed border-border p-4 sm:grid-cols-2"
              >
                <div className="space-y-1.5 sm:col-span-2">
                  <AuthFieldLabel htmlFor="degree_program_id">
                    Degree program
                  </AuthFieldLabel>
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
                <Field
                  label="Roll number"
                  name="registration_roll_number"
                  required
                />
                <div className="space-y-1.5">
                  <AuthFieldLabel htmlFor="registration_year">
                    Registration year
                  </AuthFieldLabel>
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
                  <AuthFieldLabel htmlFor="graduation_year">
                    Graduation year
                  </AuthFieldLabel>
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
                <div className="sm:col-span-2 flex justify-end gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    disabled={savingAcademic}
                    onClick={() => setAddingAcademic(false)}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={
                      savingAcademic ||
                      !newDegreeId ||
                      !newRegYear ||
                      !newGradYear
                    }
                  >
                    {savingAcademic ? (
                      <span className="inline-flex items-center gap-2">
                        <Loader2 className="size-4 animate-spin" />
                        Saving…
                      </span>
                    ) : (
                      "Save"
                    )}
                  </Button>
                </div>
              </form>
            ) : null}
          </div>
        ) : null}

        {activeSection === "professional" ? (
          <div className="space-y-5">
            <div className="flex items-center justify-between gap-3">
              <p className="text-sm text-muted-foreground">
                {professional.length} record
                {professional.length === 1 ? "" : "s"}
              </p>
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
                {addingProfessional ? (
                  <Minus className="size-4" />
                ) : (
                  <Plus className="size-4" />
                )}
              </Button>
            </div>

            {!addingProfessional ? (
              <StatusNote section="professional" />
            ) : null}

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
                      <p className="font-semibold text-primary">
                        {row.job_title || row.role || "Role not specified"}
                      </p>
                      <p className="mt-1 text-muted-foreground">
                        {[row.current_company, row.role]
                          .filter(Boolean)
                          .join(" · ")}
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
                          setProfessional(
                            await careerService.listProfessional(),
                          )
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
                className="grid gap-4 rounded-xl border border-dashed border-border p-4 sm:grid-cols-2"
              >
                <Field label="Company" name="current_company" />
                <Field label="Job title" name="job_title" />
                <Field label="Role" name="role" />
                <Field
                  label="Start date"
                  name="start_date"
                  type="date"
                  required
                />
                <div className="sm:col-span-2 flex flex-col items-end gap-3">
                  <div className="w-full">
                    <StatusNote section="professional" />
                  </div>
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      disabled={savingProfessional}
                      onClick={() => setAddingProfessional(false)}
                    >
                      Cancel
                    </Button>
                    <Button type="submit" disabled={savingProfessional}>
                      {savingProfessional ? (
                        <span className="inline-flex items-center gap-2">
                          <Loader2 className="size-4 animate-spin" />
                          Saving…
                        </span>
                      ) : (
                        "Save"
                      )}
                    </Button>
                  </div>
                </div>
              </form>
            ) : null}
          </div>
        ) : null}
      </section>
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
      <AuthFieldLabel htmlFor={name}>{label}</AuthFieldLabel>
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
