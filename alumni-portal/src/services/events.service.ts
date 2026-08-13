import { apiClient } from "@/lib/api-client"
import type { ApiResponse } from "@/types/api"
import type { EventItem, Paginated } from "@/types/portal"

export type EventListQuery = {
  scope?: "upcoming" | "past" | "all"
  page?: number
  page_size?: number
}

export const eventsService = {
  async list(query: EventListQuery = {}): Promise<Paginated<EventItem>> {
    const { data } = await apiClient.get<ApiResponse<Paginated<EventItem>>>(
      "/events",
      { params: query },
    )
    return data.data
  },

  async getOne(eventId: string): Promise<EventItem> {
    const { data } = await apiClient.get<ApiResponse<EventItem>>(
      `/events/${eventId}`,
    )
    return data.data
  },

  async createRsvp(eventId: string, status: string) {
    const { data } = await apiClient.post<ApiResponse<unknown>>(
      `/events/${eventId}/rsvp`,
      { status },
    )
    return data.data
  },

  async updateRsvp(eventId: string, status: string) {
    const { data } = await apiClient.patch<ApiResponse<unknown>>(
      `/events/${eventId}/rsvp`,
      { status },
    )
    return data.data
  },
}
