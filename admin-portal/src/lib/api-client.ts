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

function fallbackMessage(status: number) {
  if (status === 401) return "Invalid credentials"
  if (status === 403) return "You don't have access to this resource"
  if (status === 410) return "Session expired"
  if (status === 423) return "Account temporarily locked"
  return "Request failed"
}

function extractErrorMessage(payload: unknown, status = 0): string {
  if (typeof payload === "string") {
    const trimmed = payload.trim()
    if (!trimmed || trimmed.startsWith("<!DOCTYPE") || trimmed.startsWith("<html")) {
      return fallbackMessage(status)
    }
    try {
      return extractErrorMessage(JSON.parse(trimmed) as unknown, status)
    } catch {
      return trimmed
    }
  }

  if (payload && typeof payload === "object") {
    const record = payload as {
      message?: unknown
      error?: unknown
    }

    if (typeof record.message === "string" && record.message.trim()) {
      return record.message
    }
    if (Array.isArray(record.message)) {
      const joined = record.message
        .filter((item): item is string => typeof item === "string" && item.trim().length > 0)
        .join(", ")
      if (joined) return joined
    }
    if (typeof record.error === "string" && record.error.trim()) {
      return record.error
    }
    if (record.error && typeof record.error === "object") {
      const nested = (record.error as { message?: unknown }).message
      if (typeof nested === "string" && nested.trim()) return nested
    }
  }

  return fallbackMessage(status)
}

type SessionExpiredHandler = () => void

let sessionExpiredHandler: SessionExpiredHandler | null = null
let sessionExpiredInFlight = false

export function setSessionGoneHandler(handler: SessionExpiredHandler | null) {
  sessionExpiredHandler = handler
}

function handleSessionExpired() {
  if (sessionExpiredInFlight) return
  sessionExpiredInFlight = true
  sessionExpiredHandler?.()
  window.setTimeout(() => {
    sessionExpiredInFlight = false
  }, 500)
}

function isLoginRequest(error: AxiosError) {
  const url = `${error.config?.baseURL ?? ""}${error.config?.url ?? ""}`
  return url.includes("/auth/login")
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
    const message = extractErrorMessage(payload, status)

    if ((status === 401 || status === 410) && !isLoginRequest(error)) {
      handleSessionExpired()
    }

    return Promise.reject(new ApiError(status, message, code))
  },
)
