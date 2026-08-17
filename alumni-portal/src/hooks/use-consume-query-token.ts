import { useEffect, useState } from "react"
import { useSearchParams } from "react-router-dom"

function readStored(key: string) {
  try {
    return sessionStorage.getItem(key) ?? ""
  } catch {
    return ""
  }
}

function writeStored(key: string, value: string) {
  try {
    sessionStorage.setItem(key, value)
  } catch {
    /* ignore */
  }
}

/** Reads `token` from the URL once, then strips it so it is not left in the address bar. */
export function useConsumeQueryToken(storageKey: string): string {
  const [params, setSearchParams] = useSearchParams()
  const [token] = useState(() => {
    const fromQuery =
      new URLSearchParams(window.location.search).get("token")?.trim() ?? ""
    const value = fromQuery || readStored(storageKey)
    if (fromQuery) writeStored(storageKey, fromQuery)
    return value
  })

  useEffect(() => {
    if (!params.has("token")) return
    const next = new URLSearchParams(params)
    next.delete("token")
    setSearchParams(next, { replace: true })
  }, [params, setSearchParams])

  return token
}
