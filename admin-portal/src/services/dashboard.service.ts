import { apiClient } from "@/lib/api-client"
import type { ApiResponse } from "@/types/api"

export type AnnouncementCategory =
  | "ANNOUNCEMENT"
  | "NEWS"
  | "EVENT"
  | "NOTICE"
  | string

export type DashboardAnnouncement = {
  id: string
  title: string
  content: string
  category: AnnouncementCategory
  image_url: string | null
  is_published: boolean
  published_at: string | null
}

export type AdminDashboard = {
  alumni_count: number
  pending_registrations_count: number
  rejected_requests_count: number
  pending_contact_requests_count: number
  published_events_count: number
  active_events_count: number
  completed_events_count: number
  latest_announcements: DashboardAnnouncement[]
}

export const dashboardService = {
  async getDashboard(token: string): Promise<AdminDashboard> {
    const { data } = await apiClient.get<ApiResponse<AdminDashboard>>(
      "/admin/dashboard",
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
    )
    return data.data
  },
}
