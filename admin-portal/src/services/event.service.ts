import { apiClient } from "@/lib/api-client"
import type { ApiResponse } from "@/types/api"

export type EventType =
  | "REUNION"
  | "NETWORKING_DINNER"
  | "GUEST_LECTURE"
  | "OTHER"

export type EventListScope = "upcoming" | "past" | "all"

export type EventTargetCriteria = {
  campus_ids?: string[]
  degree_program_ids?: string[]
  graduation_years?: number[]
  cities?: string[]
}

export type EventRsvpCounts = {
  going: number
  not_going: number
  maybe: number
  total: number
}

export type EventLifecycleStatus = "SCHEDULED" | "POSTPONED"

export type AdminEvent = {
  id: string
  title: string
  description: string | null
  event_type: EventType
  event_date: string
  start_time: string
  end_time: string | null
  venue: string
  guest_speaker: string | null
  image_url: string | null
  is_draft: boolean
  status?: EventLifecycleStatus
  status_reason?: string | null
  target_criteria: EventTargetCriteria | null
  created_by: string
  created_at: string
  updated_at: string
  my_rsvp_status?: "GOING" | "NOT_GOING" | "MAYBE" | null
  rsvp_counts?: EventRsvpCounts
}

export type EventListResponse = {
  items: AdminEvent[]
  total: number
  page: number
  page_size: number
}

export type EventListParams = {
  scope?: EventListScope
  page?: number
  page_size?: number
}

export type EventPayload = {
  title: string
  description?: string
  event_type: EventType
  event_date: string
  start_time: string
  end_time?: string
  venue: string
  guest_speaker?: string
  media_id?: string
  is_draft?: boolean
  target_criteria?: EventTargetCriteria | null
}

export type AdminRsvpListItem = {
  id: string
  event_id: string
  alumni_id: string
  full_name: string | null
  email: string | null
  status: "GOING" | "NOT_GOING" | "MAYBE"
  created_at: string
  updated_at: string
}

export type UploadEventImageResponse = {
  media_id: string
  public_url: string
}

export type CancelEventPayload = {
  reason?: string
}

export type PostponeEventPayload = {
  reason: string
  event_date?: string
  start_time?: string
  end_time?: string | null
  venue?: string
}

function authHeaders(token: string) {
  return { Authorization: `Bearer ${token}` }
}

export const eventService = {
  async list(
    token: string,
    params: EventListParams = {},
  ): Promise<EventListResponse> {
    const { data } = await apiClient.get<ApiResponse<EventListResponse>>(
      "/admin/events",
      {
        headers: authHeaders(token),
        params: {
          scope: params.scope ?? "all",
          page: params.page ?? 1,
          page_size: params.page_size ?? 20,
        },
      },
    )
    return data.data
  },

  async getById(token: string, id: string): Promise<AdminEvent> {
    const { data } = await apiClient.get<ApiResponse<AdminEvent>>(
      `/admin/events/${id}`,
      { headers: authHeaders(token) },
    )
    return data.data
  },

  async create(token: string, payload: EventPayload): Promise<AdminEvent> {
    const { data } = await apiClient.post<ApiResponse<AdminEvent>>(
      "/admin/events",
      payload,
      { headers: authHeaders(token) },
    )
    return data.data
  },

  async update(
    token: string,
    id: string,
    payload: Partial<EventPayload>,
  ): Promise<AdminEvent> {
    const { data } = await apiClient.patch<ApiResponse<AdminEvent>>(
      `/admin/events/${id}`,
      payload,
      { headers: authHeaders(token) },
    )
    return data.data
  },

  async remove(
    token: string,
    id: string,
  ): Promise<{ id: string; deleted: boolean }> {
    const { data } = await apiClient.delete<
      ApiResponse<{ id: string; deleted: boolean }>
    >(`/admin/events/${id}`, {
      headers: authHeaders(token),
    })
    return data.data
  },

  async cancel(
    token: string,
    id: string,
    payload: CancelEventPayload = {},
  ): Promise<{ id: string; deleted: boolean }> {
    const { data } = await apiClient.post<
      ApiResponse<{ id: string; deleted: boolean }>
    >(`/admin/events/${id}/cancel`, payload, {
      headers: authHeaders(token),
    })
    return data.data
  },

  async postpone(
    token: string,
    id: string,
    payload: PostponeEventPayload,
  ): Promise<AdminEvent> {
    const { data } = await apiClient.post<ApiResponse<AdminEvent>>(
      `/admin/events/${id}/postpone`,
      payload,
      { headers: authHeaders(token) },
    )
    return data.data
  },

  async listRsvps(token: string, id: string): Promise<AdminRsvpListItem[]> {
    const { data } = await apiClient.get<ApiResponse<AdminRsvpListItem[]>>(
      `/admin/events/${id}/rsvps`,
      { headers: authHeaders(token) },
    )
    return data.data
  },

  async uploadImage(
    token: string,
    file: File,
  ): Promise<UploadEventImageResponse> {
    const formData = new FormData()
    formData.append("file", file)
    const { data } = await apiClient.post<
      ApiResponse<UploadEventImageResponse>
    >("/admin/events/upload-image", formData, {
      headers: authHeaders(token),
    })
    return data.data
  },
}
