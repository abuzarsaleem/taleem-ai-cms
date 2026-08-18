import { useEffect, useMemo, useState } from "react"
import { Link } from "react-router-dom"
import { formatDistanceToNow, parseISO } from "date-fns"

import { LinkWithFrom } from "@/components/page-breadcrumb"

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
      return "Pending alumni response"
    case "APPROVED":
      return "Approved"
    case "REJECTED_BY_ADMIN":
      return "Rejected by admin"
    case "REJECTED_BY_ALUMNI":
      return "Rejected"
    default:
      return status
  }
}

function isRequested(status: string) {
  return (
    status === "PENDING_ADMIN" ||
    status === "PENDING_ALUMNI" ||
    status === "REJECTED_BY_ADMIN" ||
    status === "REJECTED_BY_ALUMNI"
  )
}

function isContact(status: string) {
  return status === "APPROVED"
}

type Tab = "contacts" | "requested"

export function ContactRequestsPage() {
  const [items, setItems] = useState<ContactRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [tab, setTab] = useState<Tab>("contacts")

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

  const visible = useMemo(() => {
    if (tab === "contacts") return items.filter((item) => isContact(item.status))
    return items.filter((item) => isRequested(item.status))
  }, [items, tab])

  return (
    <div className="space-y-4">
      <div>
        <h1 className="font-display text-2xl font-semibold tracking-tight">
          My Contacts
        </h1>
        <p className="text-sm text-muted-foreground">
          People you’ve connected with, and requests still in progress
        </p>
      </div>

      <div className="flex gap-1 rounded-lg border border-border bg-card p-1">
        {(
          [
            { id: "contacts" as const, label: "Contacts" },
            { id: "requested" as const, label: "Requested" },
          ] as const
        ).map((option) => (
          <button
            key={option.id}
            type="button"
            onClick={() => setTab(option.id)}
            className={cn(
              "flex-1 rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
              tab === option.id
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            {option.label}
          </button>
        ))}
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
      ) : visible.length === 0 ? (
        <div className="rounded-lg border border-border bg-card p-8 text-center">
          <p className="text-sm text-muted-foreground">
            {tab === "contacts"
              ? "No contacts yet."
              : "No requested contacts yet."}
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
          {visible.map((item, index) => (
            <div
              key={item.id}
              className={cn(
                "flex items-start justify-between gap-3 px-4 py-3",
                index < visible.length - 1 && "border-b border-border",
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
              <LinkWithFrom
                to={`/directory/${item.target_alumni_id}`}
                className="shrink-0 text-xs font-semibold text-primary hover:underline"
              >
                View alumni
              </LinkWithFrom>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
