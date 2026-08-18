import { useEffect, useState } from "react"
import { Link, useLocation } from "react-router-dom"
import {
  ArrowUpRightIcon,
  CalendarCheckIcon,
  CalendarDaysIcon,
  CalendarPlusIcon,
  CalendarXIcon,
  ClipboardListIcon,
  MailIcon,
  MegaphoneIcon,
  PlusIcon,
  UserXIcon,
  UsersIcon,
  type LucideIcon,
} from "lucide-react"

import { useAuth } from "@/auth/AuthContext"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { ApiError } from "@/lib/api"
import { withNavTrail } from "@/lib/nav-trail"
import { cn } from "@/lib/utils"
import {
  dashboardService,
  type AdminDashboard,
  type DashboardAnnouncement,
} from "@/services/dashboard.service"

function formatCount(value: number) {
  return new Intl.NumberFormat().format(value)
}

function formatDate(value: string | null) {
  if (!value) return "—"
  return new Intl.DateTimeFormat(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(value))
}

function formatLongDate(value = new Date()) {
  return new Intl.DateTimeFormat(undefined, {
    weekday: "long",
    month: "long",
    day: "numeric",
  }).format(value)
}

function categoryLabel(category: string) {
  return category
    .toLowerCase()
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ")
}

function greeting() {
  const hour = new Date().getHours()
  if (hour < 12) return "Good morning"
  if (hour < 17) return "Good afternoon"
  return "Good evening"
}

function DashboardSkeleton() {
  return (
    <div className="flex flex-1 flex-col gap-5 py-4 md:gap-6 md:py-6">
      <div className="px-4 lg:px-6">
        <Skeleton className="h-40 w-full rounded-2xl" />
      </div>
      <div className="grid gap-4 px-4 sm:grid-cols-2 lg:grid-cols-4 lg:px-6">
        {Array.from({ length: 4 }).map((_, index) => (
          <Skeleton key={index} className="h-32 rounded-2xl" />
        ))}
      </div>
      <div className="grid gap-4 px-4 lg:grid-cols-3 lg:px-6">
        <Skeleton className="h-72 rounded-2xl" />
        <Skeleton className="h-72 rounded-2xl lg:col-span-2" />
      </div>
    </div>
  )
}

function StatCard({
  title,
  value,
  hint,
  icon: Icon,
  to,
  tone = "navy",
}: {
  title: string
  value: number
  hint: string
  icon: LucideIcon
  to?: string
  tone?: "navy" | "cyan" | "amber" | "rose"
}) {
  const location = useLocation()
  const tones = {
    navy: "bg-[#081b45]/8 text-[#081b45] dark:bg-white/8 dark:text-white",
    cyan: "bg-[#00c2b2]/15 text-[#0a7d73] dark:bg-[#00c2b2]/15 dark:text-[#7ef0e6]",
    amber: "bg-amber-500/12 text-amber-700 dark:text-amber-300",
    rose: "bg-rose-500/12 text-rose-700 dark:text-rose-300",
  }

  const content = (
    <Card
      size="sm"
      className={cn(
        "h-full transition-shadow",
        to && "hover:shadow-[0_8px_24px_rgb(8_27_69_/_0.08)]",
      )}
    >
      <CardHeader className="gap-3">
        <div className="flex items-start justify-between gap-3">
          <CardDescription className="text-[11px] font-semibold tracking-[0.12em] text-muted-foreground uppercase">
            {title}
          </CardDescription>
          <span
            className={cn(
              "flex size-9 items-center justify-center rounded-xl",
              tones[tone],
            )}
          >
            <Icon className="size-4" />
          </span>
        </div>
        <CardTitle className="text-3xl font-semibold tracking-tight tabular-nums">
          {formatCount(value)}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-xs text-muted-foreground">{hint}</p>
      </CardContent>
    </Card>
  )

  if (!to) return content
  return (
    <Link to={to} state={withNavTrail(location)} className="block outline-none">
      {content}
    </Link>
  )
}

function AnnouncementItem({ item }: { item: DashboardAnnouncement }) {
  const location = useLocation()
  return (
    <Link
      to={`/announcements/${item.id}`}
      state={withNavTrail(location)}
      className="flex gap-3 rounded-xl border border-border/80 bg-background/60 p-3.5 transition-colors hover:border-[#00c2b2]/40 hover:bg-[#00c2b2]/5"
    >
      <div className="mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-lg bg-[#081b45]/8 text-[#081b45] dark:bg-white/8 dark:text-white">
        <MegaphoneIcon className="size-4" />
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-2">
          <p className="truncate text-sm font-medium">{item.title}</p>
          <Badge variant="outline" className="shrink-0 font-normal">
            {categoryLabel(item.category)}
          </Badge>
        </div>
        {item.content ? (
          <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-muted-foreground">
            {item.content}
          </p>
        ) : null}
        <p className="mt-2 text-[11px] tracking-wide text-muted-foreground uppercase">
          {formatDate(item.published_at)}
        </p>
      </div>
    </Link>
  )
}

export default function DashboardPage() {
  const { token } = useAuth()
  const location = useLocation()
  const [data, setData] = useState<AdminDashboard | null>(null)
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!token) return

    let cancelled = false

    void (async () => {
      setLoading(true)
      setError("")
      try {
        const result = await dashboardService.getDashboard(token)
        if (!cancelled) setData(result)
      } catch (err) {
        if (!cancelled) {
          setError(
            err instanceof ApiError ? err.message : "Failed to load dashboard",
          )
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()

    return () => {
      cancelled = true
    }
  }, [token])

  if (loading) return <DashboardSkeleton />

  if (error || !data) {
    return (
      <div className="flex flex-1 flex-col gap-4 py-4 md:py-6">
        <div className="px-4 lg:px-6">
          <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
          <p className="mt-2 text-sm text-destructive">
            {error || "Failed to load dashboard"}
          </p>
        </div>
      </div>
    )
  }

  const attentionItems = [
    {
      title: "Pending registrations",
      value: data.pending_registrations_count,
      to: "/registrations?status=PENDING",
      icon: ClipboardListIcon,
    },
    {
      title: "Contact requests",
      value: data.pending_contact_requests_count,
      to: "/contact-requests",
      icon: MailIcon,
    },
  ]
  const attentionTotal =
    data.pending_registrations_count + data.pending_contact_requests_count

  const eventStats = [
    {
      title: "Published",
      value: data.published_events_count,
      icon: CalendarDaysIcon,
    },
    {
      title: "Active",
      value: data.active_events_count,
      icon: CalendarCheckIcon,
    },
    {
      title: "Completed",
      value: data.completed_events_count,
      icon: CalendarXIcon,
    },
  ]
  const eventTotal =
    data.published_events_count +
    data.active_events_count +
    data.completed_events_count

  return (
    <div className="flex flex-1 flex-col gap-5 py-4 md:gap-6 md:py-6">
      <div className="px-4 lg:px-6">
        <section className="relative overflow-hidden rounded-2xl bg-[#081b45] px-5 py-6 text-white shadow-[0_18px_40px_rgb(8_27_69_/_0.18)] sm:px-7 sm:py-7">
          <div className="pointer-events-none absolute -top-16 right-0 size-56 rounded-full bg-[#00c2b2]/25 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-20 left-1/3 size-48 rounded-full bg-[#47bfff]/20 blur-3xl" />
          <div className="relative flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-xl">
              <p className="text-[11px] font-semibold tracking-[0.18em] text-[#00c2b2] uppercase">
                Taleem AI · Admin
              </p>
              <h1 className="mt-2 text-2xl font-semibold tracking-tight sm:text-3xl">
                {greeting()}
              </h1>
        
              <p className="mt-3 text-xs text-white/50">{formatLongDate()}</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button
                size="sm"
                className="bg-[#00c2b2] text-[#042a2a] hover:bg-[#00d4c2]"
                render={
                  <Link
                    to="/registrations?status=PENDING"
                    state={withNavTrail(location)}
                  />
                }
              >
                Review queue
                <ArrowUpRightIcon />
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="border-white/20 bg-white/5 text-white hover:bg-white/10 hover:text-white"
                render={
                  <Link
                    to="/announcements/new"
                    state={withNavTrail(location)}
                  />
                }
              >
                <PlusIcon />
                Announcement
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="border-white/20 bg-white/5 text-white hover:bg-white/10 hover:text-white"
                render={
                  <Link to="/events/new" state={withNavTrail(location)} />
                }
              >
                <CalendarPlusIcon />
                Event
              </Button>
            </div>
          </div>
        </section>
      </div>

      <div className="grid gap-4 px-4 sm:grid-cols-2 lg:grid-cols-4 lg:px-6">
        <StatCard
          title="Total alumni"
          value={data.alumni_count}
          hint="Active alumni in the directory"
          icon={UsersIcon}
          to="/alumni"
          tone="navy"
        />
        <StatCard
          title="Pending registrations"
          value={data.pending_registrations_count}
          hint="Awaiting admin review"
          icon={ClipboardListIcon}
          to="/registrations?status=PENDING"
          tone="amber"
        />
        <StatCard
          title="Contact requests"
          value={data.pending_contact_requests_count}
          hint="Alumni introductions to review"
          icon={MailIcon}
          to="/contact-requests"
          tone="cyan"
        />
        <StatCard
          title="Rejected requests"
          value={data.rejected_requests_count}
          hint="Declined registration requests"
          icon={UserXIcon}
          tone="rose"
        />
      </div>

      <div className="grid gap-4 px-4 lg:grid-cols-3 lg:px-6">
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle>Needs attention</CardTitle>
            <CardDescription>
              {attentionTotal
                ? "Work waiting on the admin team"
                : "No pending reviews right now"}
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-2.5">
            {attentionItems.map((item) => (
              <Link
                key={item.title}
                to={item.to}
                state={withNavTrail(location)}
                className="flex items-center justify-between rounded-xl border border-border/80 px-3 py-3 transition-colors hover:border-[#00c2b2]/40 hover:bg-[#00c2b2]/5"
              >
                <div className="flex items-center gap-3">
                  <span className="flex size-9 items-center justify-center rounded-lg bg-[#081b45]/8 text-[#081b45] dark:bg-white/8 dark:text-white">
                    <item.icon className="size-4" />
                  </span>
                  <span className="text-sm font-medium">{item.title}</span>
                </div>
                <span
                  className={cn(
                    "rounded-full px-2 py-0.5 text-xs font-semibold tabular-nums",
                    item.value > 0
                      ? "bg-[#00c2b2]/15 text-[#0a7d73]"
                      : "bg-muted text-muted-foreground",
                  )}
                >
                  {formatCount(item.value)}
                </span>
              </Link>
            ))}
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-start justify-between gap-2">
            <div>
              <CardTitle>Events</CardTitle>
              <CardDescription>
                Published, live, and completed programmes
              </CardDescription>
            </div>
            <Button
              variant="outline"
              size="sm"
              render={<Link to="/events" state={withNavTrail(location)} />}
            >
              View all
              <ArrowUpRightIcon />
            </Button>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            {eventStats.map((stat) => {
              const pct = eventTotal
                ? Math.round((stat.value / eventTotal) * 100)
                : 0
              return (
                <div
                  key={stat.title}
                  className="rounded-xl border border-border/80 p-3.5"
                >
                  <div className="mb-2 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <stat.icon className="size-4 text-[#00c2b2]" />
                      <span className="text-sm font-medium">{stat.title}</span>
                    </div>
                    <span className="text-sm font-semibold tabular-nums">
                      {formatCount(stat.value)}
                    </span>
                  </div>
                  <div className="h-1.5 overflow-hidden rounded-full bg-muted">
                    <div
                      className="h-full rounded-full bg-[#00c2b2]"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              )
            })}
          </CardContent>
        </Card>
      </div>

      <div className="px-4 lg:px-6">
        <Card>
          <CardHeader className="flex flex-row items-start justify-between gap-2">
            <div>
              <CardTitle>Latest announcements</CardTitle>
              <CardDescription>
                Recently published updates for alumni
              </CardDescription>
            </div>
            <Button
              variant="outline"
              size="sm"
              render={
                <Link to="/announcements" state={withNavTrail(location)} />
              }
            >
              Open announcements
              <ArrowUpRightIcon />
            </Button>
          </CardHeader>
          <CardContent className="flex flex-col gap-2.5">
            {data.latest_announcements.length ? (
              data.latest_announcements.map((item) => (
                <AnnouncementItem key={item.id} item={item} />
              ))
            ) : (
              <p className="py-8 text-center text-sm text-muted-foreground">
                No announcements published yet.
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
