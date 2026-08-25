import { useEffect, useState } from "react"
import {
  Bell,
  BookUser,
  CalendarDays,
  ContactRound,
  IdCard,
  LayoutDashboard,
  LogOut,
  Megaphone,
  Menu,
  Settings,
  UserRound,
  X,
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

function SidebarLink({
  item,
  badge,
  onNavigate,
}: {
  item: NavItem
  badge?: number
  onNavigate?: () => void
}) {
  const Icon = item.icon
  return (
    <NavLink
      to={item.to}
      end={item.end}
      onClick={onNavigate}
      className={({ isActive }) =>
        cn(
          "flex h-9 w-full items-center gap-2.5 rounded-md px-3 text-sm font-medium transition-colors",
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
  onNavigate,
}: {
  label: string
  items: NavItem[]
  unread?: number
  onNavigate?: () => void
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
            onNavigate={onNavigate}
          />
        ))}
      </nav>
    </>
  )
}

function SidebarBody({
  fullName,
  photoUrl,
  unread,
  onNavigate,
  onLogout,
}: {
  fullName: string
  photoUrl?: string | null
  unread: number
  onNavigate?: () => void
  onLogout: () => void
}) {
  return (
    <>
      <div className="flex w-full items-center justify-center px-0.5 pb-4">
        <NavLink to="/home" className="block outline-none" onClick={onNavigate}>
          <BrandLogo className="h-[4.75rem] w-auto max-w-full object-contain object-center" />
        </NavLink>
      </div>

      <div className="mt-2 min-h-0 flex-1 overflow-y-auto">
        <NavSection
          label="Workspace"
          items={workspaceNav}
          onNavigate={onNavigate}
        />
        <NavSection
          label="Identity"
          items={identityNav}
          onNavigate={onNavigate}
        />
        <NavSection
          label="Account"
          items={accountNav}
          unread={unread}
          onNavigate={onNavigate}
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
            onClick={onLogout}
            className="rounded-lg p-1.5 text-[#9fb0ce] hover:bg-white/10 hover:text-white"
            aria-label="Sign out"
          >
            <LogOut className="size-4" />
          </button>
        </div>
      </div>
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
  const [mobileOpen, setMobileOpen] = useState(false)

  useEffect(() => {
    setMobileOpen(false)
  }, [location.pathname])

  useEffect(() => {
    if (!mobileOpen) return
    const previous = document.body.style.overflow
    document.body.style.overflow = "hidden"
    return () => {
      document.body.style.overflow = previous
    }
  }, [mobileOpen])

  function logout() {
    clearSession()
    navigate("/login")
  }

  return (
    <div className="min-h-screen overflow-x-hidden bg-background text-foreground">
      {/* Sidebar — desktop */}
      <aside className="portal-sidebar fixed inset-y-0 left-0 z-30 hidden w-[248px] flex-col px-3.5 py-5 text-sidebar-foreground md:flex print:hidden">
        <SidebarBody
          fullName={fullName}
          photoUrl={photoUrl}
          unread={unread}
          onLogout={logout}
        />
      </aside>

      {/* Sidebar — mobile drawer */}
      <div
        className={cn(
          "fixed inset-0 z-40 md:hidden print:hidden",
          mobileOpen ? "pointer-events-auto" : "pointer-events-none",
        )}
      >
        <button
          type="button"
          aria-label="Close menu"
          className={cn(
            "absolute inset-0 bg-black/45 transition-opacity duration-200 supports-backdrop-filter:backdrop-blur-[2px]",
            mobileOpen ? "opacity-100" : "opacity-0",
          )}
          onClick={() => setMobileOpen(false)}
        />
        <aside
          className={cn(
            "portal-sidebar absolute inset-y-0 left-0 flex w-[min(18rem,86vw)] flex-col px-3.5 py-5 text-sidebar-foreground shadow-2xl transition-transform duration-200 ease-out",
            mobileOpen ? "translate-x-0" : "-translate-x-full",
          )}
          aria-hidden={!mobileOpen}
        >
          <button
            type="button"
            onClick={() => setMobileOpen(false)}
            className="absolute top-3 right-3 grid size-8 place-items-center rounded-lg text-sidebar-foreground/70 hover:bg-white/10 hover:text-white"
            aria-label="Close sidebar"
          >
            <X className="size-4" />
          </button>
          <SidebarBody
            fullName={fullName}
            photoUrl={photoUrl}
            unread={unread}
            onNavigate={() => setMobileOpen(false)}
            onLogout={logout}
          />
        </aside>
      </div>

      {/* Main column */}
      <div className="min-w-0 md:ml-[248px]">
        <header className="sticky top-0 z-20 flex h-[72px] items-center justify-between gap-4 border-b border-border bg-background/92 px-4 backdrop-blur-xl sm:px-8 print:hidden">
          <button
            type="button"
            onClick={() => setMobileOpen(true)}
            className="grid size-10 place-items-center rounded-xl border border-border bg-card md:hidden"
            aria-label="Open menu"
          >
            <Menu className="size-[18px] text-foreground" />
          </button>

          <div className="ml-auto flex items-center gap-2">
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

        <main className="mx-auto min-w-0 max-w-[1500px] overflow-x-hidden px-4 pt-8 pb-10 sm:px-8 sm:pt-10">
          <Outlet
            context={{ fullName, photoUrl, pathname: location.pathname }}
          />
        </main>
      </div>
    </div>
  )
}
