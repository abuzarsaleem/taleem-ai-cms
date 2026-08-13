import { formatDistanceToNow, parseISO } from "date-fns"
import { useEffect, useState } from "react"
import { Link, useParams } from "react-router-dom"

import { ApiError } from "@/lib/api-client"
import { cn } from "@/lib/utils"
import { announcementsService } from "@/services/announcements.service"
import type { AnnouncementItem } from "@/types/portal"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

function relativeTime(value: string | null) {
  if (!value) return ""
  try {
    return formatDistanceToNow(parseISO(value), { addSuffix: true })
  } catch {
    return ""
  }
}

export function AnnouncementsPage() {
  const [items, setItems] = useState<AnnouncementItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  useEffect(() => {
    let cancelled = false
    async function load() {
      setLoading(true)
      setError("")
      try {
        const page = await announcementsService.list({
          page: 1,
          page_size: 20,
        })
        if (!cancelled) setItems(page.items)
      } catch (err) {
        if (!cancelled) {
          setError(
            err instanceof ApiError
              ? err.message
              : "Failed to load announcements",
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
          Announcements
        </h1>
        <p className="text-sm text-muted-foreground">
          Updates from your alumni network
        </p>
      </div>

      {loading ? (
        <div className="space-y-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-24 animate-pulse rounded-lg bg-card" />
          ))}
        </div>
      ) : error ? (
        <Card>
          <CardHeader>
            <CardTitle>Announcements unavailable</CardTitle>
            <CardDescription>{error}</CardDescription>
          </CardHeader>
        </Card>
      ) : items.length === 0 ? (
        <div className="rounded-lg border border-border bg-card p-8 text-center text-sm text-muted-foreground">
          No announcements yet.
        </div>
      ) : (
        <div className="overflow-hidden rounded-lg border border-border bg-card">
          {items.map((item, index) => (
            <Link
              key={item.id}
              to={`/announcements/${item.id}`}
              className={cn(
                "block px-4 py-3.5 transition-colors hover:bg-muted/40",
                index < items.length - 1 && "border-b border-border",
              )}
            >
              <p className="font-semibold leading-snug">{item.title}</p>
              <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">
                {item.content}
              </p>
              <p className="mt-2 text-xs text-muted-foreground">
                {relativeTime(item.published_at)}
              </p>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}

export function AnnouncementDetailPage() {
  const { announcementId = "" } = useParams()
  const [item, setItem] = useState<AnnouncementItem | null>(null)
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    async function load() {
      setLoading(true)
      setError("")
      try {
        const data = await announcementsService.getOne(announcementId)
        if (!cancelled) setItem(data)
      } catch (err) {
        if (!cancelled) {
          setError(
            err instanceof ApiError
              ? err.message
              : "Failed to load announcement",
          )
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    if (announcementId) void load()
    return () => {
      cancelled = true
    }
  }, [announcementId])

  if (loading) {
    return <div className="h-40 animate-pulse rounded-xl bg-muted" />
  }

  if (error || !item) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Announcement unavailable</CardTitle>
          <CardDescription>{error || "Not found"}</CardDescription>
        </CardHeader>
      </Card>
    )
  }

  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <Link
        to="/announcements"
        className="text-sm text-primary hover:underline"
      >
        Back to announcements
      </Link>
      <Card>
        <CardHeader>
          <CardTitle>{item.title}</CardTitle>
          <CardDescription>
            {item.category}
            {item.published_at
              ? ` · ${relativeTime(item.published_at)}`
              : ""}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {item.image_url ? (
            <img
              src={item.image_url}
              alt=""
              className="mb-4 max-h-72 w-full rounded-lg object-cover"
            />
          ) : null}
          <p className="whitespace-pre-wrap text-sm leading-relaxed text-muted-foreground">
            {item.content}
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
