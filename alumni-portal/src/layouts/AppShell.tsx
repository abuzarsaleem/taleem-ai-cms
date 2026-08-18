import { NavLink, useLocation, useNavigate } from "react-router-dom"
import {
  Bell,
  CalendarDays,
  ChevronRight,
  Home,
  IdCard,
  LogOut,
  Megaphone,
  Users,
} from "lucide-react"
import { useState } from "react"

import { useAuth } from "@/auth/AuthContext"
import { BrandLogo } from "@/components/brand-logo"
import { PortalRails } from "@/components/portal-rails"
import { ThemeToggle } from "@/components/theme-toggle"
import { Button } from "@/components/ui/button"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { useNotifications } from "@/hooks/use-notifications"
import { cn } from "@/lib/utils"
import type { NotificationItem } from "@/services/notifications.service"

const primaryNav = [
  { to: "/home", label: "Home", icon: Home },
  { to: "/directory", label: "Directory", icon: Users },
  { to: "/events", label: "Events", icon: CalendarDays },
  { to: "/announcements", label: "Announcements", icon: Megaphone },
] as const

function notificationHref(item: NotificationItem) {
  if (item.type === "alumni") return `/directory/${item.id}`
  if (item.type === "event") return `/events/${item.id}`
  return `/announcements/${item.id}`
}

function notificationLabel(item: NotificationItem) {
  if (item.type === "alumni") return `New alumni · ${item.title}`
  if (item.type === "event") return `Event · ${item.title}`
  return `Announcement · ${item.title}`
}

function initials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("")
}

export function AppShell({
  fullName = "Alumni",
  photoUrl,
}: {
  fullName?: string
  photoUrl?: string | null
}) {
  const { clearSession } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [meOpen, setMeOpen] = useState(false)
  const [notifyOpen, setNotifyOpen] = useState(false)
  const { summary, markSeen } = useNotifications()
  const unread = summary.unread_count

  function logout() {
    setMeOpen(false)
    clearSession()
    navigate("/login")
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="sticky top-0 z-40 border-b border-border bg-card print:hidden">
        <div className="mx-auto flex h-14 max-w-[1128px] items-center gap-3 px-3 sm:px-4">
          <NavLink
            to="/home"
            className="flex shrink-0 items-center outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <BrandLogo className="h-9 max-w-[148px] sm:h-10 sm:max-w-[180px]" />
          </NavLink>

          <nav className="mx-auto flex h-full min-w-0 flex-1 items-stretch justify-center md:max-w-[520px]">
            {primaryNav.map((item) => {
              const Icon = item.icon
              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  className={({ isActive }) =>
                    cn(
                      "relative flex min-w-0 flex-1 flex-col items-center justify-center gap-0.5 px-1 text-[11px] font-medium transition-colors",
                      isActive
                        ? "text-foreground"
                        : "text-muted-foreground hover:text-foreground",
                    )
                  }
                >
                  {({ isActive }) => (
                    <>
                      <Icon
                        className="size-5 sm:size-[22px]"
                        strokeWidth={isActive ? 2.25 : 1.75}
                      />
                      <span className="max-w-full truncate leading-none">
                        {item.label}
                      </span>
                      <span
                        aria-hidden
                        className={cn(
                          "absolute inset-x-2 bottom-0 h-[2px] rounded-t-full bg-foreground transition-opacity",
                          isActive ? "opacity-100" : "opacity-0",
                        )}
                      />
                    </>
                  )}
                </NavLink>
              )
            })}
          </nav>

          <div className="flex h-full shrink-0 items-center gap-0.5 border-l border-border pl-2 sm:pl-3">
            <ThemeToggle />
            <Popover
              open={notifyOpen}
              onOpenChange={(open) => {
                setNotifyOpen(open)
                if (open) markSeen()
              }}
            >
              <PopoverTrigger
                render={
                  <Button
                    variant="ghost"
                    size="icon"
                    className="relative size-9 text-muted-foreground"
                    aria-label="Notifications"
                  />
                }
              >
                <Bell className="size-5" />
                {unread > 0 ? (
                  <span className="absolute top-1 right-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-semibold text-white">
                    {unread > 99 ? "99+" : unread}
                  </span>
                ) : null}
              </PopoverTrigger>
              <PopoverContent align="end" sideOffset={8} className="w-[320px] p-0">
                <div className="border-b border-border px-3 py-2.5">
                  <p className="text-sm font-semibold">Notifications</p>
                  <p className="text-xs text-muted-foreground">
                    New alumni, events, and announcements
                  </p>
                </div>
                {summary.items.length === 0 ? (
                  <p className="px-3 py-6 text-center text-sm text-muted-foreground">
                    You’re all caught up
                  </p>
                ) : (
                  <ul className="max-h-80 overflow-y-auto">
                    {summary.items.map((item) => (
                      <li key={`${item.type}-${item.id}`}>
                        <button
                          type="button"
                          className="flex w-full items-start gap-2 px-3 py-2.5 text-left text-sm hover:bg-muted"
                          onClick={() => {
                            setNotifyOpen(false)
                            navigate(notificationHref(item), {
                              state: {
                                from: `${location.pathname}${location.search}`,
                              },
                            })
                          }}
                        >
                          <span className="mt-0.5 text-muted-foreground">
                            {item.type === "alumni" ? (
                              <Users className="size-4" />
                            ) : item.type === "event" ? (
                              <CalendarDays className="size-4" />
                            ) : (
                              <Megaphone className="size-4" />
                            )}
                          </span>
                          <span className="min-w-0 flex-1 leading-snug">
                            {notificationLabel(item)}
                          </span>
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </PopoverContent>
            </Popover>

            <Popover open={meOpen} onOpenChange={setMeOpen}>
              <PopoverTrigger
                render={
                  <button
                    type="button"
                    className="ml-0.5 flex h-full flex-col items-center justify-center gap-0.5 rounded px-1.5 outline-none hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring"
                  />
                }
              >
                {photoUrl ? (
                  <img
                    src={photoUrl}
                    alt=""
                    className="size-6 rounded-full object-cover"
                  />
                ) : (
                  <div className="flex size-6 items-center justify-center rounded-full bg-primary text-[10px] font-semibold text-primary-foreground">
                    {initials(fullName)}
                  </div>
                )}
                <span className="hidden text-[11px] font-medium text-muted-foreground sm:inline">
                  Me
                </span>
              </PopoverTrigger>
              <PopoverContent
                align="end"
                sideOffset={8}
                className="w-[300px] overflow-hidden p-0"
              >
                <div className="h-14 bg-[linear-gradient(105deg,oklch(0.42_0.12_250),oklch(0.48_0.08_220))]" />
                <div className="-mt-8 px-4 pb-4">
                  <div className="flex items-end gap-3">
                    {photoUrl ? (
                      <img
                        src={photoUrl}
                        alt=""
                        className="size-16 rounded-full object-cover ring-2 ring-card"
                      />
                    ) : (
                      <div className="flex size-16 items-center justify-center rounded-full bg-primary text-base font-semibold text-primary-foreground ring-2 ring-card">
                        {initials(fullName)}
                      </div>
                    )}
                    <div className="min-w-0 pb-1">
                      <p className="truncate text-[16px] font-semibold leading-tight">
                        {fullName}
                      </p>
                      <p className="mt-0.5 text-xs text-muted-foreground">
                        Alumni member
                      </p>
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    className="mt-3 h-8 w-full rounded-full border-primary/35 font-medium text-primary hover:bg-primary/8"
                    onClick={() => {
                      setMeOpen(false)
                      navigate("/profile", { state: { openPersonal: true } })
                    }}
                  >
                    View profile
                  </Button>
                </div>
                <div className="border-t border-border px-2 py-2">
                  <button
                    type="button"
                    className="flex w-full items-center gap-3 rounded-lg px-2 py-2 text-sm transition-colors hover:bg-muted"
                    onClick={() => {
                      setMeOpen(false)
                      navigate("/card")
                    }}
                  >
                    <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-violet-500/12 text-violet-600 dark:text-violet-400">
                      <IdCard className="size-4" />
                    </span>
                    <span className="min-w-0 flex-1 text-left font-medium">
                      Alumni card
                    </span>
                    <ChevronRight className="size-4 text-muted-foreground" />
                  </button>
                </div>
                <div className="border-t border-border px-2 py-2">
                  <button
                    type="button"
                    className="flex w-full items-center gap-3 rounded-lg px-2 py-2 text-sm text-destructive transition-colors hover:bg-destructive/8"
                    onClick={logout}
                  >
                    <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-destructive/10">
                      <LogOut className="size-4" />
                    </span>
                    <span className="min-w-0 flex-1 text-left font-medium">
                      Sign out
                    </span>
                  </button>
                </div>
              </PopoverContent>
            </Popover>
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-[1128px] px-2 py-4 sm:px-4 sm:py-6">
        <PortalRails fullName={fullName} photoUrl={photoUrl} />
      </main>
    </div>
  )
}
