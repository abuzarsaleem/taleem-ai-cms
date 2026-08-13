import { useEffect, useMemo, useState } from "react"
import { Link, useNavigate, useParams } from "react-router-dom"
import { ArrowLeftIcon, ImageIcon } from "lucide-react"

import { useAuth } from "@/auth/AuthContext"
import { MultiSelectChecklist } from "@/components/admin/multi-select-checklist"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Field, FieldError, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Skeleton } from "@/components/ui/skeleton"
import { Switch } from "@/components/ui/switch"
import { Textarea } from "@/components/ui/textarea"
import { ApiError } from "@/lib/api"
import { cn } from "@/lib/utils"
import {
  catalogService,
  type CatalogCampus,
  type CatalogDegreeProgram,
} from "@/services/catalog.service"
import {
  eventService,
  type EventType,
} from "@/services/event.service"

const EVENT_TYPES: Array<{ value: EventType; label: string }> = [
  { value: "REUNION", label: "Reunion" },
  { value: "NETWORKING_DINNER", label: "Networking dinner" },
  { value: "GUEST_LECTURE", label: "Guest lecture" },
  { value: "OTHER", label: "Other" },
]

const GRADUATION_YEARS = Array.from({ length: 40 }, (_, index) => {
  const year = new Date().getFullYear() + 1 - index
  return String(year)
})

type FormErrors = Partial<
  Record<"title" | "event_date" | "start_time" | "venue", string>
>

function normalizeTime(value: string) {
  if (!value) return ""
  return value.length === 5 ? `${value}:00` : value
}

export default function EventFormPage() {
  const { id } = useParams()
  const isEdit = Boolean(id)
  const { token } = useAuth()
  const navigate = useNavigate()

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState("")
  const [errors, setErrors] = useState<FormErrors>({})

  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [eventType, setEventType] = useState<EventType>("OTHER")
  const [eventDate, setEventDate] = useState("")
  const [startTime, setStartTime] = useState("")
  const [endTime, setEndTime] = useState("")
  const [venue, setVenue] = useState("")
  const [guestSpeaker, setGuestSpeaker] = useState("")
  const [isDraft, setIsDraft] = useState(false)
  const [mediaId, setMediaId] = useState<string | undefined>()
  const [imagePreview, setImagePreview] = useState<string | null>(null)

  const [campuses, setCampuses] = useState<CatalogCampus[]>([])
  const [degreePrograms, setDegreePrograms] = useState<CatalogDegreeProgram[]>(
    [],
  )
  const [campusIds, setCampusIds] = useState<string[]>([])
  const [degreeProgramIds, setDegreeProgramIds] = useState<string[]>([])
  const [graduationYears, setGraduationYears] = useState<string[]>([])
  const [cities, setCities] = useState<string[]>([])

  useEffect(() => {
    let cancelled = false

    void (async () => {
      setLoading(true)
      setError("")
      try {
        const [campusList, programList] = await Promise.all([
          catalogService.listCampuses(),
          catalogService.listDegreePrograms(),
        ])
        if (cancelled) return
        setCampuses(campusList)
        setDegreePrograms(programList)

        if (token && id) {
          const item = await eventService.getById(token, id)
          if (cancelled) return
          setTitle(item.title)
          setDescription(item.description ?? "")
          setEventType(item.event_type)
          setEventDate(item.event_date.slice(0, 10))
          setStartTime(item.start_time.slice(0, 5))
          setEndTime(item.end_time ? item.end_time.slice(0, 5) : "")
          setVenue(item.venue)
          setGuestSpeaker(item.guest_speaker ?? "")
          setIsDraft(item.is_draft)
          setImagePreview(item.image_url)
          setCampusIds(item.target_criteria?.campus_ids ?? [])
          setDegreeProgramIds(item.target_criteria?.degree_program_ids ?? [])
          setGraduationYears(
            (item.target_criteria?.graduation_years ?? []).map(String),
          )
          setCities(item.target_criteria?.cities ?? [])
        }
      } catch (err) {
        if (!cancelled) {
          setError(
            err instanceof ApiError
              ? err.message
              : "Failed to load event form data",
          )
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()

    return () => {
      cancelled = true
    }
  }, [token, id])

  const cityOptions = useMemo(() => {
    const unique = Array.from(
      new Set(campuses.map((campus) => campus.city).filter(Boolean)),
    ).sort()
    return unique.map((city) => ({ value: city, label: city }))
  }, [campuses])

  const filteredDegreePrograms = useMemo(() => {
    if (!campusIds.length) return degreePrograms
    return degreePrograms.filter((program) =>
      campusIds.includes(program.campus_id),
    )
  }, [campusIds, degreePrograms])

  useEffect(() => {
    if (!campusIds.length) return
    setDegreeProgramIds((prev) =>
      prev.filter((programId) =>
        filteredDegreePrograms.some((program) => program.id === programId),
      ),
    )
  }, [campusIds, filteredDegreePrograms])

  async function handleImageChange(file: File | null) {
    if (!token || !file) return
    setUploading(true)
    setError("")
    try {
      const uploaded = await eventService.uploadImage(token, file)
      setMediaId(uploaded.media_id)
      setImagePreview(uploaded.public_url)
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to upload image")
    } finally {
      setUploading(false)
    }
  }

  function validate() {
    const next: FormErrors = {}
    if (title.trim().length < 3) next.title = "Title must be at least 3 characters"
    if (!eventDate) next.event_date = "Event date is required"
    if (!startTime) next.start_time = "Start time is required"
    if (venue.trim().length < 2) next.venue = "Venue is required"
    setErrors(next)
    return Object.keys(next).length === 0
  }

  function buildTargetCriteria() {
    const criteria = {
      ...(campusIds.length ? { campus_ids: campusIds } : {}),
      ...(degreeProgramIds.length
        ? { degree_program_ids: degreeProgramIds }
        : {}),
      ...(graduationYears.length
        ? { graduation_years: graduationYears.map(Number) }
        : {}),
      ...(cities.length ? { cities } : {}),
    }
    return Object.keys(criteria).length ? criteria : null
  }

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault()
    if (!token || !validate()) return

    setSaving(true)
    setError("")
    try {
      const body = {
        title: title.trim(),
        description: description.trim() || undefined,
        event_type: eventType,
        event_date: eventDate,
        start_time: normalizeTime(startTime),
        end_time: endTime ? normalizeTime(endTime) : undefined,
        venue: venue.trim(),
        guest_speaker: guestSpeaker.trim() || undefined,
        is_draft: isDraft,
        target_criteria: buildTargetCriteria(),
        ...(mediaId ? { media_id: mediaId } : {}),
      }

      if (isEdit && id) {
        await eventService.update(token, id, body)
        navigate(`/events/${id}`)
      } else {
        const created = await eventService.create(token, body)
        navigate(`/events/${created.id}`)
      }
    } catch (err) {
      setError(
        err instanceof ApiError
          ? err.message
          : isEdit
            ? "Failed to update event"
            : "Failed to create event",
      )
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex flex-1 flex-col gap-4 px-4 py-6 lg:px-6">
        <Skeleton className="h-8 w-40" />
        <Skeleton className="h-72 w-full" />
      </div>
    )
  }

  return (
    <div className="flex flex-1 flex-col gap-4 py-4 md:gap-6 md:py-6">
      <div className="flex flex-col gap-3 px-4 lg:px-6">
        <Button
          variant="outline"
          size="sm"
          className="w-fit"
          render={<Link to={isEdit && id ? `/events/${id}` : "/events"} />}
        >
          <ArrowLeftIcon />
          Back
        </Button>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            {isEdit ? "Edit event" : "New event"}
          </h1>
          <p className="text-sm text-muted-foreground">
            {isEdit
              ? "Update event details, targeting, and publish settings."
              : "Create an event and optionally target specific alumni."}
          </p>
        </div>
      </div>

      <form
        onSubmit={onSubmit}
        className="grid gap-4 px-4 lg:grid-cols-3 lg:px-6"
      >
        <div className="flex flex-col gap-4 lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Details</CardTitle>
              <CardDescription>Event information</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-4">
              <Field data-invalid={!!errors.title || undefined}>
                <FieldLabel htmlFor="title">Title</FieldLabel>
                <Input
                  id="title"
                  value={title}
                  onChange={(e) => {
                    setTitle(e.target.value)
                    setErrors((prev) => ({ ...prev, title: undefined }))
                  }}
                  placeholder="Annual Alumni Reunion 2026"
                  disabled={saving}
                />
                <FieldError>{errors.title}</FieldError>
              </Field>

              <Field>
                <FieldLabel htmlFor="description">Description</FieldLabel>
                <Textarea
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={6}
                  placeholder="Optional event description…"
                  disabled={saving}
                />
              </Field>

              <div className="grid gap-4 sm:grid-cols-2">
                <Field>
                  <FieldLabel htmlFor="event_type">Type</FieldLabel>
                  <select
                    id="event_type"
                    value={eventType}
                    onChange={(e) => setEventType(e.target.value as EventType)}
                    disabled={saving}
                    className="h-8 w-full rounded-lg border border-input bg-transparent px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 dark:bg-input/30"
                  >
                    {EVENT_TYPES.map((item) => (
                      <option key={item.value} value={item.value}>
                        {item.label}
                      </option>
                    ))}
                  </select>
                </Field>

                <Field data-invalid={!!errors.event_date || undefined}>
                  <FieldLabel htmlFor="event_date">Date</FieldLabel>
                  <Input
                    id="event_date"
                    type="date"
                    value={eventDate}
                    onChange={(e) => {
                      setEventDate(e.target.value)
                      setErrors((prev) => ({ ...prev, event_date: undefined }))
                    }}
                    disabled={saving}
                  />
                  <FieldError>{errors.event_date}</FieldError>
                </Field>

                <Field data-invalid={!!errors.start_time || undefined}>
                  <FieldLabel htmlFor="start_time">Start time</FieldLabel>
                  <Input
                    id="start_time"
                    type="time"
                    value={startTime}
                    onChange={(e) => {
                      setStartTime(e.target.value)
                      setErrors((prev) => ({ ...prev, start_time: undefined }))
                    }}
                    disabled={saving}
                  />
                  <FieldError>{errors.start_time}</FieldError>
                </Field>

                <Field>
                  <FieldLabel htmlFor="end_time">End time</FieldLabel>
                  <Input
                    id="end_time"
                    type="time"
                    value={endTime}
                    onChange={(e) => setEndTime(e.target.value)}
                    disabled={saving}
                  />
                </Field>
              </div>

              <Field data-invalid={!!errors.venue || undefined}>
                <FieldLabel htmlFor="venue">Venue</FieldLabel>
                <Input
                  id="venue"
                  value={venue}
                  onChange={(e) => {
                    setVenue(e.target.value)
                    setErrors((prev) => ({ ...prev, venue: undefined }))
                  }}
                  placeholder="Main Campus Auditorium"
                  disabled={saving}
                />
                <FieldError>{errors.venue}</FieldError>
              </Field>

              <Field>
                <FieldLabel htmlFor="guest_speaker">Guest speaker</FieldLabel>
                <Input
                  id="guest_speaker"
                  value={guestSpeaker}
                  onChange={(e) => setGuestSpeaker(e.target.value)}
                  placeholder="Optional"
                  disabled={saving}
                />
              </Field>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Target criteria</CardTitle>
              <CardDescription>
                Leave empty to target all alumni. Options come from catalog APIs.
              </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-5 md:grid-cols-2">
              <MultiSelectChecklist
                title="Campuses"
                description="From GET /catalog/campuses"
                values={campusIds}
                disabled={saving}
                onChange={setCampusIds}
                options={campuses.map((campus) => ({
                  value: campus.id,
                  label: campus.name,
                  hint: `${campus.code} · ${campus.city}`,
                }))}
              />

              <MultiSelectChecklist
                title="Degree programs"
                description={
                  campusIds.length
                    ? "Filtered by selected campuses"
                    : "From GET /catalog/degree-programs"
                }
                values={degreeProgramIds}
                disabled={saving}
                onChange={setDegreeProgramIds}
                options={filteredDegreePrograms.map((program) => ({
                  value: program.id,
                  label: program.label,
                }))}
                emptyText="No degree programs found"
              />

              <MultiSelectChecklist
                title="Graduation years"
                description="Select one or more class years"
                values={graduationYears}
                disabled={saving}
                onChange={setGraduationYears}
                options={GRADUATION_YEARS.map((year) => ({
                  value: year,
                  label: year,
                }))}
              />

              <MultiSelectChecklist
                title="Cities"
                description="Derived from campus cities in catalog"
                values={cities}
                disabled={saving}
                onChange={setCities}
                options={cityOptions}
                emptyText="No cities found in campus catalog"
              />
            </CardContent>
          </Card>
        </div>

        <div className="flex flex-col gap-4">
          <Card>
            <CardHeader>
              <CardTitle>Publish</CardTitle>
              <CardDescription>Draft or live event</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-4">
              <div className="flex items-center justify-between gap-3 rounded-lg border px-3 py-2">
                <div>
                  <Label htmlFor="is_draft">Save as draft</Label>
                  <p className="text-xs text-muted-foreground">
                    Drafts are hidden from alumni
                  </p>
                </div>
                <Switch
                  id="is_draft"
                  checked={isDraft}
                  onCheckedChange={setIsDraft}
                  disabled={saving}
                />
              </div>

              {error ? <p className="text-sm text-destructive">{error}</p> : null}

              <Button type="submit" disabled={saving || uploading}>
                {saving
                  ? "Saving…"
                  : isEdit
                    ? "Save changes"
                    : "Create event"}
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Image</CardTitle>
              <CardDescription>Optional cover image</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-3">
              {imagePreview ? (
                <img
                  src={imagePreview}
                  alt="Event preview"
                  className="aspect-video w-full rounded-lg border object-cover"
                />
              ) : (
                <div className="flex aspect-video flex-col items-center justify-center gap-2 rounded-lg border border-dashed bg-muted/40 text-muted-foreground">
                  <ImageIcon className="size-8" />
                  <span className="text-xs">No image selected</span>
                </div>
              )}
              <Input
                type="file"
                accept="image/jpeg,image/png,image/webp"
                disabled={saving || uploading}
                onChange={(e) => {
                  const file = e.target.files?.[0] ?? null
                  void handleImageChange(file)
                }}
              />
              <p
                className={cn(
                  "text-xs text-muted-foreground",
                  uploading && "text-foreground",
                )}
              >
                {uploading ? "Uploading…" : "JPEG, PNG, or WEBP up to 5MB"}
              </p>
            </CardContent>
          </Card>
        </div>
      </form>
    </div>
  )
}
