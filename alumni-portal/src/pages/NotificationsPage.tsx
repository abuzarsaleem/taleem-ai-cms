import { formatDistanceToNow, parseISO } from "date-fns"
import { CalendarDays, Megaphone, Users } from "lucide-react"
import { useNavigate } from "react-router-dom"

import { PageHeader } from "@/components/portal/page-header"
import { Button } from "@/components/ui/button"
import { useNotifications } from "@/hooks/use-notifications"
import type { NotificationItem } from "@/services/notifications.service"

function notificationHref(item: NotificationItem) {
  if (item.type === "alumni") return `/directory/${item.id}`
  if (item.type === "event") return `/events/${item.id}`
  return `/announcements/${item.id}`
}

function notificationLabel(item: NotificationItem) {
  if (item.type === "alumni") return `New alumni · ${item.title}`
  if (item.type === "event") return `Event · ${item.title}`
  return `Announcement · ${item.title}`
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

  return (
    <div>
      <PageHeader
        eyebrow="Inbox"
        title="Notifications"
        description="Updates about your registration, identity, events and alumni activity."
        actions={
          <Button
            variant="outline"
            className="rounded-[11px]"
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
          <ul className="divide-y divide-border">
            {summary.items.map((item) => {
              const Icon = iconFor(item.type)
              return (
                <li key={`${item.type}-${item.id}`}>
                  <button
                    type="button"
                    className="flex w-full items-start gap-3 rounded-xl px-3 py-3.5 text-left transition-colors hover:bg-muted/60"
                    onClick={() =>
                      navigate(notificationHref(item), {
                        state: { from: "/notifications" },
                      })
                    }
                  >
                    <span className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-full bg-accent/15 text-accent">
                      <Icon className="size-4" />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block text-sm font-semibold leading-snug">
                        {notificationLabel(item)}
                      </span>
                      {!item.is_read ? (
                        <span className="mt-1 inline-block size-1.5 rounded-full bg-accent" />
                      ) : null}
                    </span>
                    <span className="shrink-0 text-xs text-muted-foreground">
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
