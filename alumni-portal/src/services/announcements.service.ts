import { apiClient } from "@/lib/api-client"
import type { ApiResponse } from "@/types/api"
import type { AnnouncementItem, Paginated } from "@/types/portal"

export type AnnouncementListQuery = {
  page?: number
  page_size?: number
}

export const announcementsService = {
  async list(
    query: AnnouncementListQuery = {},
  ): Promise<Paginated<AnnouncementItem>> {
    const { data } = await apiClient.get<
      ApiResponse<Paginated<AnnouncementItem>>
    >("/announcements", { params: query })
    return data.data
  },

  async getOne(announcementId: string): Promise<AnnouncementItem> {
    const { data } = await apiClient.get<ApiResponse<AnnouncementItem>>(
      `/announcements/${announcementId}`,
    )
    return data.data
  },
}
