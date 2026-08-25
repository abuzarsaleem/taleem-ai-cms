import { formatDistanceToNow, parseISO } from "date-fns"
import { CalendarDays, Megaphone, Users } from "lucide-react"
import { useNavigate } from "react-router-dom"

import { PageHeader } from "@/components/portal/page-header"
import { Button } from "@/components/ui/button"
import { useNotifications } from "@/hooks/use-notifications"
import { cn } from "@/lib/utils"
import type { NotificationItem } from "@/services/notifications.service"

function notificationLabel(item: NotificationItem) {
  const prefixes = ["Updated: ", "Cancelled: ", "Postponed: "] as const
  const prefix = prefixes.find((value) => item.title.startsWith(value))
  const title = prefix ? item.title.slice(prefix.length) : item.title

  if (item.type === "alumni") return `New alumni · ${title}`
  if (item.type === "event") {
    if (prefix === "Updated: ") return `Event updated · ${title}`
    if (prefix === "Cancelled: ") return `Event cancelled · ${title}`
    if (prefix === "Postponed: ") return `Event postponed · ${title}`
    return `Event · ${title}`
  }
  if (prefix === "Updated: ") return `Announcement updated · ${title}`
  return `Announcement · ${title}`
}

function notificationHref(item: NotificationItem) {
  if (item.type === "alumni") return `/directory/${item.id}`
  if (item.type === "event") {
    if (item.title.startsWith("Cancelled: ")) return "/events"
    return `/events/${item.id}`
  }
  return `/announcements/${item.id}`
}

function relativeTime(value: string) {
  try {
    return formatDistanceToNow(parseISO(value), { addSuffix: true })
  } catch {
    return ""
  }
}

function iconFor(type: NotificationItem["type"]) {
  if (type === "alumni") return Users
  if (type === "event") return CalendarDays
  return Megaphone
}

export function NotificationsPage() {
  const navigate = useNavigate()
  const { summary, markSeen } = useNotifications()
  const hasUnread = summary.unread_count > 0

  return (
    <div className="space-y-8">
      <PageHeader
        tone="hero"
        eyebrow="Inbox"
        title="Notifications"
        description="Updates about your registration, identity, events and alumni activity."
        actions={
          <Button
            variant="outline"
            className="rounded-xl border-white/25 bg-white/10 text-white hover:bg-white/15 hover:text-white"
            disabled={!hasUnread}
            onClick={() => void markSeen()}
          >
            Mark all read
          </Button>
        }
      />

      <div className="portal-card p-2 sm:p-4">
        {summary.items.length === 0 ? (
          <p className="px-3 py-10 text-center text-sm text-muted-foreground">
            You&apos;re all caught up
          </p>
        ) : (
          <ul className="space-y-1.5">
            {summary.items.map((item) => {
              const Icon = iconFor(item.type)
              const isNew = !item.is_read
              return (
                <li key={`${item.type}-${item.id}-${item.notification_id ?? ""}`}>
                  <button
                    type="button"
                    className={cn(
                      "flex w-full items-start gap-3 rounded-xl px-3 py-3.5 text-left transition-colors",
                      isNew
                        ? "bg-accent/10 ring-1 ring-accent/25 hover:bg-accent/15"
                        : "hover:bg-muted/60",
                    )}
                    onClick={() => {
                      if (isNew && item.notification_id) {
                        void markSeen([item.notification_id])
                      }
                      navigate(notificationHref(item), {
                        state: { from: "/notifications" },
                      })
                    }}
                  >
                    <span
                      className={cn(
                        "mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-full",
                        isNew
                          ? "bg-accent text-accent-foreground"
                          : "bg-accent/15 text-accent",
                      )}
                    >
                      <Icon className="size-4" />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="flex flex-wrap items-center gap-2">
                        <span
                          className={cn(
                            "block text-sm leading-snug",
                            isNew
                              ? "font-bold text-foreground"
                              : "font-semibold text-foreground",
                          )}
                        >
                          {notificationLabel(item)}
                        </span>
                        {isNew ? (
                          <span className="rounded-full bg-accent px-1.5 py-0.5 text-[10px] font-bold tracking-wide text-accent-foreground uppercase">
                            New
                          </span>
                        ) : null}
                      </span>
                    </span>
                    <span
                      className={cn(
                        "shrink-0 text-xs",
                        isNew
                          ? "font-semibold text-foreground"
                          : "text-muted-foreground",
                      )}
                    >
                      {relativeTime(item.occurred_at)}
                    </span>
                  </button>
                </li>
              )
            })}
          </ul>
        )}
      </div>
    </div>
  )
}
