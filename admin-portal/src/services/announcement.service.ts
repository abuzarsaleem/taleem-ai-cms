import { apiClient } from "@/lib/api-client"
import type { ApiResponse } from "@/types/api"

export type AnnouncementCategory =
  | "ANNOUNCEMENT"
  | "ALUMNI_SPOTLIGHT"
  | "CAMPUS_UPDATE"

export type FeaturedAlumni = {
  alumni_id: string
  full_name: string
  photo_url: string | null
  degree: string | null
  graduation_year: string | null
}

export type Announcement = {
  id: string
  title: string
  content: string
  category: AnnouncementCategory
  featured_alumni_id: string | null
  featured_alumni: FeaturedAlumni | null
  image_url: string | null
  is_published: boolean
  published_at: string | null
  created_by: string
}

export type AnnouncementListResponse = {
  items: Announcement[]
  total: number
  page: number
  page_size: number
}

export type AnnouncementListParams = {
  page?: number
  page_size?: number
  include_drafts?: boolean
}

export type AnnouncementPayload = {
  title: string
  content: string
  category: AnnouncementCategory
  featured_alumni_id?: string
  media_id?: string
  is_published?: boolean
}

export type UploadAnnouncementImageResponse = {
  media_id: string
  public_url: string
}

function authHeaders(token: string) {
  return { Authorization: `Bearer ${token}` }
}

export const announcementService = {
  async list(
    token: string,
    params: AnnouncementListParams = {},
  ): Promise<AnnouncementListResponse> {
    const { data } = await apiClient.get<ApiResponse<AnnouncementListResponse>>(
      "/admin/announcements",
      {
        headers: authHeaders(token),
        params: {
          page: params.page ?? 1,
          page_size: params.page_size ?? 20,
          include_drafts: params.include_drafts ?? false,
        },
      },
    )
    return data.data
  },

  async getById(token: string, id: string): Promise<Announcement> {
    const { data } = await apiClient.get<ApiResponse<Announcement>>(
      `/admin/announcements/${id}`,
      { headers: authHeaders(token) },
    )
    return data.data
  },

  async create(
    token: string,
    payload: AnnouncementPayload,
  ): Promise<Announcement> {
    const { data } = await apiClient.post<ApiResponse<Announcement>>(
      "/admin/announcements",
      payload,
      { headers: authHeaders(token) },
    )
    return data.data
  },

  async update(
    token: string,
    id: string,
    payload: Partial<AnnouncementPayload>,
  ): Promise<Announcement> {
    const { data } = await apiClient.patch<ApiResponse<Announcement>>(
      `/admin/announcements/${id}`,
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
    >(`/admin/announcements/${id}`, {
      headers: authHeaders(token),
    })
    return data.data
  },

  async uploadImage(
    token: string,
    file: File,
  ): Promise<UploadAnnouncementImageResponse> {
    const formData = new FormData()
    formData.append("file", file)
    const { data } = await apiClient.post<
      ApiResponse<UploadAnnouncementImageResponse>
    >("/admin/announcements/upload-image", formData, {
      headers: authHeaders(token),
    })
    return data.data
  },
}
