import { useCallback, useEffect, useState } from "react"

import { useAuth } from "@/auth/AuthContext"
import { notificationsService } from "@/services/notifications.service"
import type { NotificationsSummary } from "@/services/notifications.service"

const STORAGE_KEY = "taleem_alumni_notifications_seen"
const POLL_MS = 60_000

function readSeen(): string | null {
  try {
    return localStorage.getItem(STORAGE_KEY)
  } catch {
    return null
  }
}

function writeSeen(iso: string) {
  try {
    localStorage.setItem(STORAGE_KEY, iso)
  } catch {
    /* ignore quota */
  }
}

const empty: NotificationsSummary = {
  unread_count: 0,
  alumni: 0,
  events: 0,
  announcements: 0,
  since: new Date().toISOString(),
  items: [],
}

export function useNotifications() {
  const { token } = useAuth()
  const [summary, setSummary] = useState<NotificationsSummary>(empty)

  const refresh = useCallback(async () => {
    if (!token) return
    try {
      const next = await notificationsService.getSummary(readSeen())
      setSummary(next)
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
    const id = window.setInterval(() => {
      void refresh()
    }, POLL_MS)
    return () => window.clearInterval(id)
  }, [token, refresh])

  async function markSeen() {
    const seenAt = new Date().toISOString()
    writeSeen(seenAt)
    setSummary((current) => ({
      ...current,
      unread_count: 0,
      alumni: 0,
      events: 0,
      announcements: 0,
      since: seenAt,
      items: current.items.map((item) => ({ ...item, is_read: true })),
    }))

    // Persist when the API supports DB-backed read state (ignore 404 on older backends).
    try {
      const next = await notificationsService.markRead()
      setSummary(next)
    } catch {
      /* since cursor already updated for feed-based /me/notifications */
    }
  }

  return { summary, refresh, markSeen }
}
