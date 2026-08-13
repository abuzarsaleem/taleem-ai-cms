import { useEffect, useState } from "react"
import { Link, useParams } from "react-router-dom"
import { parseISO } from "date-fns"

import { ApiError } from "@/lib/api-client"
import { cn } from "@/lib/utils"
import { eventsService } from "@/services/events.service"
import type { EventItem } from "@/types/portal"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

function formatEventDate(isoDate: string) {
  const date = parseISO(isoDate)
  return {
    month: date.toLocaleString("en-US", { month: "short" }).toUpperCase(),
    day: String(date.getDate()).padStart(2, "0"),
  }
}

export function EventsPage() {
  const [items, setItems] = useState<EventItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

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

  return (
    <div className="mx-auto max-w-3xl space-y-4">
      <div>
        <h1 className="font-display text-2xl font-semibold tracking-tight">
          Events
        </h1>
        <p className="text-sm text-muted-foreground">
          Discover and RSVP to alumni gatherings
        </p>
      </div>

      {loading ? (
        <div className="space-y-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-[72px] animate-pulse rounded-lg bg-card" />
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
        <div className="rounded-lg border border-border bg-card p-8 text-center text-sm text-muted-foreground">
          No upcoming events.
        </div>
      ) : (
        <div className="overflow-hidden rounded-lg border border-border bg-card">
          {items.map((event, index) => {
            const date = formatEventDate(event.event_date)
            return (
              <Link
                key={event.id}
                to={`/events/${event.id}`}
                className={cn(
                  "flex items-center gap-3 px-4 py-3 transition-colors hover:bg-muted/40",
                  index < items.length - 1 && "border-b border-border",
                )}
              >
                <div className="flex size-12 shrink-0 flex-col items-center justify-center rounded bg-muted text-center">
                  <span className="text-[10px] font-semibold tracking-wide text-muted-foreground">
                    {date.month}
                  </span>
                  <span className="text-lg font-semibold leading-none">
                    {date.day}
                  </span>
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-semibold">{event.title}</p>
                  <p className="truncate text-sm text-muted-foreground">
                    {event.venue}
                  </p>
                </div>
                <span className="shrink-0 rounded-full bg-primary/10 px-2.5 py-1 text-xs font-semibold text-primary">
                  {event.my_rsvp_status
                    ? event.my_rsvp_status.replace("_", " ")
                    : "RSVP"}
                </span>
              </Link>
            )
          })}
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
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "RSVP failed")
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return <div className="h-40 animate-pulse rounded-xl bg-muted" />
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
    <div className="mx-auto max-w-2xl space-y-4">
      <Link to="/events" className="text-sm text-primary hover:underline">
        Back to events
      </Link>
      <Card>
        <CardHeader>
          <CardTitle>{event.title}</CardTitle>
          <CardDescription>
            {event.event_date} · {event.start_time} · {event.venue}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {event.description ? (
            <p className="text-sm text-muted-foreground whitespace-pre-wrap">
              {event.description}
            </p>
          ) : null}
          {error ? <p className="text-sm text-destructive">{error}</p> : null}
          <div className="flex flex-wrap gap-2">
            {["GOING", "MAYBE", "NOT_GOING"].map((status) => (
              <Button
                key={status}
                variant={
                  event.my_rsvp_status === status ? "default" : "outline"
                }
                disabled={saving}
                onClick={() => void setRsvp(status)}
              >
                {status.replace("_", " ")}
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
