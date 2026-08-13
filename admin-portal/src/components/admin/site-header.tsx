import { useLocation } from "react-router-dom"

import { ThemeToggle } from "@/components/theme-toggle"
import { Separator } from "@/components/ui/separator"
import { SidebarTrigger } from "@/components/ui/sidebar"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"

const titles: Record<string, string> = {
  "/": "Dashboard",
  "/registrations": "Registrations",
  "/alumni": "Alumni directory",
  "/announcements": "Announcements",
  "/announcements/new": "New announcement",
  "/events": "Events",
  "/events/new": "New event",
  "/contact-requests": "Contact requests",
}

function getPageTitle(pathname: string) {
  if (pathname.startsWith("/registrations/")) return "Registration detail"
  if (pathname.startsWith("/alumni/")) return "Alumni profile"
  if (pathname.endsWith("/edit") && pathname.startsWith("/announcements/")) {
    return "Edit announcement"
  }
  if (
    pathname.startsWith("/announcements/") &&
    pathname !== "/announcements/new"
  ) {
    return "Announcement detail"
  }
  if (pathname.endsWith("/edit") && pathname.startsWith("/events/")) {
    return "Edit event"
  }
  if (pathname.startsWith("/events/") && pathname !== "/events/new") {
    return "Event detail"
  }
  if (pathname.startsWith("/contact-requests/")) return "Contact request"
  return titles[pathname] ?? "Admin"
}

export function SiteHeader() {
  const { pathname } = useLocation()
  const pageTitle = getPageTitle(pathname)

  return (
    <header className="flex h-14 shrink-0 items-center gap-2 border-b bg-background px-4">
      <SidebarTrigger className="-ml-1" />
      <Separator orientation="vertical" className="mr-2 h-4" />
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink href="/">Admin</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>{pageTitle}</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>
      <div className="ml-auto">
        <ThemeToggle />
      </div>
    </header>
  )
}
