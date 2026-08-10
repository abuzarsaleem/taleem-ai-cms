const API_BASE =
  import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:3000/api/v1'

export type ApiSuccess<T> = {
  success: boolean
  message?: string
  data: T
}

export class ApiError extends Error {
  status: number
  code?: string

  constructor(status: number, message: string, code?: string) {
    super(message)
    this.status = status
    this.code = code
  }
}

export async function apiRequest<T>(
  path: string,
  options: RequestInit & { token?: string | null } = {},
): Promise<T> {
  const { token, headers, ...rest } = options
  const response = await fetch(`${API_BASE}${path}`, {
    ...rest,
    headers: {
      ...(rest.body instanceof FormData ? {} : { 'Content-Type': 'application/json' }),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...headers,
    },
  })

  const payload = await response.json().catch(() => ({}))
  if (!response.ok) {
    throw new ApiError(
      response.status,
      payload?.message ?? 'Request failed',
      payload?.code,
    )
  }

  return (payload?.data ?? payload) as T
}
