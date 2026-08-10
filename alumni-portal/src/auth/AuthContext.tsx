import { createContext, useContext, useMemo, useState, type ReactNode } from 'react'

type AuthState = {
  token: string | null
  userId: string | null
  role: string | null
  setSession: (session: { token: string; userId: string; role: string }) => void
  clearSession: () => void
}

const AuthContext = createContext<AuthState | null>(null)
const STORAGE_KEY = 'taleem_alumni_auth'

function readStored() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? (JSON.parse(raw) as { token: string; userId: string; role: string }) : null
  } catch {
    return null
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const stored = readStored()
  const [token, setToken] = useState<string | null>(stored?.token ?? null)
  const [userId, setUserId] = useState<string | null>(stored?.userId ?? null)
  const [role, setRole] = useState<string | null>(stored?.role ?? null)

  const value = useMemo<AuthState>(
    () => ({
      token,
      userId,
      role,
      setSession: (session) => {
        setToken(session.token)
        setUserId(session.userId)
        setRole(session.role)
        localStorage.setItem(STORAGE_KEY, JSON.stringify(session))
      },
      clearSession: () => {
        setToken(null)
        setUserId(null)
        setRole(null)
        localStorage.removeItem(STORAGE_KEY)
      },
    }),
    [token, userId, role],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
