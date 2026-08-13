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
  if (typeof payload === "string") {
    const trimmed = payload.trim()
    if (trimmed.startsWith("<!DOCTYPE") || trimmed.startsWith("<html")) {
      return "API endpoint not found"
    }
    return trimmed || "Request failed"
  }
  if (!payload || typeof payload !== "object") return "Request failed"
  const message = (payload as { message?: unknown }).message
  if (Array.isArray(message)) return message.join(", ")
  if (typeof message === "string") return message
  return "Request failed"
}

const STORAGE_KEY = "taleem_alumni_auth"

function readStoredToken(): string | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as { token?: string }
    return parsed.token ?? null
  } catch {
    return null
  }
}

export const apiClient = axios.create({
  baseURL:
    import.meta.env.VITE_API_BASE_URL ??
    "https://taleem-ai-cms-production.up.railway.app/api/v1",
  headers: {
    Accept: "application/json",
  },
})

apiClient.interceptors.request.use((config) => {
  const token = readStoredToken()
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
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
