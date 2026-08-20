import { apiClient } from "@/lib/api-client"
import type { ApiResponse } from "@/types/api"

export type ContactRequestStatus =
  | "PENDING_ADMIN"
  | "REJECTED_BY_ADMIN"
  | "PENDING_ALUMNI"
  | "REJECTED_BY_ALUMNI"
  | "APPROVED"

export type ContactRequest = {
  id: string
  requester_alumni_id: string
  requester_alumni_name?: string | null
  target_alumni_id: string
  target_alumni_name?: string | null
  request_reason: string
  requested_fields?: string[]
  status: ContactRequestStatus
  admin_id: string | null
  rejection_reason: string | null
  created_at: string
  updated_at: string
}

export type ContactReviewAction = "APPROVE" | "REJECT"

function authHeaders(token: string) {
  return { Authorization: `Bearer ${token}` }
}

export const contactRequestService = {
  async list(
    token: string,
    status?: ContactRequestStatus | "",
  ): Promise<ContactRequest[]> {
    const { data } = await apiClient.get<ApiResponse<ContactRequest[]>>(
      "/admin/contact-requests",
      {
        headers: authHeaders(token),
        params: status ? { status } : undefined,
      },
    )
    return data.data
  },

  async review(
    token: string,
    id: string,
    action: ContactReviewAction,
    rejectionReason?: string,
  ): Promise<ContactRequest> {
    const body =
      action === "REJECT"
        ? { rejection_reason: rejectionReason?.trim() ?? "" }
        : {}

    const { data } = await apiClient.patch<ApiResponse<ContactRequest>>(
      `/admin/contact-requests/${id}/${action}`,
      body,
      { headers: authHeaders(token) },
    )
    return data.data
  },
}
