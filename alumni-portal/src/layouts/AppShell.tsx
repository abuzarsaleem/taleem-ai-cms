import { NavLink, Outlet, useNavigate } from "react-router-dom"
import {
  Bell,
  CalendarDays,
  GraduationCap,
  Home,
  IdCard,
  LogOut,
  Megaphone,
  Settings,
  Users,
} from "lucide-react"
import { useState } from "react"

import { useAuth } from "@/auth/AuthContext"
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
      <header className="sticky top-0 z-40 border-b border-border bg-card">
        <div className="mx-auto flex h-[52px] max-w-[1128px] items-center gap-3 px-3 sm:px-4">
          <NavLink
            to="/home"
            className="flex shrink-0 items-center gap-2 outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <div className="flex size-8 items-center justify-center rounded bg-primary text-primary-foreground shadow-sm">
              <GraduationCap className="size-[18px]" />
            </div>
            <span className="hidden font-display text-[15px] font-semibold tracking-tight text-primary sm:inline">
              Taleem
            </span>
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
                            navigate(notificationHref(item))
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
              <PopoverContent align="end" sideOffset={8} className="w-[280px] p-0">
                <div className="border-b border-border p-3">
                  <div className="flex items-center gap-3">
                    {photoUrl ? (
                      <img
                        src={photoUrl}
                        alt=""
                        className="size-12 rounded-full object-cover"
                      />
                    ) : (
                      <div className="flex size-12 items-center justify-center rounded-full bg-primary/12 text-sm font-semibold text-primary">
                        {initials(fullName)}
                      </div>
                    )}
                    <div className="min-w-0">
                      <p className="truncate text-[15px] font-semibold leading-tight">
                        {fullName}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Alumni network
                      </p>
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    className="mt-3 h-8 w-full rounded-full border-primary/40 text-primary hover:bg-primary/5"
                    onClick={() => {
                      setMeOpen(false)
                      navigate("/profile")
                    }}
                  >
                    View Profile
                  </Button>
                </div>
                <div className="py-1">
                  <button
                    type="button"
                    className="flex w-full items-center gap-3 px-3 py-2.5 text-sm hover:bg-muted"
                    onClick={() => {
                      setMeOpen(false)
                      navigate("/card")
                    }}
                  >
                    <IdCard className="size-4 text-muted-foreground" />
                    Alumni card
                  </button>
                  <button
                    type="button"
                    className="flex w-full items-center gap-3 px-3 py-2.5 text-sm hover:bg-muted"
                    onClick={() => {
                      setMeOpen(false)
                      navigate("/profile")
                    }}
                  >
                    <Settings className="size-4 text-muted-foreground" />
                    Settings & Privacy
                  </button>
                </div>
                <div className="border-t border-border py-1">
                  <button
                    type="button"
                    className="flex w-full items-center gap-3 px-3 py-2.5 text-sm hover:bg-muted"
                    onClick={logout}
                  >
                    <LogOut className="size-4 text-muted-foreground" />
                    Sign Out
                  </button>
                </div>
              </PopoverContent>
            </Popover>
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-[1128px] px-2 py-4 sm:px-4 sm:py-6">
        <Outlet />
      </main>
    </div>
  )
}
