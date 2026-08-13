import { useEffect, useMemo, useState } from "react"
import { Link, useNavigate, useParams } from "react-router-dom"
import {
  ArrowLeftIcon,
  ImageIcon,
  PencilIcon,
  Trash2Icon,
} from "lucide-react"

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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { ApiError } from "@/lib/api"
import { cn } from "@/lib/utils"
import {
  catalogService,
  type CatalogCampus,
  type CatalogDegreeProgram,
} from "@/services/catalog.service"
import {
  eventService,
  type AdminEvent,
  type AdminRsvpListItem,
} from "@/services/event.service"

function typeLabel(type: string) {
  return type
    .toLowerCase()
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ")
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(value))
}

function formatTime(value: string | null) {
  if (!value) return "—"
  return value.slice(0, 5)
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
      <dd className="text-sm font-medium break-words whitespace-pre-wrap">
        {value || "—"}
      </dd>
    </div>
  )
}

export default function EventDetailPage() {
  const { id } = useParams()
  const { token } = useAuth()
  const navigate = useNavigate()

  const [item, setItem] = useState<AdminEvent | null>(null)
  const [rsvps, setRsvps] = useState<AdminRsvpListItem[]>([])
  const [campuses, setCampuses] = useState<CatalogCampus[]>([])
  const [degreePrograms, setDegreePrograms] = useState<CatalogDegreeProgram[]>(
    [],
  )
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState("")

  useEffect(() => {
    if (!token || !id) return

    let cancelled = false

    void (async () => {
      setLoading(true)
      setError("")
      try {
        const [event, rsvpList, campusList, programList] = await Promise.all([
          eventService.getById(token, id),
          eventService
            .listRsvps(token, id)
            .catch(() => [] as AdminRsvpListItem[]),
          catalogService.listCampuses().catch(() => [] as CatalogCampus[]),
          catalogService
            .listDegreePrograms()
            .catch(() => [] as CatalogDegreeProgram[]),
        ])
        if (!cancelled) {
          setItem(event)
          setRsvps(rsvpList)
          setCampuses(campusList)
          setDegreePrograms(programList)
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof ApiError ? err.message : "Failed to load event")
          setItem(null)
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()

    return () => {
      cancelled = true
    }
  }, [token, id])

  const campusLabels = useMemo(() => {
    const ids = item?.target_criteria?.campus_ids ?? []
    if (!ids.length) return "All"
    return ids
      .map(
        (campusId) =>
          campuses.find((campus) => campus.id === campusId)?.name ?? campusId,
      )
      .join(", ")
  }, [item, campuses])

  const degreeProgramLabels = useMemo(() => {
    const ids = item?.target_criteria?.degree_program_ids ?? []
    if (!ids.length) return "All"
    return ids
      .map(
        (programId) =>
          degreePrograms.find((program) => program.id === programId)?.label ??
          programId,
      )
      .join(", ")
  }, [item, degreePrograms])

  async function handleDelete() {
    if (!token || !item) return
    const confirmed = window.confirm(
      `Delete “${item.title}”? This cannot be undone.`,
    )
    if (!confirmed) return

    setBusy(true)
    setError("")
    try {
      await eventService.remove(token, item.id)
      navigate("/events")
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to delete event")
    } finally {
      setBusy(false)
    }
  }

  if (loading) {
    return (
      <div className="flex flex-1 flex-col gap-4 px-4 py-6 lg:px-6">
        <Skeleton className="h-8 w-32" />
        <Skeleton className="h-8 w-64" />
        <Skeleton className="mt-4 h-72 w-full" />
      </div>
    )
  }

  if (!item) {
    return (
      <div className="flex flex-1 flex-col gap-4 px-4 py-6 lg:px-6">
        <Button
          variant="outline"
          size="sm"
          className="w-fit"
          render={<Link to="/events" />}
        >
          <ArrowLeftIcon />
          Back
        </Button>
        <p className="text-sm text-destructive">{error || "Event not found"}</p>
      </div>
    )
  }

  const counts = item.rsvp_counts

  return (
    <div className="flex flex-1 flex-col gap-4 py-4 md:gap-6 md:py-6">
      <div className="flex flex-col gap-4 px-4 sm:flex-row sm:items-start sm:justify-between lg:px-6">
        <div className="flex flex-col gap-3">
          <Button
            variant="outline"
            size="sm"
            className="w-fit"
            onClick={() => navigate("/events")}
          >
            <ArrowLeftIcon />
            Back
          </Button>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-2xl font-bold tracking-tight">{item.title}</h1>
              <Badge
                className={cn(
                  "font-normal",
                  item.is_draft
                    ? "border-transparent bg-amber-500/10 text-amber-700 dark:text-amber-400"
                    : "border-transparent bg-emerald-500/10 text-emerald-700 dark:text-emerald-400",
                )}
              >
                {item.is_draft ? "Draft" : "Published"}
              </Badge>
              <Badge variant="outline">{typeLabel(item.event_type)}</Badge>
            </div>
            <p className="text-sm text-muted-foreground">
              {formatDate(item.event_date)} · {formatTime(item.start_time)}
              {item.end_time ? `–${formatTime(item.end_time)}` : ""} ·{" "}
              {item.venue}
            </p>
          </div>
        </div>

        <div className="flex gap-2">
          <Button variant="outline" render={<Link to={`/events/${item.id}/edit`} />}>
            <PencilIcon />
            Edit
          </Button>
          <Button
            variant="destructive"
            disabled={busy}
            onClick={() => void handleDelete()}
          >
            <Trash2Icon />
            Delete
          </Button>
        </div>
      </div>

      {error ? (
        <p className="px-4 text-sm text-destructive lg:px-6">{error}</p>
      ) : null}

      <div className="grid gap-4 px-4 lg:grid-cols-3 lg:px-6">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Description</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="whitespace-pre-wrap text-sm leading-relaxed">
              {item.description || "No description provided."}
            </p>
          </CardContent>
        </Card>

        <div className="flex flex-col gap-4">
          <Card>
            <CardHeader>
              <CardTitle>Image</CardTitle>
            </CardHeader>
            <CardContent>
              {item.image_url ? (
                <img
                  src={item.image_url}
                  alt={item.title}
                  className="aspect-video w-full rounded-lg border object-cover"
                />
              ) : (
                <div className="flex aspect-video flex-col items-center justify-center gap-2 rounded-lg border border-dashed bg-muted/40 text-muted-foreground">
                  <ImageIcon className="size-8" />
                  <span className="text-xs">No image</span>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Details</CardTitle>
            </CardHeader>
            <CardContent>
              <dl>
                <DetailRow label="Type" value={typeLabel(item.event_type)} />
                <DetailRow label="Date" value={formatDate(item.event_date)} />
                <DetailRow
                  label="Time"
                  value={`${formatTime(item.start_time)}${
                    item.end_time ? ` – ${formatTime(item.end_time)}` : ""
                  }`}
                />
                <DetailRow label="Venue" value={item.venue} />
                <DetailRow label="Guest speaker" value={item.guest_speaker} />
                <DetailRow label="Campuses" value={campusLabels} />
                <DetailRow label="Degree programs" value={degreeProgramLabels} />
                <DetailRow
                  label="Graduation years"
                  value={
                    item.target_criteria?.graduation_years?.length
                      ? item.target_criteria.graduation_years.join(", ")
                      : "All"
                  }
                />
                <DetailRow
                  label="Cities"
                  value={
                    item.target_criteria?.cities?.length
                      ? item.target_criteria.cities.join(", ")
                      : "All"
                  }
                />
              </dl>
            </CardContent>
          </Card>

          {counts ? (
            <Card>
              <CardHeader>
                <CardTitle>RSVP summary</CardTitle>
                <CardDescription>{counts.total} total responses</CardDescription>
              </CardHeader>
              <CardContent className="grid grid-cols-3 gap-2 text-center">
                <div className="rounded-lg border p-3">
                  <p className="text-lg font-semibold tabular-nums">
                    {counts.going}
                  </p>
                  <p className="text-xs text-muted-foreground">Going</p>
                </div>
                <div className="rounded-lg border p-3">
                  <p className="text-lg font-semibold tabular-nums">
                    {counts.maybe}
                  </p>
                  <p className="text-xs text-muted-foreground">Maybe</p>
                </div>
                <div className="rounded-lg border p-3">
                  <p className="text-lg font-semibold tabular-nums">
                    {counts.not_going}
                  </p>
                  <p className="text-xs text-muted-foreground">Not going</p>
                </div>
              </CardContent>
            </Card>
          ) : null}
        </div>
      </div>

      <div className="px-4 lg:px-6">
        <Card>
          <CardHeader>
            <CardTitle>RSVPs</CardTitle>
            <CardDescription>Alumni responses for this event</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-hidden rounded-xl border">
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent">
                    <TableHead className="bg-muted/40 px-4">Alumni</TableHead>
                    <TableHead className="bg-muted/40 px-4">Status</TableHead>
                    <TableHead className="hidden bg-muted/40 px-4 sm:table-cell">
                      Updated
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rsvps.map((rsvp) => (
                    <TableRow key={rsvp.id}>
                      <TableCell className="px-4 py-3">
                        <div className="font-medium">
                          {rsvp.full_name || "Unknown"}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {rsvp.email || rsvp.alumni_id}
                        </div>
                      </TableCell>
                      <TableCell className="px-4 py-3">
                        <Badge variant="outline">
                          {rsvp.status.replace("_", " ")}
                        </Badge>
                      </TableCell>
                      <TableCell className="hidden px-4 py-3 text-sm text-muted-foreground sm:table-cell">
                        {formatDate(rsvp.updated_at)}
                      </TableCell>
                    </TableRow>
                  ))}
                  {!rsvps.length ? (
                    <TableRow className="hover:bg-transparent">
                      <TableCell
                        colSpan={3}
                        className="h-24 px-4 text-center text-muted-foreground"
                      >
                        No RSVPs yet.
                      </TableCell>
                    </TableRow>
                  ) : null}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
