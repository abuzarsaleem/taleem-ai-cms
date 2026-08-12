import axios, { type AxiosError } from "axios"

export class ApiError extends Error {
  status: number
  code?: string

  constructor(status: number, message: string, code?: string) {
    super(message)
    this.status = status
    this.code = code
  }
}

function extractErrorMessage(payload: unknown): string {
  if (!payload || typeof payload !== "object") return "Request failed"
  const message = (payload as { message?: unknown }).message
  if (Array.isArray(message)) return message.join(", ")
  if (typeof message === "string") return message
  return "Request failed"
}

export const apiClient = axios.create({
  baseURL:
    import.meta.env.VITE_API_BASE_URL ?? "https://taleem-ai-cms-production.up.railway.app/api/v1",
  headers: {
    Accept: "application/json",
  },
})

apiClient.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    const status = error.response?.status ?? 0
    const payload = error.response?.data
    const code =
      payload && typeof payload === "object"
        ? (payload as { code?: string }).code
        : undefined
    throw new ApiError(status, extractErrorMessage(payload), code)
  },
)
