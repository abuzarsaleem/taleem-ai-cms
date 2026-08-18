import { Link, useLocation, type LinkProps } from "react-router-dom"
import { ChevronLeft } from "lucide-react"

function labelForPath(path: string) {
  const clean = path.split("?")[0]
  if (clean === "/home" || clean === "/") return "Home"
  if (clean.startsWith("/directory")) return "Directory"
  if (clean.startsWith("/events")) return "Events"
  if (clean.startsWith("/announcements")) return "Announcements"
  if (clean === "/contact-requests") return "My Contacts"
  if (clean === "/profile") return "Profile"
  if (clean === "/card") return "Alumni card"
  return "previous page"
}

export function PageBreadcrumb({
  current,
  fallback,
}: {
  current: string
  fallback: { label: string; to: string }
}) {
  const location = useLocation()
  const from =
    typeof location.state === "object" &&
    location.state &&
    "from" in location.state
      ? String((location.state as { from?: string }).from ?? "")
      : ""
  const parent =
    from && from !== location.pathname
      ? { label: labelForPath(from), to: from }
      : fallback

  return (
    <nav aria-label="Breadcrumb" className="flex flex-wrap items-center gap-3">
      <Link
        to={parent.to}
        className="inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline"
      >
        <ChevronLeft className="size-4" />
        Back to {parent.label}
      </Link>
      <span className="hidden text-muted-foreground sm:inline">/</span>
      <span className="hidden truncate text-sm font-medium text-foreground sm:inline">
        {current}
      </span>
    </nav>
  )
}

export function fromCurrent(pathname: string, search = "") {
  return { from: `${pathname}${search}` }
}

export function LinkWithFrom({
  to,
  state,
  ...props
}: LinkProps) {
  const location = useLocation()
  return (
    <Link
      to={to}
      state={{ ...state, from: `${location.pathname}${location.search}` }}
      {...props}
    />
  )
}
