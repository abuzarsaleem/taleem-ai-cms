import { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"

import { useAuth } from "@/auth/AuthContext"
import { AppShell } from "@/layouts/AppShell"
import { apiClient, ApiError } from "@/lib/api-client"
import { PROFILE_UPDATED_EVENT } from "@/lib/portal-events"
import { NotificationsProvider } from "@/hooks/use-notifications"
import type { ApiResponse } from "@/types/api"

type ProfileSummary = {
  full_name: string
  photo_url: string | null
}

export function AuthenticatedLayout() {
  const { clearSession } = useAuth()
  const navigate = useNavigate()
  const [fullName, setFullName] = useState("Alumni")
  const [photoUrl, setPhotoUrl] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    async function loadProfile() {
      try {
        const { data } = await apiClient.get<ApiResponse<ProfileSummary>>(
          "/me/profile",
        )
        if (cancelled) return
        setFullName(data.data.full_name)
        setPhotoUrl(data.data.photo_url)
      } catch (err) {
        if (err instanceof ApiError && err.status === 401) {
          clearSession()
          navigate("/login", { replace: true })
        }
      }
    }
    void loadProfile()
    function onUpdated() {
      void loadProfile()
    }
    window.addEventListener(PROFILE_UPDATED_EVENT, onUpdated)
    return () => {
      cancelled = true
      window.removeEventListener(PROFILE_UPDATED_EVENT, onUpdated)
    }
  }, [clearSession, navigate])

  return (
    <NotificationsProvider>
      <AppShell fullName={fullName} photoUrl={photoUrl} />
    </NotificationsProvider>
  )
}
