import { apiClient } from "@/lib/api-client"
import type { ApiResponse } from "@/types/api"

export type RegistrationStatus = "PENDING" | "APPROVED" | "REJECTED"

export type RegistrationListItem = {
  registration_id: string
  full_name: string
  email: string
  phone_number: string | null
  status: RegistrationStatus
  submitted_at: string
  degree_program_id: string
  registration_roll_number: string
  graduation_year: string
  cnic_national_id: string
  photo_url: string | null
}

export type RegistrationAlumniSummary = {
  alumni_id: string
  status: string
  user_id: string | null
  photo_url: string | null
  qr_code: string | null
}

export type RegistrationDetail = RegistrationListItem & {
  whatsapp_number: string | null
  rejection_reason: string | null
  reviewed_by: string | null
  reviewed_at: string | null
  alumni: RegistrationAlumniSummary | null
}

export type ReviewRegistrationPayload = {
  status: "APPROVED" | "REJECTED"
  cnic_national_id: string
  rejection_reason?: string
}

export type RegistrationApproveResult = {
  registration_id: string
  alumni_id: string
  user_id: string
  status: "APPROVED"
  qr_code: string | null
  qr_failed: boolean
  notification_failed: boolean
}

export type RegistrationRejectResult = {
  registration_id: string
  status: "REJECTED"
  rejection_reason: string
  notification_failed: boolean
}

export type ReviewRegistrationResult =
  | RegistrationApproveResult
  | RegistrationRejectResult

function authHeaders(token: string) {
  return { Authorization: `Bearer ${token}` }
}

export const registrationService = {
  async list(
    token: string,
    status?: RegistrationStatus | "",
  ): Promise<RegistrationListItem[]> {
    const { data } = await apiClient.get<ApiResponse<RegistrationListItem[]>>(
      "/admin/registrations",
      {
        headers: authHeaders(token),
        params: status ? { status } : undefined,
      },
    )
    return data.data
  },

  async getById(token: string, id: string): Promise<RegistrationDetail> {
    const { data } = await apiClient.get<ApiResponse<RegistrationDetail>>(
      `/admin/registrations/${id}`,
      {
        headers: authHeaders(token),
      },
    )
    return data.data
  },

  async review(
    token: string,
    id: string,
    payload: ReviewRegistrationPayload,
  ): Promise<ReviewRegistrationResult> {
    const { data } = await apiClient.patch<
      ApiResponse<ReviewRegistrationResult>
    >(`/admin/registrations/${id}`, payload, {
      headers: authHeaders(token),
    })
    return data.data
  },
}
