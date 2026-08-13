import { useEffect, useState } from "react"
import { Link } from "react-router-dom"
import {
  ArrowUpRightIcon,
  CalendarCheckIcon,
  CalendarDaysIcon,
  CalendarXIcon,
  ClipboardListIcon,
  MailIcon,
  MegaphoneIcon,
  UserXIcon,
  UsersIcon,
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

function categoryLabel(category: string) {
  return category
    .toLowerCase()
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ")
}

function DashboardSkeleton() {
  return (
    <div className="flex flex-1 flex-col gap-4 py-4 md:gap-6 md:py-6">
      <div className="flex flex-col gap-2 px-4 lg:px-6">
        <Skeleton className="h-8 w-40" />
        <Skeleton className="h-4 w-72" />
      </div>
      <div className="grid gap-4 px-4 sm:grid-cols-2 lg:grid-cols-4 lg:px-6">
        {Array.from({ length: 4 }).map((_, index) => (
          <Card key={index} size="sm">
            <CardHeader>
              <Skeleton className="h-4 w-28" />
              <Skeleton className="h-8 w-16" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-3 w-24" />
            </CardContent>
          </Card>
        ))}
      </div>
      <div className="grid gap-4 px-4 lg:grid-cols-3 lg:px-6">
        <Card className="lg:col-span-1">
          <CardHeader>
            <Skeleton className="h-5 w-32" />
            <Skeleton className="h-4 w-48" />
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            {Array.from({ length: 3 }).map((_, index) => (
              <Skeleton key={index} className="h-16 w-full" />
            ))}
          </CardContent>
        </Card>
        <Card className="lg:col-span-2">
          <CardHeader>
            <Skeleton className="h-5 w-44" />
            <Skeleton className="h-4 w-56" />
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            {Array.from({ length: 4 }).map((_, index) => (
              <Skeleton key={index} className="h-20 w-full" />
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

function AnnouncementItem({ item }: { item: DashboardAnnouncement }) {
  return (
    <div className="flex flex-col gap-2 rounded-lg border p-3">
      <div className="flex items-start justify-between gap-2">
        <p className="text-sm font-medium leading-snug">{item.title}</p>
        <Badge variant="outline">{categoryLabel(item.category)}</Badge>
      </div>
      {item.content ? (
        <p className="line-clamp-2 text-xs text-muted-foreground">
          {item.content}
        </p>
      ) : null}
      <p className="text-xs text-muted-foreground">
        {formatDate(item.published_at)}
      </p>
    </div>
  )
}

export default function DashboardPage() {
  const { token } = useAuth()
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

  const primaryStats = [
    {
      title: "Total alumni",
      value: data.alumni_count,
      hint: "Registered alumni accounts",
      icon: UsersIcon,
    },
    {
      title: "Pending registrations",
      value: data.pending_registrations_count,
      hint: "Awaiting admin review",
      icon: ClipboardListIcon,
    },
    {
      title: "Rejected requests",
      value: data.rejected_requests_count,
      hint: "Registration requests declined",
      icon: UserXIcon,
    },
    {
      title: "Pending contact requests",
      value: data.pending_contact_requests_count,
      hint: "Awaiting contact review",
      icon: MailIcon,
    },
  ]

  const eventStats = [
    {
      title: "Published events",
      value: data.published_events_count,
      icon: CalendarDaysIcon,
    },
    {
      title: "Active events",
      value: data.active_events_count,
      icon: CalendarCheckIcon,
    },
    {
      title: "Completed events",
      value: data.completed_events_count,
      icon: CalendarXIcon,
    },
  ]

  return (
    <div className="flex flex-1 flex-col gap-4 py-4 md:gap-6 md:py-6">
      <div className="flex flex-col gap-2 px-4 lg:px-6">
        <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">
          Overview of alumni activity and pending actions.
        </p>
      </div>

      <div className="grid gap-4 px-4 sm:grid-cols-2 lg:grid-cols-4 lg:px-6">
        {primaryStats.map((stat) => (
          <Card key={stat.title} size="sm">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardDescription>{stat.title}</CardDescription>
                <stat.icon className="size-4 text-muted-foreground" />
              </div>
              <CardTitle className="text-2xl font-semibold tabular-nums">
                {formatCount(stat.value)}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-xs text-muted-foreground">{stat.hint}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-4 px-4 lg:grid-cols-3 lg:px-6">
        <Card>
          <CardHeader>
            <CardTitle>Events</CardTitle>
            <CardDescription>Published, active, and completed</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            {eventStats.map((stat) => (
              <div
                key={stat.title}
                className="flex items-center justify-between rounded-lg border p-3"
              >
                <div className="flex items-center gap-2">
                  <stat.icon className="size-4 text-muted-foreground" />
                  <span className="text-sm">{stat.title}</span>
                </div>
                <span className="text-sm font-semibold tabular-nums">
                  {formatCount(stat.value)}
                </span>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between gap-2">
            <div>
              <CardTitle className="flex items-center gap-2">
                <MegaphoneIcon className="size-4" />
                Latest announcements
              </CardTitle>
              <CardDescription>
                Recently published updates for alumni
              </CardDescription>
            </div>
            {data.pending_registrations_count > 0 ? (
              <Button
                variant="outline"
                size="sm"
                render={<Link to="/registrations?status=PENDING" />}
              >
                Review registrations
                <ArrowUpRightIcon />
              </Button>
            ) : null}
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            {data.latest_announcements.length ? (
              data.latest_announcements.map((item) => (
                <AnnouncementItem key={item.id} item={item} />
              ))
            ) : (
              <p className="text-sm text-muted-foreground">
                No announcements published yet.
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
