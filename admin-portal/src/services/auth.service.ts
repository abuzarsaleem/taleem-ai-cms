import { apiClient } from "@/lib/api-client"
import { encryptPassword } from "@/lib/password-encryption"
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

export const authService = {
  async login(payload: LoginPayload): Promise<LoginResponse> {
    const encryptedPassword = await encryptPassword(payload.password)

    const { data } = await apiClient.post<ApiResponse<LoginResponse>>(
      "/admin/auth/login",
      {
        email: payload.email,
        password: encryptedPassword,
      },
    )
    return data.data
  },
}
