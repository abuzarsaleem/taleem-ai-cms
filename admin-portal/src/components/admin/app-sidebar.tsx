import { useEffect, useState } from "react"
import { NavLink, useLocation, useNavigate } from "react-router-dom"
import {
  BookUserIcon,
  CalendarDaysIcon,
  ClipboardListIcon,
  GraduationCapIcon,
  LayoutDashboardIcon,
  LogOutIcon,
  MailIcon,
  MegaphoneIcon,
  type LucideIcon,
} from "lucide-react"

import { useAuth } from "@/auth/AuthContext"
import { ConfirmDialog } from "@/components/admin/confirm-dialog"
import { toast } from "sonner"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
  SidebarSeparator,
  useSidebar,
} from "@/components/ui/sidebar"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { cn } from "@/lib/utils"

type NavItem = {
  title: string
  to: string
  icon: LucideIcon
  end?: boolean
}

const overviewItems: NavItem[] = [
  {
    title: "Dashboard",
    to: "/",
    icon: LayoutDashboardIcon,
    end: true,
  },
]

const peopleItems: NavItem[] = [
  {
    title: "Registrations",
    to: "/registrations",
    icon: ClipboardListIcon,
  },
  {
    title: "Alumni directory",
    to: "/alumni",
    icon: BookUserIcon,
  },
  {
    title: "Contact requests",
    to: "/contact-requests",
    icon: MailIcon,
  },
]

const contentItems: NavItem[] = [
  {
    title: "Announcements",
    to: "/announcements",
    icon: MegaphoneIcon,
  },
  {
    title: "Events",
    to: "/events",
    icon: CalendarDaysIcon,
  },
]

function isItemActive(pathname: string, item: NavItem) {
  return item.end
    ? pathname === item.to
    : pathname === item.to || pathname.startsWith(`${item.to}/`)
}

function NavGroup({
  label,
  items,
  pathname,
}: {
  label: string
  items: NavItem[]
  pathname: string
}) {
  const { isMobile, setOpenMobile } = useSidebar()

  return (
    <SidebarGroup className="px-2 py-1">
      <SidebarGroupLabel className="px-2 text-[11px] font-semibold tracking-[0.14em] text-sidebar-foreground/55 uppercase">
        {label}
      </SidebarGroupLabel>
      <SidebarGroupContent>
        <SidebarMenu className="gap-0.5">
          {items.map((item) => {
            const active = isItemActive(pathname, item)

            return (
              <SidebarMenuItem key={item.to}>
                <SidebarMenuButton
                  isActive={active}
                  tooltip={item.title}
                  className={cn(
                    "h-9 rounded-lg px-2.5 font-medium text-sidebar-foreground/80",
                    "hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                    active &&
                      "bg-sidebar-accent text-white shadow-[inset_3px_0_0_0_var(--sidebar-primary)] hover:bg-sidebar-accent hover:text-white",
                  )}
                  render={<NavLink to={item.to} end={item.end} />}
                  onClick={() => {
                    if (isMobile) setOpenMobile(false)
                  }}
                >
                  <item.icon
                    className={cn(
                      "size-4",
                      active ? "text-sidebar-primary" : "text-sidebar-foreground/70",
                    )}
                  />
                  <span>{item.title}</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            )
          })}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  )
}

function roleLabel(role: string | null) {
  if (!role) return "Administrator"
  return role
    .toLowerCase()
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ")
}

export function AppSidebar() {
  const location = useLocation()
  const navigate = useNavigate()
  const { isMobile, setOpenMobile } = useSidebar()
  const { role, clearSession } = useAuth()
  const displayRole = roleLabel(role)
  const [confirmLogout, setConfirmLogout] = useState(false)

  useEffect(() => {
    if (isMobile) setOpenMobile(false)
  }, [location.pathname, location.search, isMobile, setOpenMobile])

  function handleLogout() {
    clearSession()
    toast.success("Signed out")
    navigate("/login", { replace: true })
  }

  return (
    <>
    <Sidebar collapsible="icon" className="border-r border-sidebar-border/80">
      <SidebarHeader className="p-3 pb-2">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              size="lg"
              className="h-12 rounded-xl px-2 hover:bg-transparent data-active:bg-transparent"
              render={<div />}
            >
              <div className="flex size-9 items-center justify-center rounded-xl bg-sidebar-primary text-[#042a2a] shadow-[0_0_16px_rgb(0_194_178_/_0.45)]">
                <GraduationCapIcon className="size-4" />
              </div>
              <div className="grid min-w-0 flex-1 text-left leading-tight">
                <span className="truncate font-semibold tracking-tight text-white">
                  Taleem AI
                </span>
                <span className="truncate text-[11px] text-sidebar-foreground/65">
                  Alumni admin
                </span>
              </div>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarSeparator className="mx-3" />

      <SidebarContent className="gap-1 pt-1">
        <NavGroup
          label="Overview"
          items={overviewItems}
          pathname={location.pathname}
        />
        <NavGroup
          label="People"
          items={peopleItems}
          pathname={location.pathname}
        />
        <NavGroup
          label="Content"
          items={contentItems}
          pathname={location.pathname}
        />
      </SidebarContent>

      <SidebarFooter className="p-3 pt-1">
        <SidebarMenu>
          <SidebarMenuItem>
            <div className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 p-2 group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:border-0 group-data-[collapsible=icon]:bg-transparent group-data-[collapsible=icon]:p-0">
              <Avatar className="size-8 rounded-lg">
                <AvatarFallback className="rounded-lg bg-sidebar-primary text-xs font-semibold text-[#042a2a]">
                  AD
                </AvatarFallback>
              </Avatar>
              <div className="grid min-w-0 flex-1 text-left leading-tight group-data-[collapsible=icon]:hidden">
                <span className="truncate text-sm font-medium text-white">Admin</span>
                <span className="truncate text-[11px] text-sidebar-foreground/65">
                  {displayRole}
                </span>
              </div>
            </div>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton
              tooltip="Logout"
              className="h-9 rounded-lg px-2.5 font-medium text-sidebar-foreground/80 hover:bg-white/8 hover:text-white"
              onClick={() => setConfirmLogout(true)}
            >
              <LogOutIcon className="size-4" />
              <span>Logout</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
    <ConfirmDialog
      open={confirmLogout}
      title="Log out"
      description="Are you sure you want to log out of the admin console?"
      confirmLabel="Log out"
      variant="destructive"
      onOpenChange={setConfirmLogout}
      onConfirm={handleLogout}
    />
    </>
  )
}
