import { Check, Building2, MapPin, Plus, Search, SlidersHorizontal, X } from "lucide-react"
import { useEffect, useMemo, useState } from "react"
import { useSearchParams } from "react-router-dom"
import { toast } from "sonner"

import { SearchableSelect } from "@/components/searchable-select"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { YearPicker } from "@/components/ui/year-picker"
import { ApiError } from "@/lib/api-client"
import {
  MAX_GRADUATION_YEAR,
  MIN_GRADUATION_YEAR,
} from "@/lib/registration-validation"
import { cn } from "@/lib/utils"
import { catalogService } from "@/services/catalog.service"
import { contactRequestService } from "@/services/contact-requests.service"
import { directoryService } from "@/services/directory.service"
import { profileService } from "@/services/profile.service"
import type { Campus, DegreeProgram, DirectoryAlumni } from "@/types/portal"

const avatarTones = [
  "from-[#dce9ff] to-[#c5d9ff] text-[#174ea6]",
  "from-[#d4f5f1] to-[#b8ebe4] text-[#0b6e6a]",
  "from-[#e8e4ff] to-[#d4cef8] text-[#4b3f9a]",
  "from-[#ffe8d6] to-[#ffd4b8] text-[#9a4d1c]",
]

function initials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("")
}

function degreeShort(label?: string | null) {
  return label?.split(" — ")[0] ?? null
}

/** "Chak Shahzad Campus, Islamabad" → "Chak Shahzad Campus" */
function campusShortName(campus?: Campus | null) {
  if (!campus?.name) return null
  return campus.name.split(",")[0].trim()
}

function resolveCampus(
  alumni: DirectoryAlumni,
  programs: DegreeProgram[],
  campusesById: Map<string, Campus>,
) {
  const programId = alumni.academic[0]?.degree_program_id
  if (!programId) return null
  const program = programs.find((p) => p.id === programId)
  if (!program?.campus_id) return null
  return campusesById.get(program.campus_id) ?? null
}

function roleLine(alumni: DirectoryAlumni) {
  const role =
    alumni.professional[0]?.job_title ??
    alumni.professional[0]?.role ??
    alumni.primary_role
  const company = alumni.professional[0]?.current_company
  // Skip cryptic program codes like "SE" when no real job title
  const looksLikeCode = Boolean(role && /^[A-Z]{2,4}$/.test(role.trim()))
  const safeRole = looksLikeCode ? null : role
  if (safeRole && company) return `${safeRole} · ${company}`
  return safeRole || company || null
}

function locationParts(
  alumni: DirectoryAlumni,
  campus: Campus | null,
) {
  const campusLabel = campusShortName(campus)
  let city = alumni.city?.trim() || null

  // City sometimes stores the campus nickname (e.g. "Chak Shahzad")
  if (city) {
    const cityKey = city.toLowerCase().replace(/\s+/g, "")
    const campusKey = (campusLabel ?? "")
      .toLowerCase()
      .replace(/\s+/g, "")
      .replace(/campus$/, "")
    const isCampusNickname =
      /chakshah?zad/.test(cityKey) ||
      Boolean(campusKey && (cityKey === campusKey || campusKey.includes(cityKey)))

    if (isCampusNickname) {
      city = campus?.city ?? null
    }
  }

  if (!city) city = campus?.city ?? alumni.country ?? null

  return { city, campusLabel, campusFull: campus?.name ?? null }
}

function profileTags(
  alumni: DirectoryAlumni,
  degreeLabels: Map<string, string>,
  campus: Campus | null,
) {
  const tags: string[] = []
  const degree = degreeShort(
    degreeLabels.get(alumni.academic[0]?.degree_program_id ?? ""),
  )
  const year =
    alumni.primary_graduation_year ?? alumni.academic[0]?.graduation_year
  const campusTag = campusShortName(campus)
  if (degree) tags.push(degree)
  if (year) tags.push(String(year))
  if (campusTag) tags.push(campusTag)
  return tags.slice(0, 3)
}

function AvatarBlock({
  alumni,
  index,
  size = "md",
}: {
  alumni: DirectoryAlumni
  index?: number
  size?: "md" | "lg" | "xl"
}) {
  const sizes = {
    md: "size-14 text-sm",
    lg: "size-[4.5rem] text-lg",
    xl: "size-20 text-xl",
  }
  const tone = avatarTones[(index ?? 0) % avatarTones.length]

  if (alumni.photo_url) {
    return (
      <img
        src={alumni.photo_url}
        alt=""
        className={cn(
          "rounded-2xl object-cover ring-2 ring-white shadow-[0_8px_20px_rgba(8,27,69,0.12)]",
          sizes[size],
        )}
      />
    )
  }

  return (
    <div
      className={cn(
        "flex items-center justify-center rounded-2xl bg-gradient-to-br font-extrabold shadow-[0_8px_20px_rgba(8,27,69,0.08)] ring-2 ring-white",
        sizes[size],
        tone,
      )}
    >
      {initials(alumni.full_name)}
    </div>
  )
}

type ContactChannel = "email" | "mobile" | "whatsapp"

export function DirectoryPage() {
  const [searchParams] = useSearchParams()
  const initialName = searchParams.get("name") ?? ""
  const [items, setItems] = useState<DirectoryAlumni[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [pageSize] = useState(12)
  const [degreePrograms, setDegreePrograms] = useState<DegreeProgram[]>([])
  const [campuses, setCampuses] = useState<Campus[]>([])
  const [degreeLabels, setDegreeLabels] = useState<Map<string, string>>(
    new Map(),
  )
  const [filterOptions, setFilterOptions] = useState<{
    cities: string[]
    countries: string[]
    graduation_years: string[]
  }>({ cities: [], countries: [], graduation_years: [] })

  const [name, setName] = useState(initialName)
  const [graduationYear, setGraduationYear] = useState("")
  const [degreeProgramId, setDegreeProgramId] = useState("")
  const [campusId, setCampusId] = useState("")
  const [city, setCity] = useState("")
  const [country, setCountry] = useState("")
  const [filtersOpen, setFiltersOpen] = useState(false)
  const [applied, setApplied] = useState({
    name: "",
    graduation_year: "",
    degree_program_id: "",
    city: "",
    country: "",
  })

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [myAlumniId, setMyAlumniId] = useState<string | null>(null)
  const [pendingTargets, setPendingTargets] = useState<Set<string>>(new Set())

  const [profileTarget, setProfileTarget] = useState<DirectoryAlumni | null>(
    null,
  )
  const [contactTarget, setContactTarget] = useState<DirectoryAlumni | null>(
    null,
  )
  const [contactReason, setContactReason] = useState("")
  const [contactChannels, setContactChannels] = useState<ContactChannel[]>([
    "email",
  ])
  const [contactBusy, setContactBusy] = useState(false)

  const campusesById = useMemo(
    () => new Map(campuses.map((campus) => [campus.id, campus])),
    [campuses],
  )

  const campusProgramIds = useMemo(() => {
    if (!campusId) return null
    return new Set(
      degreePrograms
        .filter((p) => p.campus_id === campusId)
        .map((p) => p.id),
    )
  }, [campusId, degreePrograms])

  const visibleItems = useMemo(() => {
    if (!campusProgramIds) return items
    return items.filter((alumni) =>
      alumni.academic.some((row) =>
        campusProgramIds.has(row.degree_program_id),
      ),
    )
  }, [items, campusProgramIds])

  useEffect(() => {
    void Promise.all([
      catalogService.listDegreePrograms(),
      catalogService.listCampuses(),
    ]).then(([programs, campusList]) => {
      setDegreePrograms(programs)
      setCampuses(campusList)
      setDegreeLabels(new Map(programs.map((p) => [p.id, p.label])))
    })
    void directoryService.filterOptions().then(setFilterOptions).catch(() => {})
    void profileService.getMyProfile().then((profile) => {
      setMyAlumniId(profile.alumni_id)
    })
    void contactRequestService
      .listSent()
      .then((sent) => {
        setPendingTargets(
          new Set(
            sent
              .filter((r) =>
                ["PENDING_ADMIN", "APPROVED", "PENDING"].includes(r.status),
              )
              .map((r) => r.target_alumni_id),
          ),
        )
      })
      .catch(() => {})
  }, [])

  useEffect(() => {
    let cancelled = false
    async function load() {
      setLoading(true)
      setError("")
      try {
        const result = await directoryService.list({
          page,
          page_size: pageSize,
          name: applied.name || undefined,
          graduation_year: applied.graduation_year || undefined,
          degree_program_id: applied.degree_program_id || undefined,
          city: applied.city || undefined,
          country: applied.country || undefined,
        })
        if (cancelled) return
        setItems(result.items)
        setTotal(result.total)
      } catch (err) {
        if (!cancelled) {
          setError(
            err instanceof ApiError ? err.message : "Failed to load directory",
          )
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    void load()
    return () => {
      cancelled = true
    }
  }, [applied, page, pageSize])

  const totalPages = useMemo(
    () => Math.max(1, Math.ceil(total / pageSize)),
    [total, pageSize],
  )

  function applyFilters(event?: React.FormEvent) {
    event?.preventDefault()
    setPage(1)
    setApplied({
      name: name.trim(),
      graduation_year: graduationYear.trim(),
      degree_program_id: degreeProgramId,
      city: city.trim(),
      country: country.trim(),
    })
  }

  function clearFilters() {
    setName("")
    setGraduationYear("")
    setDegreeProgramId("")
    setCampusId("")
    setCity("")
    setCountry("")
    setPage(1)
    setApplied({
      name: "",
      graduation_year: "",
      degree_program_id: "",
      city: "",
      country: "",
    })
  }

  function toggleChannel(channel: ContactChannel) {
    setContactChannels((current) => {
      if (current.includes(channel)) {
        if (current.length === 1) return current
        return current.filter((item) => item !== channel)
      }
      return [...current, channel]
    })
  }

  async function submitContactRequest() {
    if (!contactTarget) return
    if (contactReason.trim().length < 5) {
      toast.error("Please explain the purpose of your request")
      return
    }
    setContactBusy(true)
    try {
      await contactRequestService.create({
        target_alumni_id: contactTarget.alumni_id,
        request_reason: contactReason.trim(),
        requested_fields: contactChannels,
      })
      setPendingTargets((prev) => new Set(prev).add(contactTarget.alumni_id))
      toast.success("Contact request sent")
      setContactTarget(null)
      setProfileTarget(null)
      setContactReason("")
      setContactChannels(["email"])
    } catch (err) {
      toast.error(
        err instanceof ApiError ? err.message : "Failed to send request",
      )
    } finally {
      setContactBusy(false)
    }
  }

  useEffect(() => {
    const q = searchParams.get("name") ?? ""
    setName(q)
    setApplied((prev) => ({ ...prev, name: q }))
    setPage(1)
  }, [searchParams])

  const profileIndex = profileTarget
    ? visibleItems.findIndex((a) => a.alumni_id === profileTarget.alumni_id)
    : 0

  return (
    <div className="relative mx-auto max-w-6xl">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-44 overflow-hidden rounded-[1.5rem] opacity-90"
      >
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(54,186,188,0.14),transparent_55%),radial-gradient(ellipse_at_top_left,rgba(8,27,69,0.07),transparent_50%)]" />
        <div
          className="absolute inset-0 opacity-[0.3]"
          style={{
            backgroundImage:
              "radial-gradient(circle at 1px 1px, rgba(8,27,69,0.06) 1px, transparent 0)",
            backgroundSize: "22px 22px",
          }}
        />
      </div>

      <div className="relative space-y-8 px-5 pt-5 sm:px-6 sm:pt-6">
        <header className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between sm:gap-8">
          <div className="min-w-0 max-w-2xl">
            <p className="text-[11px] font-bold tracking-[0.18em] text-[#1e8f97] uppercase">
              Community
            </p>
            <h1 className="mt-2.5 font-display text-[2rem] leading-[1.15] font-semibold tracking-tight text-primary sm:text-[2.35rem]">
              Alumni Directory
            </h1>
            <p className="mt-3 text-[15px] leading-relaxed text-muted-foreground">
              Discover verified alumni by profession, program, campus and more.
            </p>
          </div>
          {total > 0 ? (
            <div className="inline-flex items-center gap-2 self-start rounded-full border border-emerald-200/80 bg-white/95 px-3.5 py-2 shadow-[0_8px_24px_rgba(21,149,112,0.08)] backdrop-blur-sm sm:mt-8">
              <span className="grid size-6 place-items-center rounded-full bg-emerald-100 text-emerald-700">
                <Check className="size-3.5" strokeWidth={2.75} />
              </span>
              <span className="text-sm font-semibold text-emerald-900">
                {total.toLocaleString()}{" "}
                <span className="font-medium text-emerald-700/90">
                  verified alumni
                </span>
              </span>
            </div>
          ) : null}
        </header>

        <form
          onSubmit={applyFilters}
          className="rounded-[1.35rem] border border-white/70 bg-white/95 p-3.5 shadow-[0_18px_50px_rgba(8,27,69,0.07)] ring-1 ring-[#dfe7f2] backdrop-blur-sm sm:p-4"
        >
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-[minmax(0,1.35fr)_minmax(11rem,0.85fr)_minmax(11rem,0.85fr)_auto]">
            <div className="relative min-w-0 sm:col-span-2 xl:col-span-1">
              <Search className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-[#8a97ab]" />
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Search by name, organization, profession…"
                className="h-12 rounded-xl border-[#e2e8f0] bg-[#f7f9fc] pl-11 text-[15px] shadow-none focus-visible:bg-white"
              />
            </div>
            <SearchableSelect
              value={campusId}
              onChange={setCampusId}
              options={campuses.map((campus) => ({
                value: campus.id,
                label: campus.name,
              }))}
              placeholder="All campuses"
              searchPlaceholder="Search campus…"
              allowEmpty
              emptyLabel="All campuses"
              className="h-12 w-full rounded-xl border-[#e2e8f0] bg-[#f7f9fc] px-3.5"
            />
            <SearchableSelect
              value={city}
              onChange={setCity}
              options={filterOptions.cities.map((value) => ({
                value,
                label: value,
              }))}
              placeholder="All cities"
              searchPlaceholder="Search city…"
              allowEmpty
              emptyLabel="All cities"
              className="h-12 w-full rounded-xl border-[#e2e8f0] bg-[#f7f9fc] px-3.5"
            />
            <div className="flex gap-3 sm:col-span-2 xl:col-span-1">
              <Button
                type="button"
                variant="outline"
                className={cn(
                  "h-12 shrink-0 rounded-xl border-[#d7e0ec] bg-white px-4 font-semibold",
                  filtersOpen && "border-primary/25 bg-primary/[0.04]",
                )}
                onClick={() => setFiltersOpen((open) => !open)}
              >
                <SlidersHorizontal className="mr-1.5 size-4" />
                Filters
                {filtersOpen ? null : (
                  <Plus className="ml-1 size-3.5 opacity-60" />
                )}
              </Button>
              <Button
                type="submit"
                className="h-12 min-w-[6.5rem] flex-1 rounded-xl px-6 font-semibold shadow-[0_10px_22px_rgba(8,27,69,0.18)] xl:flex-none"
              >
                Search
              </Button>
            </div>
          </div>

          {filtersOpen ? (
            <div className="mt-4 grid animate-in fade-in slide-in-from-top-1 gap-3 border-t border-[#eef2f7] pt-4 duration-200 sm:grid-cols-2 lg:grid-cols-4">
              {filterOptions.graduation_years.length > 0 ? (
                <SearchableSelect
                  value={graduationYear}
                  onChange={setGraduationYear}
                  options={filterOptions.graduation_years.map((year) => ({
                    value: year,
                    label: year,
                  }))}
                  placeholder="All graduation years"
                  searchPlaceholder="Search year…"
                  allowEmpty
                  emptyLabel="All graduation years"
                  className="h-11 rounded-xl"
                />
              ) : (
                <YearPicker
                  value={graduationYear}
                  onChange={setGraduationYear}
                  minYear={MIN_GRADUATION_YEAR}
                  maxYear={MAX_GRADUATION_YEAR}
                  placeholder="Graduation year"
                />
              )}
              <SearchableSelect
                value={degreeProgramId}
                onChange={setDegreeProgramId}
                options={degreePrograms.map((program) => ({
                  value: program.id,
                  label: program.label,
                }))}
                placeholder="All degree programs"
                searchPlaceholder="Search program…"
                allowEmpty
                emptyLabel="All degree programs"
                className="h-11 rounded-xl"
              />
              {filterOptions.countries.length > 0 ? (
                <SearchableSelect
                  value={country}
                  onChange={setCountry}
                  options={filterOptions.countries.map((value) => ({
                    value,
                    label: value,
                  }))}
                  placeholder="All countries"
                  searchPlaceholder="Search country…"
                  allowEmpty
                  emptyLabel="All countries"
                  className="h-11 rounded-xl"
                />
              ) : (
                <Input
                  value={country}
                  onChange={(e) => setCountry(e.target.value)}
                  placeholder="Country"
                  className="h-11 rounded-xl"
                />
              )}
              <Button
                type="button"
                variant="ghost"
                className="h-11 rounded-xl text-muted-foreground hover:text-primary"
                onClick={clearFilters}
              >
                Clear all
              </Button>
            </div>
          ) : null}
        </form>

        {loading ? (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div
                key={i}
                className="h-[300px] animate-pulse rounded-[1.35rem] bg-gradient-to-br from-[#e4ebf5] to-[#edf2f8]"
              />
            ))}
          </div>
        ) : error ? (
          <Card>
            <CardHeader>
              <CardTitle>Directory unavailable</CardTitle>
              <CardDescription>{error}</CardDescription>
            </CardHeader>
          </Card>
        ) : visibleItems.length === 0 ? (
          <div className="rounded-[1.35rem] border border-dashed border-[#cfd9e8] bg-white/80 px-8 py-16 text-center">
            <div className="mx-auto mb-3 grid size-12 place-items-center rounded-2xl bg-[#eef3fa] text-primary">
              <Search className="size-5" />
            </div>
            <p className="font-semibold text-primary">No alumni found</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Try a different name, campus, or clear your filters.
            </p>
          </div>
        ) : (
          <>
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {visibleItems.map((alumni, index) => {
                const campus = resolveCampus(
                  alumni,
                  degreePrograms,
                  campusesById,
                )
                const tags = profileTags(alumni, degreeLabels, campus)
                const role = roleLine(alumni)
                const { city, campusLabel } = locationParts(alumni, campus)

                return (
                  <article
                    key={alumni.alumni_id}
                    className="group relative flex min-h-[300px] flex-col overflow-hidden rounded-[1.35rem] border border-[#e6ecf4] bg-white shadow-[0_14px_40px_rgba(8,27,69,0.06)] transition duration-300 hover:-translate-y-1 hover:border-[#c9d6e8] hover:shadow-[0_22px_50px_rgba(8,27,69,0.12)]"
                    style={{ animationDelay: `${Math.min(index, 8) * 40}ms` }}
                  >
                    <div
                      aria-hidden
                      className="h-16 bg-[linear-gradient(135deg,#081b45_0%,#173b79_48%,#1e8f97_120%)] opacity-[0.92]"
                    />
                    <div
                      aria-hidden
                      className="pointer-events-none absolute top-0 right-0 h-16 w-32 bg-[radial-gradient(circle_at_top_right,rgba(127,226,222,0.35),transparent_70%)]"
                    />

                    <div className="relative -mt-8 flex flex-1 flex-col px-5 pb-5">
                      <div className="flex items-start justify-between gap-3">
                        <AvatarBlock alumni={alumni} index={index} size="lg" />
                        <span className="mt-10 grid size-7 place-items-center rounded-full bg-emerald-50 text-emerald-700 ring-2 ring-white shadow-sm">
                          <Check className="size-3.5" strokeWidth={2.75} />
                        </span>
                      </div>

                      <h2 className="mt-4 font-display text-[1.2rem] leading-snug font-semibold tracking-tight text-primary capitalize">
                        {alumni.full_name}
                      </h2>

                      <p className="mt-1.5 line-clamp-2 text-sm leading-snug text-[#5b6b82]">
                        {role || "Verified alumni member"}
                      </p>

                      {city || campusLabel ? (
                        <div className="mt-2 space-y-1 text-[13px] text-muted-foreground">
                          {city ? (
                            <p className="flex items-center gap-1.5">
                              <MapPin className="size-3.5 shrink-0 text-[#36babc]" />
                              <span className="truncate">{city}</span>
                            </p>
                          ) : null}
                          {campusLabel ? (
                            <p className="flex items-center gap-1.5">
                              <Building2 className="size-3.5 shrink-0 text-[#36babc]" />
                              <span className="truncate">{campusLabel}</span>
                            </p>
                          ) : null}
                        </div>
                      ) : null}

                      {tags.length > 0 ? (
                        <div className="mt-4 flex flex-wrap gap-1.5">
                          {tags.map((tag) => (
                            <span
                              key={tag}
                              className="rounded-full bg-[#eef4fb] px-2.5 py-1 text-[11px] font-semibold tracking-wide text-[#2a3f63]"
                            >
                              {tag}
                            </span>
                          ))}
                        </div>
                      ) : null}

                      <div className="mt-auto pt-5">
                        <Button
                          type="button"
                          className="h-11 w-full rounded-xl bg-primary font-semibold shadow-[0_10px_22px_rgba(8,27,69,0.16)] transition group-hover:bg-[#0c2558]"
                          onClick={() => setProfileTarget(alumni)}
                        >
                          View profile
                        </Button>
                      </div>
                    </div>
                  </article>
                )
              })}
            </div>

            <div className="flex items-center justify-between gap-3 rounded-2xl border border-[#e6ecf4] bg-white/80 px-4 py-3">
              <p className="text-sm text-muted-foreground">
                Page <span className="font-semibold text-primary">{page}</span> of{" "}
                <span className="font-semibold text-primary">{totalPages}</span>
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  className="rounded-xl"
                  disabled={page <= 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  className="rounded-xl"
                  disabled={page >= totalPages}
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                >
                  Next
                </Button>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Profile preview modal */}
      <Dialog
        open={Boolean(profileTarget)}
        onOpenChange={(open) => {
          if (!open) setProfileTarget(null)
        }}
      >
        <DialogContent
          showCloseButton={false}
          className="gap-0 overflow-hidden rounded-[1.35rem] border-[#e6ecf4] p-0 shadow-[0_30px_80px_rgba(8,27,69,0.22)] sm:max-w-lg"
        >
          {profileTarget ? (
            <>
              <div className="relative h-24 bg-[linear-gradient(135deg,#081b45_0%,#173b79_50%,#1e8f97_125%)]">
                <div
                  aria-hidden
                  className="absolute inset-0 opacity-30"
                  style={{
                    backgroundImage:
                      "radial-gradient(circle at 1px 1px, rgba(255,255,255,0.35) 1px, transparent 0)",
                    backgroundSize: "16px 16px",
                  }}
                />
                <button
                  type="button"
                  className="absolute top-3 right-3 grid size-8 place-items-center rounded-lg bg-white/15 text-white backdrop-blur-sm transition hover:bg-white/25"
                  onClick={() => setProfileTarget(null)}
                  aria-label="Close"
                >
                  <X className="size-4" />
                </button>
              </div>

              <div className="relative -mt-10 space-y-5 px-6 pb-2">
                {(() => {
                  const campus = resolveCampus(
                    profileTarget,
                    degreePrograms,
                    campusesById,
                  )
                  const { city, campusLabel } = locationParts(
                    profileTarget,
                    campus,
                  )
                  const title =
                    profileTarget.professional[0]?.job_title ??
                    profileTarget.professional[0]?.role ??
                    (profileTarget.primary_role &&
                    !/^[A-Z]{2,4}$/.test(profileTarget.primary_role.trim())
                      ? profileTarget.primary_role
                      : null) ??
                    "Alumni member"
                  const companyCity = [
                    profileTarget.professional[0]?.current_company,
                    city,
                  ]
                    .filter(Boolean)
                    .join(" · ")

                  return (
                    <>
                      <div className="flex items-end gap-4">
                        <AvatarBlock
                          alumni={profileTarget}
                          index={Math.max(profileIndex, 0)}
                          size="xl"
                        />
                        <div className="min-w-0 pb-1">
                          <DialogTitle className="font-display text-xl font-semibold tracking-tight text-primary capitalize">
                            {profileTarget.full_name}
                          </DialogTitle>
                          <p className="mt-0.5 text-sm font-medium text-[#3d4f6c]">
                            {title}
                          </p>
                        </div>
                      </div>

                      <div>
                        {companyCity ? (
                          <p className="text-sm text-muted-foreground">
                            {companyCity}
                          </p>
                        ) : null}
                        {campusLabel ? (
                          <p
                            className={cn(
                              "flex items-center gap-1.5 text-sm text-muted-foreground",
                              companyCity && "mt-1",
                            )}
                          >
                            <Building2 className="size-3.5 text-[#36babc]" />
                            {campusLabel}
                          </p>
                        ) : !companyCity ? (
                          <p className="text-sm text-muted-foreground">
                            Location unavailable
                          </p>
                        ) : null}
                        <span className="mt-2.5 inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-bold tracking-wide text-emerald-800 uppercase">
                          <Check className="size-3.5" strokeWidth={2.75} />
                          Verified Alumni
                        </span>
                      </div>

                      <div className="rounded-2xl border border-[#eef2f7] bg-[#f8fafc] p-4">
                        <h3 className="text-sm font-bold tracking-wide text-primary uppercase">
                          Professional profile
                        </h3>
                        <p className="mt-2 text-sm leading-relaxed text-[#5b6b82]">
                          Experienced professional with a background in their
                          field, open to meaningful alumni connections and
                          collaboration.
                        </p>
                        <div className="mt-3.5 flex flex-wrap gap-1.5">
                          {profileTags(
                            profileTarget,
                            degreeLabels,
                            campus,
                          ).map((tag) => (
                            <span
                              key={tag}
                              className="rounded-full bg-white px-2.5 py-1 text-[11px] font-semibold text-primary ring-1 ring-[#dce5f1]"
                            >
                              {tag}
                            </span>
                          ))}
                          <span className="rounded-full bg-[#e6f7f6] px-2.5 py-1 text-[11px] font-semibold text-[#0b6e6a] ring-1 ring-[#bfe9e5]">
                            Professional Network
                          </span>
                        </div>
                      </div>
                    </>
                  )
                })()}
              </div>

              <div className="flex justify-end gap-2 px-6 py-4">
                <Button
                  type="button"
                  variant="outline"
                  className="rounded-xl"
                  onClick={() => setProfileTarget(null)}
                >
                  Close
                </Button>
                {profileTarget.alumni_id !== myAlumniId ? (
                  profileTarget.is_contact_revealed ? (
                    <Button type="button" className="rounded-xl" disabled>
                      Connected
                    </Button>
                  ) : pendingTargets.has(profileTarget.alumni_id) ? (
                    <Button type="button" className="rounded-xl" disabled>
                      Request pending
                    </Button>
                  ) : (
                    <Button
                      type="button"
                      className="rounded-xl shadow-[0_10px_22px_rgba(8,27,69,0.18)]"
                      onClick={() => {
                        setContactTarget(profileTarget)
                        setContactReason("")
                        setContactChannels(["email"])
                      }}
                    >
                      Request contact
                    </Button>
                  )
                ) : null}
              </div>
            </>
          ) : null}
        </DialogContent>
      </Dialog>

      {/* Contact request modal */}
      <Dialog
        open={Boolean(contactTarget)}
        onOpenChange={(open) => {
          if (!open) setContactTarget(null)
        }}
      >
        <DialogContent
          showCloseButton={false}
          className="gap-0 overflow-hidden rounded-[1.35rem] border-[#e6ecf4] p-0 shadow-[0_30px_80px_rgba(8,27,69,0.22)] sm:max-w-lg"
        >
          <div className="flex items-start justify-between gap-3 border-b border-[#eef2f7] bg-[#f8fafc] px-6 py-5">
            <div>
              <DialogTitle className="font-display text-xl font-semibold tracking-tight text-primary">
                Request contact information
              </DialogTitle>
              <DialogDescription className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
                Your request will be reviewed before consent is requested from
                the alumnus.
              </DialogDescription>
            </div>
            <button
              type="button"
              className="grid size-8 shrink-0 place-items-center rounded-full bg-white text-primary shadow-sm ring-1 ring-[#e2e8f0]"
              onClick={() => setContactTarget(null)}
              aria-label="Close"
            >
              <X className="size-4" />
            </button>
          </div>

          <div className="space-y-5 px-6 py-5">
            <div>
              <label
                htmlFor="contact-reason"
                className="text-sm font-semibold text-primary"
              >
                Purpose of request *
              </label>
              <Textarea
                id="contact-reason"
                value={contactReason}
                onChange={(e) => setContactReason(e.target.value)}
                rows={4}
                placeholder="Explain why you would like to connect…"
                className="mt-2 min-h-28 rounded-xl border-[#e2e8f0] bg-[#f7f9fc] focus-visible:bg-white"
              />
            </div>

            <div>
              <p className="text-sm font-semibold text-primary">
                Requested information
              </p>
              <div className="mt-2.5 space-y-2">
                {(
                  [
                    ["email", "Email"],
                    ["mobile", "Mobile"],
                    ["whatsapp", "WhatsApp"],
                  ] as const
                ).map(([value, label]) => {
                  const checked = contactChannels.includes(value)
                  return (
                    <button
                      key={value}
                      type="button"
                      onClick={() => toggleChannel(value)}
                      className={cn(
                        "flex w-full items-center justify-between rounded-xl border px-4 py-3.5 text-sm font-semibold transition",
                        checked
                          ? "border-primary/30 bg-primary/[0.04] text-primary shadow-[inset_0_0_0_1px_rgba(8,27,69,0.04)]"
                          : "border-[#e5eaf1] bg-white text-primary hover:border-[#c9d4e4]",
                      )}
                    >
                      <span
                        className={cn(
                          "grid size-5 place-items-center rounded-md border transition",
                          checked
                            ? "border-primary bg-primary text-white"
                            : "border-[#c9d3e0] bg-white",
                        )}
                      >
                        {checked ? (
                          <Check className="size-3" strokeWidth={3} />
                        ) : null}
                      </span>
                      <span>{label}</span>
                    </button>
                  )
                })}
              </div>
            </div>
          </div>

          <DialogFooter className="border-t border-[#eef2f7] bg-[#f8fafc] px-6 py-4 sm:justify-end">
            <Button
              type="button"
              variant="outline"
              className="rounded-xl"
              onClick={() => setContactTarget(null)}
              disabled={contactBusy}
            >
              Cancel
            </Button>
            <Button
              type="button"
              className="rounded-xl shadow-[0_10px_22px_rgba(8,27,69,0.18)]"
              onClick={() => void submitContactRequest()}
              disabled={contactBusy || contactReason.trim().length < 5}
            >
              {contactBusy ? "Submitting…" : "Submit request"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
