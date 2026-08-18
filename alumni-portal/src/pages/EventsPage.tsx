import { useEffect, useState } from "react"
import { useParams } from "react-router-dom"
import { format, parseISO } from "date-fns"
import { toast } from "sonner"

import { LinkWithFrom, PageBreadcrumb } from "@/components/page-breadcrumb"
import { ApiError } from "@/lib/api-client"
import { refreshPortalRails } from "@/lib/portal-events"
import { RSVP_OPTIONS, rsvpButtonClass } from "@/lib/rsvp"
import { eventsService } from "@/services/events.service"
import type { EventItem } from "@/types/portal"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { cn } from "@/lib/utils"

function formatEventMeta(event: EventItem) {
  try {
    const date = format(parseISO(event.event_date), "MMM d, yyyy")
    const time = event.start_time?.slice(0, 5) ?? event.start_time
    return `${date} · ${time} · ${event.venue}`
  } catch {
    return `${event.event_date} · ${event.start_time} · ${event.venue}`
  }
}

function EventCover({ event }: { event: EventItem }) {
  if (event.image_url) {
    return (
      <img
        src={event.image_url}
        alt=""
        className="aspect-[16/9] w-full rounded-lg object-cover"
      />
    )
  }

  return (
    <div className="relative flex aspect-[16/9] w-full items-end overflow-hidden rounded-lg bg-[linear-gradient(160deg,oklch(0.42_0.1_245),oklch(0.36_0.07_220))] p-4">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_75%_20%,oklch(1_0_0/0.16),transparent_50%)]" />
      <div className="relative">
        <p className="text-[11px] font-semibold tracking-[0.14em] text-white/70 uppercase">
          {event.event_type || "Event"}
        </p>
        <p className="mt-1 line-clamp-2 text-lg font-semibold text-white">
          {event.title}
        </p>
      </div>
    </div>
  )
}

function EventCard({
  event,
  busy,
  error,
  onRsvp,
  linkTitle = true,
}: {
  event: EventItem
  busy: boolean
  error?: string
  onRsvp: (status: string) => void
  linkTitle?: boolean
}) {
  return (
    <article className="overflow-hidden rounded-xl border border-border bg-card">
      <div className="space-y-3 p-4 sm:p-5">
        <div>
          {linkTitle ? (
            <LinkWithFrom
              to={`/events/${event.id}`}
              className="text-[18px] font-semibold leading-snug text-foreground hover:text-primary hover:underline"
            >
              {event.title}
            </LinkWithFrom>
          ) : (
            <h2 className="text-[18px] font-semibold leading-snug text-foreground">
              {event.title}
            </h2>
          )}
          <p className="mt-1 text-sm text-muted-foreground">
            {formatEventMeta(event)}
          </p>
        </div>

        <LinkWithFrom to={`/events/${event.id}`} className="block">
          <EventCover event={event} />
        </LinkWithFrom>

        {event.description ? (
          <p className="line-clamp-3 text-sm leading-relaxed text-muted-foreground whitespace-pre-wrap">
            {event.description}
          </p>
        ) : null}

        {error ? <p className="text-sm text-destructive">{error}</p> : null}

        <div className="flex flex-wrap gap-2 pt-0.5">
          {RSVP_OPTIONS.map((option) => (
            <Button
              key={option.value}
              size="sm"
              variant="outline"
              disabled={busy}
              className={cn(
                "rounded-md px-3",
                rsvpButtonClass(
                  option.value,
                  event.my_rsvp_status === option.value,
                ),
              )}
              onClick={() => onRsvp(option.value)}
            >
              {option.label.toUpperCase()}
            </Button>
          ))}
        </div>
      </div>
    </article>
  )
}

export function EventsPage() {
  const [items, setItems] = useState<EventItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [rsvpBusyId, setRsvpBusyId] = useState<string | null>(null)
  const [rsvpErrors, setRsvpErrors] = useState<Record<string, string>>({})

  useEffect(() => {
    let cancelled = false
    async function load() {
      setLoading(true)
      setError("")
      try {
        const page = await eventsService.list({
          scope: "upcoming",
          page: 1,
          page_size: 20,
        })
        if (!cancelled) setItems(page.items)
      } catch (err) {
        if (!cancelled) {
          setError(
            err instanceof ApiError ? err.message : "Failed to load events",
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
  }, [])

  async function setRsvp(event: EventItem, status: string) {
    setRsvpBusyId(event.id)
    setRsvpErrors((current) => {
      const next = { ...current }
      delete next[event.id]
      return next
    })
    try {
      if (event.my_rsvp_status) {
        await eventsService.updateRsvp(event.id, status)
      } else {
        await eventsService.createRsvp(event.id, status)
      }
      const refreshed = await eventsService.getOne(event.id)
      setItems((prev) =>
        prev.map((item) => (item.id === event.id ? refreshed : item)),
      )
      refreshPortalRails()
      toast.success(
        `RSVP updated · ${
          RSVP_OPTIONS.find((o) => o.value === status)?.label ?? status
        }`,
      )
    } catch (err) {
      const message = err instanceof ApiError ? err.message : "RSVP failed"
      setRsvpErrors((current) => ({ ...current, [event.id]: message }))
    } finally {
      setRsvpBusyId(null)
    }
  }

  return (
    <div className="space-y-4">
      <div>
        <h1 className="font-display text-2xl font-semibold tracking-tight">
          Events
        </h1>
        <p className="text-sm text-muted-foreground">
          Discover and RSVP to alumni gatherings
        </p>
      </div>

      {loading ? (
        <div className="space-y-4">
          {Array.from({ length: 2 }).map((_, i) => (
            <div
              key={i}
              className="h-[22rem] animate-pulse rounded-xl border border-border bg-card"
            />
          ))}
        </div>
      ) : error ? (
        <Card>
          <CardHeader>
            <CardTitle>Events unavailable</CardTitle>
            <CardDescription>{error}</CardDescription>
          </CardHeader>
        </Card>
      ) : items.length === 0 ? (
        <div className="rounded-xl border border-border bg-card p-8 text-center text-sm text-muted-foreground">
          No upcoming events.
        </div>
      ) : (
        <div className="mx-auto w-full max-w-[560px] space-y-4">
          {items.map((event) => (
            <EventCard
              key={event.id}
              event={event}
              busy={rsvpBusyId === event.id}
              error={rsvpErrors[event.id]}
              onRsvp={(status) => void setRsvp(event, status)}
            />
          ))}
        </div>
      )}
    </div>
  )
}

export function EventDetailPage() {
  const { eventId = "" } = useParams()
  const [event, setEvent] = useState<EventItem | null>(null)
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    let cancelled = false
    async function load() {
      setLoading(true)
      setError("")
      try {
        const data = await eventsService.getOne(eventId)
        if (!cancelled) setEvent(data)
      } catch (err) {
        if (!cancelled) {
          setError(
            err instanceof ApiError ? err.message : "Failed to load event",
          )
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    if (eventId) void load()
    return () => {
      cancelled = true
    }
  }, [eventId])

  async function setRsvp(status: string) {
    if (!event) return
    setSaving(true)
    setError("")
    try {
      if (event.my_rsvp_status) {
        await eventsService.updateRsvp(event.id, status)
      } else {
        await eventsService.createRsvp(event.id, status)
      }
      const refreshed = await eventsService.getOne(event.id)
      setEvent(refreshed)
      refreshPortalRails()
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "RSVP failed")
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="mx-auto h-[22rem] w-full max-w-[560px] animate-pulse rounded-xl bg-muted" />
    )
  }

  if (error && !event) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Event unavailable</CardTitle>
          <CardDescription>{error}</CardDescription>
        </CardHeader>
      </Card>
    )
  }

  if (!event) return null

  return (
    <div className="mx-auto w-full max-w-[560px] space-y-3">
      <PageBreadcrumb
        current={event.title}
        fallback={{ label: "Events", to: "/events" }}
      />
      <EventCard
        event={event}
        busy={saving}
        error={error || undefined}
        onRsvp={(status) => void setRsvp(status)}
        linkTitle={false}
      />
    </div>
  )
}
