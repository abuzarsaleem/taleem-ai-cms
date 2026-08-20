import { format, formatDistanceToNow, parseISO } from "date-fns"
import { ArrowUpRight, Megaphone } from "lucide-react"
import { useEffect, useState } from "react"
import { useParams } from "react-router-dom"

import { LinkWithFrom, PageBreadcrumb } from "@/components/page-breadcrumb"
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { ApiError } from "@/lib/api-client"
import { cn } from "@/lib/utils"
import { announcementsService } from "@/services/announcements.service"
import type { AnnouncementItem } from "@/types/portal"

function relativeTime(value: string | null) {
  if (!value) return ""
  try {
    return formatDistanceToNow(parseISO(value), { addSuffix: true })
  } catch {
    return ""
  }
}

function formatDate(value: string | null) {
  if (!value) return { day: "—", month: "", full: "", year: "" }
  try {
    const d = parseISO(value)
    return {
      day: format(d, "d"),
      month: format(d, "MMM"),
      year: format(d, "yyyy"),
      full: format(d, "d MMMM yyyy"),
    }
  } catch {
    return { day: "—", month: "", full: value, year: "" }
  }
}

function categoryLabel(category: string | null | undefined) {
  if (!category) return "Announcement"
  return category.replace(/_/g, " ")
}

function excerpt(text: string, max = 180) {
  const clean = text.replace(/\s+/g, " ").trim()
  if (clean.length <= max) return clean
  return `${clean.slice(0, max).replace(/\s+\S*$/, "")}…`
}

function MediaPlane({
  item,
  className,
}: {
  item: AnnouncementItem
  className?: string
}) {
  if (item.image_url) {
    return (
      <img
        src={item.image_url}
        alt=""
        className={cn("h-full w-full object-cover", className)}
      />
    )
  }

  return (
    <div
      className={cn(
        "relative flex h-full w-full items-end overflow-hidden bg-[linear-gradient(145deg,#081b45_0%,#123868_55%,#1a9aa0_130%)] p-6",
        className,
      )}
    >
      <div
        aria-hidden
        className="absolute inset-0 opacity-[0.18]"
        style={{
          backgroundImage:
            "repeating-linear-gradient(90deg, transparent 0, transparent 18px, #fff 18px, #fff 19px)",
        }}
      />
      <Megaphone className="relative size-8 text-[#7fe2de]/90" strokeWidth={1.5} />
    </div>
  )
}

function AlumniCredit({
  alumni,
}: {
  alumni: NonNullable<AnnouncementItem["featured_alumni"]>
}) {
  const initials = alumni.full_name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? "")
    .join("")

  return (
    <LinkWithFrom
      to={`/directory/${alumni.alumni_id}`}
      className="group/alumni inline-flex max-w-full items-center gap-3"
      onClick={(e) => e.stopPropagation()}
    >
      {alumni.photo_url ? (
        <img
          src={alumni.photo_url}
          alt=""
          className="size-10 rounded-full object-cover ring-2 ring-white"
        />
      ) : (
        <span className="flex size-10 items-center justify-center rounded-full bg-primary text-xs font-bold text-white">
          {initials}
        </span>
      )}
      <span className="min-w-0">
        <span className="block text-[10px] font-semibold tracking-[0.16em] text-[#1e8f97] uppercase">
          Featured alumni
        </span>
        <span className="block truncate text-sm font-semibold text-primary group-hover/alumni:underline">
          {alumni.full_name}
        </span>
        <span className="block truncate text-xs text-muted-foreground">
          {[alumni.degree, alumni.graduation_year].filter(Boolean).join(" · ")}
        </span>
      </span>
    </LinkWithFrom>
  )
}

function FeaturedStory({ item }: { item: AnnouncementItem }) {
  const date = formatDate(item.published_at)

  return (
    <article className="group overflow-hidden rounded-2xl bg-white shadow-[0_18px_50px_rgba(8,27,69,0.08)] ring-1 ring-[#e5eaf1]">
      <LinkWithFrom
        to={`/announcements/${item.id}`}
        className="relative block aspect-[2.15/1] overflow-hidden bg-[#0b1f4a] sm:aspect-[2.4/1]"
      >
        <MediaPlane
          item={item}
          className="transition duration-700 ease-out group-hover:scale-[1.03]"
        />
        <div
          aria-hidden
          className="absolute inset-0 bg-gradient-to-t from-[#081b45]/85 via-[#081b45]/25 to-transparent"
        />
        <div className="absolute inset-x-0 bottom-0 p-5 sm:p-8">
          <p className="text-[11px] font-semibold tracking-[0.18em] text-[#7fe2de] uppercase">
            {categoryLabel(item.category)}
            {date.full ? ` · ${date.full}` : ""}
          </p>
          <h2 className="mt-2 max-w-3xl font-display text-2xl leading-[1.15] font-semibold tracking-tight text-white sm:text-3xl lg:text-[2.35rem]">
            {item.title}
          </h2>
        </div>
      </LinkWithFrom>

      <div className="grid gap-6 p-5 sm:grid-cols-[1fr_auto] sm:gap-10 sm:p-8">
        <div className="min-w-0">
          {item.content ? (
            <p className="max-w-2xl text-[15px] leading-relaxed text-[#536176]">
              {excerpt(item.content, 260)}
            </p>
          ) : null}
          <LinkWithFrom
            to={`/announcements/${item.id}`}
            className="mt-5 inline-flex items-center gap-1.5 text-sm font-semibold text-primary transition-colors hover:text-[#1e8f97]"
          >
            Continue reading
            <ArrowUpRight className="size-4" />
          </LinkWithFrom>
        </div>
        {item.featured_alumni ? (
          <div className="border-t border-border pt-5 sm:border-t-0 sm:border-l sm:pt-0 sm:pl-8">
            <AlumniCredit alumni={item.featured_alumni} />
          </div>
        ) : null}
      </div>
    </article>
  )
}

function StoryRow({ item }: { item: AnnouncementItem }) {
  const date = formatDate(item.published_at)

  return (
    <article className="group grid gap-4 border-b border-[#e8edf4] py-6 last:border-b-0 sm:grid-cols-[72px_1fr_auto] sm:gap-6 sm:py-7">
      <time
        dateTime={item.published_at ?? undefined}
        className="flex shrink-0 flex-row items-baseline gap-2 sm:flex-col sm:items-start sm:gap-0"
      >
        <span className="font-display text-2xl leading-none font-semibold text-primary">
          {date.day}
        </span>
        <span className="text-[11px] font-semibold tracking-[0.14em] text-[#1e8f97] uppercase">
          {date.month} {date.year}
        </span>
      </time>

      <div className="min-w-0">
        <p className="text-[11px] font-semibold tracking-[0.14em] text-muted-foreground uppercase">
          {categoryLabel(item.category)}
          {relativeTime(item.published_at)
            ? ` · ${relativeTime(item.published_at)}`
            : ""}
        </p>
        <LinkWithFrom
          to={`/announcements/${item.id}`}
          className="mt-1.5 block font-display text-xl leading-snug font-semibold tracking-tight text-primary transition-colors group-hover:text-[#123868]"
        >
          {item.title}
        </LinkWithFrom>
        {item.content ? (
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-[#64748b]">
            {excerpt(item.content, 150)}
          </p>
        ) : null}
        {item.featured_alumni ? (
          <div className="mt-4">
            <AlumniCredit alumni={item.featured_alumni} />
          </div>
        ) : null}
      </div>

      <LinkWithFrom
        to={`/announcements/${item.id}`}
        className="relative hidden overflow-hidden rounded-xl bg-[#0b1f4a] sm:block sm:h-[96px] sm:w-[128px]"
      >
        <MediaPlane
          item={item}
          className="transition duration-500 group-hover:scale-105"
        />
      </LinkWithFrom>
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

  const [featured, ...rest] = items

  return (
    <div className="mx-auto max-w-5xl space-y-8">
      <header className="relative overflow-hidden rounded-2xl bg-[linear-gradient(120deg,#081b45_0%,#173b79_58%,#1e8f97_140%)] px-6 py-8 text-white shadow-[0_18px_50px_rgba(8,27,69,0.16)] sm:px-8 sm:py-10">
        <div
          aria-hidden
          className="absolute -top-16 -right-10 size-56 rounded-full border border-white/10"
        />
        <div
          aria-hidden
          className="absolute -bottom-20 left-1/3 size-64 rounded-full bg-[#36babc]/15 blur-2xl"
        />
        <p className="relative text-[11px] font-semibold tracking-[0.18em] text-[#7fe2de] uppercase">
          University communication
        </p>
        <div className="relative mt-3.5 flex flex-wrap items-end justify-between gap-5">
          <div className="min-w-0 max-w-xl">
            <h1 className="font-display text-3xl font-semibold tracking-tight sm:text-4xl">
              Announcements
            </h1>
            <p className="mt-3 max-w-xl text-sm leading-relaxed text-[#c8d5ed]">
              Official updates from the Alumni Office — events, recognition, and
              campus news in one place.
            </p>
          </div>
          {!loading && !error ? (
            <p className="relative rounded-lg border border-white/15 bg-white/10 px-3.5 py-2.5 text-xs font-semibold tracking-wide text-white/90">
              {items.length} published
            </p>
          ) : null}
        </div>
      </header>

      {loading ? (
        <div className="space-y-6">
          <div className="h-[22rem] animate-pulse rounded-2xl bg-[#e8eef6]" />
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-24 animate-pulse rounded-xl bg-[#e8eef6]" />
            ))}
          </div>
        </div>
      ) : error ? (
        <Card>
          <CardHeader>
            <CardTitle>Announcements unavailable</CardTitle>
            <CardDescription>{error}</CardDescription>
          </CardHeader>
        </Card>
      ) : items.length === 0 ? (
        <div className="flex flex-col items-center rounded-2xl border border-dashed border-[#d5deea] bg-white px-6 py-16 text-center">
          <div className="grid size-14 place-items-center rounded-full bg-[#edf7f7] text-[#087b7e]">
            <Megaphone className="size-6" strokeWidth={1.5} />
          </div>
          <h2 className="mt-5 font-display text-xl font-semibold text-primary">
            Nothing published yet
          </h2>
          <p className="mt-2 max-w-sm text-sm text-muted-foreground">
            When the university shares an update, it will appear here first.
          </p>
        </div>
      ) : (
        <div className="space-y-10">
          {featured ? <FeaturedStory item={featured} /> : null}

          {rest.length > 0 ? (
            <section>
              <div className="mb-1 flex items-baseline justify-between gap-3">
                <h2 className="font-display text-lg font-semibold text-primary">
                  Earlier updates
                </h2>
                <p className="text-xs tracking-wide text-muted-foreground uppercase">
                  Archive
                </p>
              </div>
              <div className="rounded-2xl bg-white px-4 shadow-[0_12px_35px_rgba(8,27,69,0.06)] ring-1 ring-[#e5eaf1] sm:px-6">
                {rest.map((item) => (
                  <StoryRow key={item.id} item={item} />
                ))}
              </div>
            </section>
          ) : null}
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
      <div className="mx-auto h-[32rem] w-full max-w-3xl animate-pulse rounded-2xl bg-[#e8eef6]" />
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

  const date = formatDate(item.published_at)

  return (
    <div className="mx-auto w-full max-w-3xl space-y-5">
      <PageBreadcrumb
        current={item.title}
        fallback={{ label: "Announcements", to: "/announcements" }}
      />

      <article className="overflow-hidden rounded-2xl bg-white shadow-[0_18px_50px_rgba(8,27,69,0.08)] ring-1 ring-[#e5eaf1]">
        <div className="aspect-[2.1/1] overflow-hidden bg-[#0b1f4a]">
          <MediaPlane item={item} />
        </div>
        <div className="space-y-6 px-5 py-7 sm:px-9 sm:py-9">
          <div>
            <p className="text-[11px] font-semibold tracking-[0.16em] text-[#1e8f97] uppercase">
              {categoryLabel(item.category)}
              {date.full ? ` · ${date.full}` : ""}
            </p>
            <h1 className="mt-3 font-display text-3xl leading-tight font-semibold tracking-tight text-primary sm:text-[2.35rem]">
              {item.title}
            </h1>
          </div>

          {item.featured_alumni ? (
            <div className="border-y border-[#eef2f7] py-5">
              <AlumniCredit alumni={item.featured_alumni} />
            </div>
          ) : null}

          {item.content ? (
            <div className="text-[15px] leading-[1.75] whitespace-pre-wrap text-[#334155]">
              {item.content}
            </div>
          ) : null}
        </div>
      </article>
    </div>
  )
}
