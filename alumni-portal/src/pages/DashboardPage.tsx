import { format, formatDistanceToNow, parseISO } from "date-fns"
import {
  CalendarDays,
  ChevronDown,
  MapPin,
  Megaphone,
  Send,
  Users,
} from "lucide-react"
import { useEffect, useState } from "react"
import { Link } from "react-router-dom"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { Textarea } from "@/components/ui/textarea"
import { ApiError } from "@/lib/api-client"
import { cn } from "@/lib/utils"
import { contactRequestService } from "@/services/contact-requests.service"
import {
  dashboardService,
  type AlumniFeed,
  type FeedAlumni,
  type FeedItem,
} from "@/services/dashboard.service"
import { eventsService } from "@/services/events.service"
import type { AnnouncementItem, EventItem } from "@/types/portal"

const RSVP_OPTIONS = [
  { value: "GOING", label: "Going" },
  { value: "MAYBE", label: "Tentative" },
  { value: "NOT_GOING", label: "Not going" },
] as const

function initials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("")
}

function rsvpLabel(status: string | null) {
  return RSVP_OPTIONS.find((o) => o.value === status)?.label ?? "RSVP"
}

function formatEventWhen(event: EventItem) {
  try {
    const date = parseISO(event.event_date)
    const datePart = format(date, "EEE, MMM d")
    const timePart = event.end_time
      ? `${event.start_time} – ${event.end_time}`
      : event.start_time
    return `${datePart} · ${timePart}`
  } catch {
    return `${event.event_date} · ${event.start_time}`
  }
}

function relativeTime(value: string | null) {
  if (!value) return ""
  try {
    return formatDistanceToNow(parseISO(value), { addSuffix: true })
  } catch {
    return ""
  }
}

function Avatar({
  name,
  photoUrl,
  size = "md",
  className,
}: {
  name: string
  photoUrl?: string | null
  size?: "sm" | "md" | "lg"
  className?: string
}) {
  const sizeClass =
    size === "lg" ? "size-16" : size === "sm" ? "size-10" : "size-12"
  if (photoUrl) {
    return (
      <img
        src={photoUrl}
        alt=""
        className={cn("rounded-full object-cover", sizeClass, className)}
      />
    )
  }
  return (
    <div
      className={cn(
        "flex items-center justify-center rounded-full bg-primary/12 text-sm font-semibold text-primary",
        sizeClass,
        className,
      )}
    >
      {initials(name)}
    </div>
  )
}

function Surface({
  children,
  className,
}: {
  children: React.ReactNode
  className?: string
}) {
  return (
    <div
      className={cn(
        "overflow-hidden rounded-lg border border-border bg-card shadow-[0_0_0_1px_oklch(0_0_0/0.02)]",
        className,
      )}
    >
      {children}
    </div>
  )
}

function EventFeedCard({
  event,
  onRsvp,
  busy,
}: {
  event: EventItem
  onRsvp: (eventId: string, status: string) => Promise<void>
  busy: boolean
}) {
  const [open, setOpen] = useState(false)

  return (
    <Surface>
      {event.image_url ? (
        <Link to={`/events/${event.id}`} className="block">
          <img
            src={event.image_url}
            alt=""
            className="aspect-[2.4/1] w-full object-cover"
          />
        </Link>
      ) : (
        <Link
          to={`/events/${event.id}`}
          className="relative block aspect-[2.4/1] overflow-hidden bg-[linear-gradient(135deg,oklch(0.35_0.08_250),oklch(0.42_0.1_220)_55%,oklch(0.38_0.07_200))]"
        >
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_20%,oklch(1_0_0/0.18),transparent_45%)]" />
          <div className="absolute inset-x-0 bottom-0 p-4">
            <p className="text-[11px] font-semibold tracking-[0.14em] text-white/70 uppercase">
              {event.event_type || "Event"}
            </p>
            <p className="mt-1 line-clamp-2 text-lg font-semibold text-white">
              {event.title}
            </p>
          </div>
        </Link>
      )}

      <div className="space-y-3 p-4">
        <div>
          <Link
            to={`/events/${event.id}`}
            className="text-[17px] font-semibold leading-snug text-foreground hover:text-primary hover:underline"
          >
            {event.title}
          </Link>
          {event.description ? (
            <p className="mt-1.5 line-clamp-2 text-sm leading-relaxed text-muted-foreground">
              {event.description}
            </p>
          ) : null}
        </div>

        <div className="space-y-1.5 text-sm text-muted-foreground">
          <p className="flex items-center gap-2">
            <CalendarDays className="size-4 shrink-0 opacity-70" />
            {formatEventWhen(event)}
          </p>
          <p className="flex items-center gap-2">
            <MapPin className="size-4 shrink-0 opacity-70" />
            <span className="truncate">{event.venue}</span>
          </p>
          {event.rsvp_counts ? (
            <p className="pl-6 text-xs">
              {event.rsvp_counts.going} going
              {event.rsvp_counts.total
                ? ` · ${event.rsvp_counts.total} responses`
                : null}
            </p>
          ) : null}
        </div>

        <div className="flex items-center gap-2 border-t border-border pt-3">
          <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger
              render={
                <Button
                  variant={event.my_rsvp_status ? "default" : "outline"}
                  disabled={busy}
                  className="h-9 gap-1.5 rounded-full px-4"
                />
              }
            >
              {rsvpLabel(event.my_rsvp_status)}
              <ChevronDown className="size-3.5 opacity-70" />
            </PopoverTrigger>
            <PopoverContent align="start" className="w-44 p-1">
              {RSVP_OPTIONS.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  className={cn(
                    "flex w-full rounded-md px-2.5 py-2 text-left text-sm hover:bg-muted",
                    event.my_rsvp_status === option.value &&
                      "bg-muted font-medium",
                  )}
                  onClick={() => {
                    setOpen(false)
                    void onRsvp(event.id, option.value)
                  }}
                >
                  {option.label}
                </button>
              ))}
              <div className="my-1 border-t border-border" />
              <Link
                to={`/events/${event.id}`}
                className="flex w-full rounded-md px-2.5 py-2 text-sm text-primary hover:bg-muted"
                onClick={() => setOpen(false)}
              >
                View details
              </Link>
            </PopoverContent>
          </Popover>
        </div>
      </div>
    </Surface>
  )
}

function AnnouncementFeedCard({ item }: { item: AnnouncementItem }) {
  return (
    <Surface>
      <div className="p-4">
        <div className="mb-3 flex items-center gap-2">
          <div className="flex size-10 items-center justify-center rounded-full bg-primary/10 text-primary">
            <Megaphone className="size-4" />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold">Announcement</p>
            <p className="text-xs text-muted-foreground">
              {[item.category, relativeTime(item.published_at)]
                .filter(Boolean)
                .join(" · ")}
            </p>
          </div>
        </div>
        <Link
          to={`/announcements/${item.id}`}
          className="block text-[17px] font-semibold leading-snug hover:text-primary hover:underline"
        >
          {item.title}
        </Link>
        <p className="mt-2 line-clamp-3 text-sm leading-relaxed text-muted-foreground whitespace-pre-wrap">
          {item.content}
        </p>
        {item.image_url ? (
          <img
            src={item.image_url}
            alt=""
            className="mt-3 max-h-72 w-full rounded-md object-cover"
          />
        ) : null}
      </div>
    </Surface>
  )
}

function AlumniFeedCard({
  alumni,
  onRequest,
}: {
  alumni: FeedAlumni
  onRequest: (alumni: FeedAlumni) => void
}) {
  const location = [alumni.city, alumni.country].filter(Boolean).join(", ")

  return (
    <Surface>
      <div className="flex items-start gap-3 p-4">
        <Link to={`/directory/${alumni.alumni_id}`} className="shrink-0">
          <Avatar name={alumni.full_name} photoUrl={alumni.photo_url} />
        </Link>
        <div className="min-w-0 flex-1">
          <div className="mb-1 flex items-center gap-2 text-xs text-muted-foreground">
            <Users className="size-3.5" />
            Alumni
          </div>
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div className="min-w-0">
              <Link
                to={`/directory/${alumni.alumni_id}`}
                className="text-[16px] font-semibold leading-tight hover:underline"
              >
                {alumni.full_name}
              </Link>
              <p className="mt-0.5 text-sm text-muted-foreground">
                {alumni.headline}
              </p>
              {location ? (
                <p className="mt-0.5 text-xs text-muted-foreground">{location}</p>
              ) : null}
              {alumni.degree_label || alumni.graduation_year ? (
                <p className="mt-1 text-xs text-muted-foreground">
                  {[alumni.degree_label, alumni.graduation_year]
                    .filter(Boolean)
                    .join(" · ")}
                </p>
              ) : null}
            </div>
            {alumni.is_contact_revealed ? (
              <span className="rounded-full bg-emerald-500/15 px-2.5 py-1 text-xs font-medium text-emerald-600 dark:text-emerald-400">
                Connected
              </span>
            ) : alumni.contact_request_pending ? (
              <span className="rounded-full bg-muted px-2.5 py-1 text-xs font-medium text-muted-foreground">
                Pending
              </span>
            ) : (
              <Button
                variant="outline"
                size="sm"
                className="h-8 gap-1.5 rounded-full px-3"
                onClick={() => onRequest(alumni)}
              >
                <Send className="size-3.5" />
                Send contact request
              </Button>
            )}
          </div>
        </div>
      </div>
    </Surface>
  )
}

function FeedEntry({
  item,
  onRsvp,
  rsvpBusyId,
  onRequest,
}: {
  item: FeedItem
  onRsvp: (eventId: string, status: string) => Promise<void>
  rsvpBusyId: string | null
  onRequest: (alumni: FeedAlumni) => void
}) {
  if (item.type === "event") {
    return (
      <EventFeedCard
        event={item.event}
        onRsvp={onRsvp}
        busy={rsvpBusyId === item.event.id}
      />
    )
  }
  if (item.type === "announcement") {
    return <AnnouncementFeedCard item={item.announcement} />
  }
  return <AlumniFeedCard alumni={item.alumni} onRequest={onRequest} />
}

export function DashboardPage() {
  const [data, setData] = useState<AlumniFeed | null>(null)
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(true)
  const [rsvpBusyId, setRsvpBusyId] = useState<string | null>(null)
  const [contactTarget, setContactTarget] = useState<FeedAlumni | null>(null)
  const [contactReason, setContactReason] = useState(
    "I'd like to connect through the alumni portal.",
  )
  const [contactBusy, setContactBusy] = useState(false)

  async function load() {
    setLoading(true)
    setError("")
    try {
      setData(await dashboardService.getFeed())
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to load feed")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void load()
  }, [])

  async function handleRsvp(eventId: string, status: string) {
    if (!data) return
    setRsvpBusyId(eventId)
    try {
      const existing = data.feed.find(
        (item) => item.type === "event" && item.event.id === eventId,
      )
      const currentStatus =
        existing && existing.type === "event"
          ? existing.event.my_rsvp_status
          : null
      if (currentStatus) {
        await eventsService.updateRsvp(eventId, status)
      } else {
        await eventsService.createRsvp(eventId, status)
      }
      const refreshed = await eventsService.getOne(eventId)
      setData((prev) => {
        if (!prev) return prev
        const feed = prev.feed.map((item) =>
          item.type === "event" && item.event.id === eventId
            ? { ...item, event: refreshed }
            : item,
        )
        const my_events = [
          ...feed
            .filter(
              (item): item is Extract<FeedItem, { type: "event" }> =>
                item.type === "event" && Boolean(item.event.my_rsvp_status),
            )
            .map((item) => item.event),
        ]
        return { ...prev, feed, my_events }
      })
      toast.success(`RSVP updated · ${rsvpLabel(status)}`)
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "RSVP failed")
    } finally {
      setRsvpBusyId(null)
    }
  }

  async function submitContactRequest() {
    if (!contactTarget) return
    setContactBusy(true)
    try {
      await contactRequestService.create({
        target_alumni_id: contactTarget.alumni_id,
        request_reason: contactReason.trim() || "Alumni connection request",
      })
      setData((prev) => {
        if (!prev) return prev
        return {
          ...prev,
          feed: prev.feed.map((item) =>
            item.type === "alumni" &&
            item.alumni.alumni_id === contactTarget.alumni_id
              ? {
                  ...item,
                  alumni: { ...item.alumni, contact_request_pending: true },
                }
              : item,
          ),
        }
      })
      toast.success("Contact request sent")
      setContactTarget(null)
    } catch (err) {
      toast.error(
        err instanceof ApiError ? err.message : "Failed to send request",
      )
    } finally {
      setContactBusy(false)
    }
  }

  if (loading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="h-48 animate-pulse rounded-lg bg-card" />
        ))}
      </div>
    )
  }

  if (error || !data) {
    return (
      <Surface className="mx-auto max-w-lg p-8 text-center">
        <p className="font-semibold">Home unavailable</p>
        <p className="mt-1 text-sm text-muted-foreground">
          {error || "No data returned"}
        </p>
        <Button className="mt-4" onClick={() => void load()}>
          Retry
        </Button>
      </Surface>
    )
  }

  return (
    <>
      <div className="space-y-2.5">
        {data.feed.length === 0 ? (
          <Surface className="p-10 text-center text-sm text-muted-foreground">
            Nothing in your feed yet. Events, announcements, and alumni will
            appear here.
          </Surface>
        ) : (
          data.feed.map((item) => (
            <FeedEntry
              key={item.id}
              item={item}
              onRsvp={handleRsvp}
              rsvpBusyId={rsvpBusyId}
              onRequest={setContactTarget}
            />
          ))
        )}
      </div>

      <Dialog
        open={Boolean(contactTarget)}
        onOpenChange={(open) => {
          if (!open) setContactTarget(null)
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Send contact request</DialogTitle>
            <DialogDescription>
              {contactTarget
                ? `Connect with ${contactTarget.full_name}. An admin may review before contact details are shared.`
                : null}
            </DialogDescription>
          </DialogHeader>
          <Textarea
            value={contactReason}
            onChange={(e) => setContactReason(e.target.value)}
            rows={4}
            placeholder="Why would you like to connect?"
          />
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setContactTarget(null)}
              disabled={contactBusy}
            >
              Cancel
            </Button>
            <Button
              onClick={() => void submitContactRequest()}
              disabled={contactBusy || !contactReason.trim()}
            >
              {contactBusy ? "Sending…" : "Send request"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
