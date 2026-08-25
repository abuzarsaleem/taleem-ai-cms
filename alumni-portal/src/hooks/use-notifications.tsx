import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react"

import { useAuth } from "@/auth/AuthContext"
import { notificationsService } from "@/services/notifications.service"
import type { NotificationsSummary } from "@/services/notifications.service"

const POLL_MS = 60_000

const empty: NotificationsSummary = {
  unread_count: 0,
  alumni: 0,
  events: 0,
  announcements: 0,
  since: new Date().toISOString(),
  items: [],
}

type NotificationsContextValue = {
  summary: NotificationsSummary
  refresh: () => Promise<void>
  markSeen: (notificationIds?: string[]) => Promise<void>
}

const NotificationsContext = createContext<NotificationsContextValue | null>(
  null,
)

export function NotificationsProvider({ children }: { children: ReactNode }) {
  const { token } = useAuth()
  const [summary, setSummary] = useState<NotificationsSummary>(empty)
  const requestId = useRef(0)

  const refresh = useCallback(async () => {
    if (!token) return
    const id = ++requestId.current
    try {
      const next = await notificationsService.getSummary()
      if (id === requestId.current) setSummary(next)
    } catch {
      /* keep last known counts */
    }
  }, [token])

  useEffect(() => {
    if (!token) {
      setSummary(empty)
      return
    }
    void refresh()
    const timer = window.setInterval(() => {
      void refresh()
    }, POLL_MS)
    return () => window.clearInterval(timer)
  }, [token, refresh])

  const markSeen = useCallback(
    async (notificationIds?: string[]) => {
      if (!token) return
      const id = ++requestId.current
      const ids = notificationIds?.filter(Boolean)

      setSummary((current) => {
        if (!ids?.length) {
          return {
            ...current,
            unread_count: 0,
            alumni: 0,
            events: 0,
            announcements: 0,
            items: current.items.map((item) => ({ ...item, is_read: true })),
          }
        }

        const idSet = new Set(ids)
        const items = current.items.map((item) =>
          item.notification_id && idSet.has(item.notification_id)
            ? { ...item, is_read: true }
            : item,
        )
        const unread = items.filter((item) => !item.is_read)
        return {
          ...current,
          items,
          unread_count: unread.length,
          alumni: unread.filter((item) => item.type === "alumni").length,
          events: unread.filter((item) => item.type === "event").length,
          announcements: unread.filter((item) => item.type === "announcement")
            .length,
        }
      })

      try {
        const next = await notificationsService.markRead(ids)
        if (id === requestId.current) setSummary(next)
      } catch {
        /* optimistic clear already applied */
      }
    },
    [token],
  )

  const value = useMemo(
    () => ({ summary, refresh, markSeen }),
    [summary, refresh, markSeen],
  )

  return (
    <NotificationsContext.Provider value={value}>
      {children}
    </NotificationsContext.Provider>
  )
}

export function useNotifications() {
  const ctx = useContext(NotificationsContext)
  if (!ctx) {
    throw new Error("useNotifications must be used within NotificationsProvider")
  }
  return ctx
}
