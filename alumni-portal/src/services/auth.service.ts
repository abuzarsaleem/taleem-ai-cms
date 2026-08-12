import { apiClient } from "@/lib/api-client"
import type { ApiResponse } from "@/types/api"

export type LoginPayload = {
  email: string
  password: string
}

export type LoginResponse = {
  access_token: string
  user_id: string
  role: string
}

export type RegisterPayload = {
  full_name: string
  email: string
  phone_number?: string
  whatsapp_number?: string
  cnic_national_id: string
  degree_program_id: string
  registration_roll_number: string
  graduation_year: string
  upload_id?: string
}

export type RegisterResponse = {
  registration_id: string
  status: string
  submitted_at: string
  photo_url?: string | null
  message: string
}

export type UploadPhotoResponse = {
  upload_id: string
  public_url: string
  expires_at: string
}

export const authService = {
  async login(payload: LoginPayload): Promise<LoginResponse> {
    const { data } = await apiClient.post<ApiResponse<LoginResponse>>(
      "/auth/login",
      payload,
    )
    return data.data
  },

  async register(payload: RegisterPayload): Promise<RegisterResponse> {
    const { data } = await apiClient.post<ApiResponse<RegisterResponse>>(
      "/auth/register",
      payload,
    )
    return data.data
  },

  async uploadPhoto(file: File): Promise<UploadPhotoResponse> {
    const formData = new FormData()
    formData.append("file", file)

    const { data } = await apiClient.post<ApiResponse<UploadPhotoResponse>>(
      "/auth/upload-photo",
      formData,
    )
    return data.data
  },
}
