import { useEffect, useState } from "react"
import { Link } from "react-router-dom"
import { formatDistanceToNow, parseISO } from "date-fns"

import { ApiError } from "@/lib/api-client"
import { contactRequestService } from "@/services/contact-requests.service"
import type { ContactRequest } from "@/types/portal"
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { cn } from "@/lib/utils"

function relativeTime(value: string) {
  try {
    return formatDistanceToNow(parseISO(value), { addSuffix: true })
  } catch {
    return value
  }
}

function statusLabel(status: string) {
  switch (status) {
    case "PENDING_ADMIN":
      return "Pending admin review"
    case "PENDING_ALUMNI":
      return "Pending alumni"
    case "APPROVED":
      return "Approved"
    case "REJECTED_BY_ADMIN":
      return "Rejected by admin"
    case "REJECTED_BY_ALUMNI":
      return "Rejected by alumni"
    default:
      return status
  }
}

export function ContactRequestsPage() {
  const [items, setItems] = useState<ContactRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  useEffect(() => {
    let cancelled = false
    async function load() {
      setLoading(true)
      setError("")
      try {
        const data = await contactRequestService.listSent()
        if (!cancelled) setItems(data)
      } catch (err) {
        if (!cancelled) {
          setError(
            err instanceof ApiError
              ? err.message
              : "Failed to load contact requests",
          )
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    void load()
    return () => {
      cancelled = true
    }
  }, [])

  return (
    <div className="mx-auto max-w-3xl space-y-4">
      <div>
        <h1 className="font-display text-2xl font-semibold tracking-tight">
          Contact requests
        </h1>
        <p className="text-sm text-muted-foreground">
          Requests you’ve sent to connect with alumni
        </p>
      </div>

      {loading ? (
        <div className="space-y-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-16 animate-pulse rounded-lg bg-card" />
          ))}
        </div>
      ) : error ? (
        <Card>
          <CardHeader>
            <CardTitle>Unavailable</CardTitle>
            <CardDescription>{error}</CardDescription>
          </CardHeader>
        </Card>
      ) : items.length === 0 ? (
        <div className="rounded-lg border border-border bg-card p-8 text-center">
          <p className="text-sm text-muted-foreground">
            You haven’t sent any contact requests yet.
          </p>
          <Link
            to="/directory"
            className="mt-4 inline-flex h-8 items-center rounded-lg bg-primary px-3 text-sm font-medium text-primary-foreground"
          >
            Browse directory
          </Link>
        </div>
      ) : (
        <div className="overflow-hidden rounded-lg border border-border bg-card">
          {items.map((item, index) => (
            <div
              key={item.id}
              className={cn(
                "flex items-start justify-between gap-3 px-4 py-3",
                index < items.length - 1 && "border-b border-border",
              )}
            >
              <div className="min-w-0">
                <p className="text-sm font-semibold">
                  {statusLabel(item.status)}
                </p>
                <p className="mt-0.5 line-clamp-2 text-sm text-muted-foreground">
                  {item.request_reason}
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {relativeTime(item.created_at)}
                </p>
              </div>
              <Link
                to={`/directory/${item.target_alumni_id}`}
                className="shrink-0 text-xs font-semibold text-primary hover:underline"
              >
                View alumni
              </Link>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
