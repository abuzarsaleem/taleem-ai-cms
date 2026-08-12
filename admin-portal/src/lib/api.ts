import { apiClient, ApiError } from "@/lib/api-client"
import type { ApiResponse } from "@/types/api"

export { ApiError }

export async function apiRequest<T>(
  path: string,
  options: {
    method?: string
    body?: BodyInit | null
    token?: string | null
    headers?: Record<string, string>
  } = {},
): Promise<T> {
  const { token, headers, body, method = "GET" } = options

  let data: unknown = undefined
  if (body instanceof FormData) {
    data = body
  } else if (typeof body === "string" && body.length > 0) {
    data = JSON.parse(body)
  }

  const response = await apiClient.request({
    url: path,
    method: method.toUpperCase(),
    data,
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...headers,
    },
  })

  const payload = response.data as ApiResponse<T> | T
  if (payload && typeof payload === "object" && "data" in payload) {
    return payload.data as T
  }
  return payload as T
}
