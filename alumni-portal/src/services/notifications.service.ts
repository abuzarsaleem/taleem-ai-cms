import { apiClient } from "@/lib/api-client"
import type { ApiResponse } from "@/types/api"

export type NotificationItem = {
  type: "alumni" | "event" | "announcement"
  id: string
  title: string
  occurred_at: string
}

export type NotificationsSummary = {
  unread_count: number
  alumni: number
  events: number
  announcements: number
  since: string
  items: NotificationItem[]
}

export const notificationsService = {
  async getSummary(since?: string | null): Promise<NotificationsSummary> {
    const { data } = await apiClient.get<ApiResponse<NotificationsSummary>>(
      "/me/notifications",
      { params: since ? { since } : undefined },
    )
    return data.data
  },
}
