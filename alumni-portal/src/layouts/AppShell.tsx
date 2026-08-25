import {
  Bell,
  BookUser,
  CalendarDays,
  ContactRound,
  IdCard,
  LayoutDashboard,
  LogOut,
  Megaphone,
  Settings,
  UserRound,
} from "lucide-react"
import { NavLink, Outlet, useLocation, useNavigate } from "react-router-dom"

import { useAuth } from "@/auth/AuthContext"
import { BrandLogo } from "@/components/brand-logo"
import { ThemeToggle } from "@/components/theme-toggle"
import { useNotifications } from "@/hooks/use-notifications"
import { cn } from "@/lib/utils"

function initials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("")
}

type NavItem = {
  to: string
  label: string
  icon: typeof LayoutDashboard
  end?: boolean
}

const workspaceNav: NavItem[] = [
  { to: "/home", label: "Dashboard", icon: LayoutDashboard, end: true },
  { to: "/profile", label: "My Profile", icon: UserRound },
  { to: "/directory", label: "Directory", icon: BookUser },
  { to: "/contact-requests", label: "My Contacts", icon: ContactRound },
  { to: "/events", label: "Events", icon: CalendarDays },
  { to: "/announcements", label: "Announcements", icon: Megaphone },
]

const identityNav: NavItem[] = [
  { to: "/card", label: "Digital ID", icon: IdCard },
]

const accountNav: NavItem[] = [
  { to: "/notifications", label: "Notifications", icon: Bell },
  { to: "/settings", label: "Settings", icon: Settings },
]

const mobileNav: NavItem[] = [
  { to: "/home", label: "Home", icon: LayoutDashboard, end: true },
  { to: "/directory", label: "Directory", icon: BookUser },
  { to: "/events", label: "Events", icon: CalendarDays },
  { to: "/card", label: "ID", icon: IdCard },
  { to: "/profile", label: "You", icon: UserRound },
]

function SidebarLink({ item, badge }: { item: NavItem; badge?: number }) {
  const Icon = item.icon
  return (
    <NavLink
      to={item.to}
      end={item.end}
      className={({ isActive }) =>
        cn(
          "flex h-9 w-full items-center gap-2.5 rounded-full px-3 text-sm font-medium transition-colors",
          isActive
            ? "bg-sidebar-accent text-white shadow-[inset_3px_0_0_0_var(--sidebar-primary)] hover:bg-sidebar-accent hover:text-white"
            : "text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
        )
      }
    >
      {({ isActive }) => (
        <>
          <Icon
            className={cn(
              "size-4 shrink-0",
              isActive
                ? "text-sidebar-primary"
                : "text-sidebar-foreground/70",
            )}
          />
          <span className="min-w-0 flex-1 truncate">{item.label}</span>
          {badge && badge > 0 ? (
            <span className="rounded-full bg-[#ef5c67] px-1.5 py-0.5 text-[10px] font-bold text-white">
              {badge > 99 ? "99+" : badge}
            </span>
          ) : null}
        </>
      )}
    </NavLink>
  )
}

function NavSection({
  label,
  items,
  unread,
}: {
  label: string
  items: NavItem[]
  unread?: number
}) {
  return (
    <>
      <p className="px-3 pt-4 pb-2 text-[11px] font-semibold tracking-[0.14em] text-sidebar-foreground/55 uppercase">
        {label}
      </p>
      <nav className="flex flex-col gap-0.5">
        {items.map((item) => (
          <SidebarLink
            key={item.to}
            item={item}
            badge={item.to === "/notifications" ? unread : undefined}
          />
        ))}
      </nav>
    </>
  )
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
  const { summary } = useNotifications()
  const unread = summary.unread_count

  function logout() {
    clearSession()
    navigate("/login")
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Sidebar — desktop */}
      <aside className="portal-sidebar fixed inset-y-0 left-0 z-30 hidden w-[248px] flex-col px-3.5 py-5 text-sidebar-foreground md:flex print:hidden">
        <div className="px-0.5 pb-4">
          <NavLink to="/home" className="block outline-none">
            <BrandLogo onDark className="h-[4.75rem] w-auto max-w-full" />
          </NavLink>
        </div>

        <div className="mt-2 flex-1 overflow-y-auto">
          <NavSection label="Workspace" items={workspaceNav} />
          <NavSection label="Identity" items={identityNav} />
          <NavSection
            label="Account"
            items={accountNav}
            unread={unread}
          />
        </div>

        <div className="mt-auto border-t border-sidebar-border pt-4">
          <div className="flex items-center gap-2.5 rounded-[14px] bg-white/8 p-2.5">
            {photoUrl ? (
              <img
                src={photoUrl}
                alt=""
                className="size-9 shrink-0 rounded-full object-cover"
              />
            ) : (
              <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[#d7f4f2] to-[#b8d4ff] text-xs font-extrabold text-[#081b45]">
                {initials(fullName)}
              </div>
            )}
            <div className="min-w-0 flex-1">
              <p className="truncate text-xs font-semibold text-white">
                {fullName.split(/\s+/)[0] ?? fullName}
              </p>
              <p className="text-[11px] text-[#9fb0ce]">Verified Alumni</p>
            </div>
            <button
              type="button"
              onClick={logout}
              className="rounded-lg p-1.5 text-[#9fb0ce] hover:bg-white/10 hover:text-white"
              aria-label="Sign out"
            >
              <LogOut className="size-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* Main column */}
      <div className="md:ml-[248px]">
        <header className="sticky top-0 z-20 flex h-[72px] items-center justify-end gap-4 border-b border-border bg-background/92 px-4 backdrop-blur-xl sm:px-8 print:hidden">
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <button
              type="button"
              onClick={() => navigate("/notifications")}
              className="relative grid size-10 place-items-center rounded-xl border border-border bg-card"
              aria-label="Notifications"
            >
              <Bell className="size-[18px] text-foreground" />
              {unread > 0 ? (
                <span className="absolute top-1.5 right-2 size-2 rounded-full border-2 border-background bg-[#ef5c67]" />
              ) : null}
            </button>
            <button
              type="button"
              onClick={() => navigate("/profile")}
              className="grid size-10 place-items-center overflow-hidden rounded-xl border border-border bg-card"
              aria-label="Profile"
            >
              {photoUrl ? (
                <img
                  src={photoUrl}
                  alt=""
                  className="size-7 rounded-full object-cover"
                />
              ) : (
                <span className="flex size-7 items-center justify-center rounded-full bg-gradient-to-br from-[#d7f4f2] to-[#b8d4ff] text-[10px] font-extrabold text-[#081b45]">
                  {initials(fullName)}
                </span>
              )}
            </button>
          </div>
        </header>

        <main className="mx-auto max-w-[1500px] px-4 pt-8 pb-24 sm:px-8 sm:pt-10 sm:pb-10 md:pb-10">
          <Outlet
            context={{ fullName, photoUrl, pathname: location.pathname }}
          />
        </main>
      </div>

      {/* Mobile bottom nav */}
      <nav className="fixed inset-x-0 bottom-0 z-30 flex h-[68px] items-stretch justify-around border-t border-border bg-background px-2 pb-1 md:hidden print:hidden">
        {mobileNav.map((item) => {
          const Icon = item.icon
          return (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                cn(
                  "flex flex-1 flex-col items-center justify-center gap-0.5 text-[10px]",
                  isActive
                    ? "font-extrabold text-primary"
                    : "font-medium text-muted-foreground",
                )
              }
            >
              <Icon className="size-5" />
              {item.label}
            </NavLink>
          )
        })}
      </nav>
    </div>
  )
}
