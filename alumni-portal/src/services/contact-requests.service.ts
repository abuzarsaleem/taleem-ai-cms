import { apiClient } from "@/lib/api-client"
import type { ApiResponse } from "@/types/api"
import type { ContactRequest } from "@/types/portal"

export const contactRequestService = {
  async create(payload: {
    target_alumni_id: string
    request_reason: string
  }): Promise<ContactRequest> {
    const { data } = await apiClient.post<ApiResponse<ContactRequest>>(
      "/contact-requests",
      payload,
    )
    return data.data
  },

  async listSent(): Promise<ContactRequest[]> {
    const { data } = await apiClient.get<ApiResponse<ContactRequest[]>>(
      "/contact-requests/sent",
    )
    return data.data
  },
}
