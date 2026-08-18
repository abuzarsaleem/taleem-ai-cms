import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'

import { setSessionGoneHandler } from '@/lib/api-client'

type AuthState = {
  token: string | null
  userId: string | null
  role: string | null
  setSession: (session: { token: string; userId: string; role: string }) => void
  clearSession: () => void
}

const AuthContext = createContext<AuthState | null>(null)
const STORAGE_KEY = 'taleem_admin_auth'

function readStored() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? (JSON.parse(raw) as { token: string; userId: string; role: string }) : null
  } catch {
    return null
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const navigate = useNavigate()
  const stored = readStored()
  const [token, setToken] = useState<string | null>(stored?.token ?? null)
  const [userId, setUserId] = useState<string | null>(stored?.userId ?? null)
  const [role, setRole] = useState<string | null>(stored?.role ?? null)

  const setSession = useCallback(
    (session: { token: string; userId: string; role: string }) => {
      setToken(session.token)
      setUserId(session.userId)
      setRole(session.role)
      localStorage.setItem(STORAGE_KEY, JSON.stringify(session))
    },
    [],
  )

  const clearSession = useCallback(() => {
    setToken(null)
    setUserId(null)
    setRole(null)
    localStorage.removeItem(STORAGE_KEY)
  }, [])

  useEffect(() => {
    setSessionGoneHandler(() => {
      clearSession()
      if (window.location.pathname !== '/login') {
        toast.error('Session expired. Please sign in again.')
        navigate('/login', { replace: true })
      }
    })
    return () => setSessionGoneHandler(null)
  }, [clearSession, navigate])

  const value = useMemo<AuthState>(
    () => ({
      token,
      userId,
      role,
      setSession,
      clearSession,
    }),
    [token, userId, role, setSession, clearSession],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
