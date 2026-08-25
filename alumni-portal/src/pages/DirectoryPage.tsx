import { Building2, MapPin, Plus, Search, SlidersHorizontal, User } from "lucide-react"
import { useEffect, useMemo, useState } from "react"
import { useNavigate, useSearchParams } from "react-router-dom"

import { PageHeader } from "@/components/portal/page-header"
import { PageLoader } from "@/components/portal/page-loader"
import { SearchableSelect } from "@/components/searchable-select"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { YearPicker } from "@/components/ui/year-picker"
import { ApiError } from "@/lib/api-client"
import {
  MAX_GRADUATION_YEAR,
  MIN_GRADUATION_YEAR,
} from "@/lib/registration-validation"
import { cn } from "@/lib/utils"
import { catalogService } from "@/services/catalog.service"
import { directoryService } from "@/services/directory.service"
import type { Campus, DegreeProgram, DirectoryAlumni } from "@/types/portal"

const avatarTones = [
  "from-[#dce9ff] to-[#c5d9ff] text-[#174ea6]",
  "from-[#d4f5f1] to-[#b8ebe4] text-[#0b6e6a]",
  "from-[#e8e4ff] to-[#d4cef8] text-[#4b3f9a]",
  "from-[#ffe8d6] to-[#ffd4b8] text-[#9a4d1c]",
]

const MOBILE_PAGE_SIZE = 4
const DESKTOP_PAGE_SIZE = 6
/** Matches Tailwind `lg` — 3-column card grid. */
const DESKTOP_MEDIA = "(min-width: 1024px)"

function useDirectoryPageSize() {
  const [pageSize, setPageSize] = useState(() =>
    typeof window !== "undefined" && window.matchMedia(DESKTOP_MEDIA).matches
      ? DESKTOP_PAGE_SIZE
      : MOBILE_PAGE_SIZE,
  )

  useEffect(() => {
    const media = window.matchMedia(DESKTOP_MEDIA)
    const sync = () =>
      setPageSize(media.matches ? DESKTOP_PAGE_SIZE : MOBILE_PAGE_SIZE)
    sync()
    media.addEventListener("change", sync)
    return () => media.removeEventListener("change", sync)
  }, [])

  return pageSize
}

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

export function DirectoryPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const initialName = searchParams.get("name") ?? ""
  const [items, setItems] = useState<DirectoryAlumni[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const pageSize = useDirectoryPageSize()
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

  useEffect(() => {
    setPage((current) => Math.min(current, totalPages))
  }, [totalPages])

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

  useEffect(() => {
    const q = searchParams.get("name") ?? ""
    setName(q)
    setApplied((prev) => ({ ...prev, name: q }))
    setPage(1)
  }, [searchParams])

  return (
    <div className="space-y-8">
      <PageHeader
        tone="hero"
        eyebrow="Community"
        title="Alumni Directory"
        description="Discover verified alumni by profession, program, campus and more."
        actions={
          total > 0 ? (
            <span className="rounded-full border border-white/15 bg-white/10 px-3.5 py-2 text-xs font-semibold text-white/90">
              {total.toLocaleString()} verified alumni
            </span>
          ) : null
        }
      />

      <form
        onSubmit={applyFilters}
        className="rounded-[1.35rem] border border-border bg-card p-3.5 shadow-[var(--portal-shadow)] sm:p-4"
      >
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
          <div className="relative min-w-0 flex-1">
            <Search className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Search by name or organization"
              className="h-12 min-w-0 rounded-xl border-border bg-muted/40 pr-4 pl-11 text-[15px] shadow-none focus-visible:bg-background"
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
            className="h-12 w-full min-w-0 rounded-xl border-border bg-muted/40 px-3.5 lg:w-48"
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
            className="h-12 w-full min-w-0 rounded-xl border-border bg-muted/40 px-3.5 lg:w-40"
          />
          <div className="flex shrink-0 gap-3">
            <Button
              type="button"
              variant="outline"
              className={cn(
                "h-12 shrink-0 rounded-xl px-4 font-semibold",
                filtersOpen && "border-primary/25 bg-primary/5",
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
              className="h-12 min-w-[6.5rem] flex-1 rounded-xl px-6 font-semibold shadow-[0_10px_22px_rgba(8,27,69,0.18)] lg:flex-none"
            >
              Search
            </Button>
          </div>
        </div>

          {filtersOpen ? (
            <div className="mt-4 grid animate-in fade-in slide-in-from-top-1 gap-3 border-t border-border pt-4 duration-200 sm:grid-cols-2 lg:grid-cols-4">
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
                className="h-11 rounded-xl text-muted-foreground hover:text-foreground"
                onClick={clearFilters}
              >
                Clear all
              </Button>
            </div>
          ) : null}
        </form>

        {loading ? (
          <PageLoader label="Loading directory…" />
        ) : error ? (
          <Card>
            <CardHeader>
              <CardTitle>Directory unavailable</CardTitle>
              <CardDescription>{error}</CardDescription>
            </CardHeader>
          </Card>
        ) : visibleItems.length === 0 ? (
          <div className="rounded-[1.35rem] border border-dashed border-border bg-card px-8 py-16 text-center">
            <div className="mx-auto mb-3 grid size-12 place-items-center rounded-2xl bg-muted text-foreground">
              <Search className="size-5" />
            </div>
            <p className="font-semibold text-foreground">No alumni found</p>
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
                    className="group relative flex min-h-[300px] flex-col overflow-hidden rounded-[1.35rem] border border-border bg-card text-card-foreground shadow-[var(--portal-shadow)] transition duration-300 hover:-translate-y-1 hover:border-primary/25 hover:shadow-[0_22px_50px_rgba(8,27,69,0.12)]"
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
                        {alumni.is_contact_revealed ? (
                          <span
                            className="mt-10 inline-flex max-w-[8.5rem] items-center gap-1 rounded-full bg-accent/12 px-2 py-1 text-[10px] font-semibold leading-tight text-foreground ring-2 ring-card"
                            title="This alumni is in your contacts"
                          >
                            <User className="size-3.5 shrink-0" strokeWidth={2.25} />
                            In your contacts
                          </span>
                        ) : null}
                      </div>

                      <h2 className="mt-4 truncate font-display text-[1.2rem] leading-snug font-semibold tracking-tight text-foreground capitalize">
                          {alumni.full_name}
                        </h2>

                      <p className="mt-1.5 line-clamp-2 text-sm leading-snug text-muted-foreground">
                        {role || "Verified alumni member"}
                      </p>

                      {city || campusLabel ? (
                        <div className="mt-2 space-y-1 text-[13px] text-muted-foreground">
                          {city ? (
                            <p className="flex items-center gap-1.5">
                              <MapPin className="size-3.5 shrink-0 text-accent" />
                              <span className="truncate">{city}</span>
                            </p>
                          ) : null}
                          {campusLabel ? (
                            <p className="flex items-center gap-1.5">
                              <Building2 className="size-3.5 shrink-0 text-accent" />
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
                              className="max-w-full truncate rounded-full bg-muted px-2.5 py-1 text-[11px] font-semibold tracking-wide text-foreground"
                            >
                              {tag}
                            </span>
                          ))}
                        </div>
                      ) : null}

                      <div className="mt-auto pt-5">
                        <Button
                          type="button"
                          className="h-11 w-full rounded-xl font-semibold shadow-[0_10px_22px_rgba(8,27,69,0.16)] transition hover:bg-primary/90"
                          onClick={() => navigate(`/directory/${alumni.alumni_id}`)}
                        >
                          View profile
                        </Button>
                      </div>
                    </div>
                  </article>
                )
              })}
            </div>

            <div className="flex items-center justify-between gap-3 rounded-2xl border border-border bg-card px-4 py-3">
              <p className="text-sm text-muted-foreground">
                Page <span className="font-semibold text-foreground">{page}</span> of{" "}
                <span className="font-semibold text-foreground">{totalPages}</span>
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
  )
}
