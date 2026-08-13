import { formatDistanceToNow, parseISO } from "date-fns"
import { useEffect, useState } from "react"
import { Link, useParams } from "react-router-dom"

import { ApiError } from "@/lib/api-client"
import { announcementsService } from "@/services/announcements.service"
import type { AnnouncementItem } from "@/types/portal"
import {
  Card,
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

function categoryLabel(category: string | null | undefined) {
  if (!category) return "Announcement"
  return category.replace(/_/g, " ")
}

function AnnouncementCover({ item }: { item: AnnouncementItem }) {
  if (item.image_url) {
    return (
      <img
        src={item.image_url}
        alt=""
        className="aspect-[16/9] w-full rounded-lg object-cover"
      />
    )
  }

  return (
    <div className="relative flex aspect-[16/9] w-full items-end overflow-hidden rounded-lg bg-[linear-gradient(160deg,oklch(0.45_0.1_75),oklch(0.38_0.08_50)_55%,oklch(0.34_0.06_40))] p-4">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_75%_20%,oklch(1_0_0/0.16),transparent_50%)]" />
      <div className="relative">
        <p className="text-[11px] font-semibold tracking-[0.14em] text-white/70 uppercase">
          {categoryLabel(item.category)}
        </p>
        <p className="mt-1 line-clamp-2 text-lg font-semibold text-white">
          {item.title}
        </p>
      </div>
    </div>
  )
}

function FeaturedAlumniRow({
  alumni,
}: {
  alumni: NonNullable<AnnouncementItem["featured_alumni"]>
}) {
  const initials = alumni.full_name
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("")

  return (
    <Link
      to={`/directory/${alumni.alumni_id}`}
      className="flex items-center gap-3 rounded-lg border border-border bg-muted/30 p-3 transition-colors hover:bg-muted/55"
      onClick={(event) => event.stopPropagation()}
    >
      {alumni.photo_url ? (
        <img
          src={alumni.photo_url}
          alt=""
          className="size-11 rounded-full object-cover"
        />
      ) : (
        <div className="flex size-11 items-center justify-center rounded-full bg-primary text-sm font-semibold text-primary-foreground">
          {initials}
        </div>
      )}
      <div className="min-w-0">
        <p className="text-[11px] font-semibold tracking-wide text-muted-foreground uppercase">
          Featured alumni
        </p>
        <p className="truncate text-sm font-semibold">{alumni.full_name}</p>
        <p className="truncate text-xs text-muted-foreground">
          {[alumni.degree, alumni.graduation_year].filter(Boolean).join(" · ")}
        </p>
      </div>
    </Link>
  )
}

function AnnouncementCard({
  item,
  linkTitle = true,
  clampContent = true,
}: {
  item: AnnouncementItem
  linkTitle?: boolean
  clampContent?: boolean
}) {
  const meta = [
    categoryLabel(item.category),
    relativeTime(item.published_at),
  ]
    .filter(Boolean)
    .join(" · ")

  return (
    <article className="overflow-hidden rounded-xl border border-border bg-card">
      <div className="space-y-3 p-4 sm:p-5">
        <div>
          {linkTitle ? (
            <Link
              to={`/announcements/${item.id}`}
              className="text-[18px] font-semibold leading-snug text-foreground hover:text-primary hover:underline"
            >
              {item.title}
            </Link>
          ) : (
            <h2 className="text-[18px] font-semibold leading-snug text-foreground">
              {item.title}
            </h2>
          )}
          {meta ? (
            <p className="mt-1 text-sm text-muted-foreground">{meta}</p>
          ) : null}
        </div>

        <Link to={`/announcements/${item.id}`} className="block">
          <AnnouncementCover item={item} />
        </Link>

        {item.featured_alumni ? (
          <FeaturedAlumniRow alumni={item.featured_alumni} />
        ) : null}

        {item.content ? (
          <p
            className={
              clampContent
                ? "line-clamp-3 text-sm leading-relaxed text-muted-foreground whitespace-pre-wrap"
                : "text-sm leading-relaxed text-muted-foreground whitespace-pre-wrap"
            }
          >
            {item.content}
          </p>
        ) : null}

        {linkTitle ? (
          <Link
            to={`/announcements/${item.id}`}
            className="inline-flex text-sm font-medium text-primary hover:underline"
          >
            Read more
          </Link>
        ) : null}
      </div>
    </article>
  )
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
    <div className="space-y-4">
      <div>
        <h1 className="font-display text-2xl font-semibold tracking-tight">
          Announcements
        </h1>
        <p className="text-sm text-muted-foreground">
          Updates from your alumni network
        </p>
      </div>

      {loading ? (
        <div className="mx-auto w-full max-w-[560px] space-y-4">
          {Array.from({ length: 2 }).map((_, i) => (
            <div
              key={i}
              className="h-[22rem] animate-pulse rounded-xl border border-border bg-card"
            />
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
        <div className="rounded-xl border border-border bg-card p-8 text-center text-sm text-muted-foreground">
          No announcements yet.
        </div>
      ) : (
        <div className="mx-auto w-full max-w-[560px] space-y-4">
          {items.map((item) => (
            <AnnouncementCard key={item.id} item={item} />
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
    return (
      <div className="mx-auto h-[22rem] w-full max-w-[560px] animate-pulse rounded-xl bg-muted" />
    )
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
    <div className="mx-auto w-full max-w-[560px] space-y-3">
      <Link
        to="/announcements"
        className="inline-flex items-center gap-1 text-sm text-primary hover:underline"
      >
        ← Back to announcements
      </Link>
      <AnnouncementCard item={item} linkTitle={false} clampContent={false} />
    </div>
  )
}
