import { apiClient } from "@/lib/api-client"
import type { ApiResponse } from "@/types/api"
import type { ContactRequest } from "@/types/portal"

export type ContactRequestedField = "email" | "mobile" | "whatsapp"

export const contactRequestService = {
  async create(payload: {
    target_alumni_id: string
    request_reason: string
    requested_fields: ContactRequestedField[]
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
