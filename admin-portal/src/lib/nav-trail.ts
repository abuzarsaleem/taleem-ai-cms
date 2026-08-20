import { useLocation } from "react-router-dom"

export type BreadcrumbItem = {
  label: string
  to?: string
}

export type NavTrailItem = {
  label: string
  to: string
}

export type NavTrailState = {
  fromTrail?: NavTrailItem[]
}

type LocationLike = {
  pathname: string
  search: string
  state?: unknown
}

const SECTIONS: Record<string, { label: string; root: string }> = {
  registrations: { label: "Registrations", root: "/registrations" },
  alumni: { label: "Alumni directory", root: "/alumni" },
  announcements: { label: "Announcements", root: "/announcements" },
  events: { label: "Events", root: "/events" },
  "contact-requests": { label: "Contact requests", root: "/contact-requests" },
}

function detailLabel(section: string) {
  switch (section) {
    case "alumni":
      return "Alumni profile"
    case "registrations":
      return "Registration"
    case "announcements":
      return "Announcement"
    case "events":
      return "Event"
    case "contact-requests":
      return "Contact request"
    default:
      return "Detail"
  }
}

function hrefOf(location: LocationLike) {
  return `${location.pathname}${location.search}`
}

function pathOf(href: string) {
  return href.split("?")[0]
}

function getPathBreadcrumbs(pathname: string): BreadcrumbItem[] {
  if (pathname === "/") {
    return [{ label: "Admin", to: "/" }, { label: "Dashboard" }]
  }

  const segments = pathname.split("/").filter(Boolean)
  const sectionKey = segments[0] ?? ""
  const section = SECTIONS[sectionKey]

  if (!section) {
    return [{ label: "Admin", to: "/" }, { label: "Admin" }]
  }

  const crumbs: BreadcrumbItem[] = [
    { label: "Admin", to: "/" },
    { label: section.label, to: section.root },
  ]

  if (segments.length === 1) {
    crumbs[1] = { label: section.label }
    return crumbs
  }

  if (segments[1] === "new") {
    crumbs.push({
      label: sectionKey === "events" ? "New event" : "New announcement",
    })
    return crumbs
  }

  const id = segments[1]
  const isEdit = segments[2] === "edit"
  const label = detailLabel(sectionKey)

  if (isEdit) {
    crumbs.push({ label, to: `/${sectionKey}/${id}` })
    crumbs.push({ label: `Edit ${label.toLowerCase()}` })
    return crumbs
  }

  crumbs.push({ label })
  return crumbs
}

export function getBreadcrumbs(
  pathname: string,
  fromTrail?: NavTrailItem[],
): BreadcrumbItem[] {
  const pathCrumbs = getPathBreadcrumbs(pathname)
  if (!fromTrail?.length) return pathCrumbs

  const crumbs: BreadcrumbItem[] = []
  const seenPaths = new Set<string>()

  const pushLink = (label: string, to: string) => {
    const path = pathOf(to)
    if (path === pathname) return

    if (path === "/") {
      if (crumbs.some((crumb) => crumb.to && pathOf(crumb.to) === "/" && crumb.label === label)) {
        return
      }
    } else if (seenPaths.has(path)) {
      return
    } else {
      seenPaths.add(path)
    }

    crumbs.push({ label, to })
  }

  pushLink("Admin", "/")

  for (const item of fromTrail) {
    pushLink(item.label, item.to)
  }

  for (const crumb of pathCrumbs.slice(1)) {
    if (!crumb.to) {
      if (crumbs.at(-1)?.label !== crumb.label) {
        crumbs.push({ label: crumb.label })
      }
      continue
    }
    pushLink(crumb.label, crumb.to)
  }

  return crumbs
}

export function withNavTrail<T extends object>(
  location: LocationLike,
  extra?: T,
): T & NavTrailState {
  const existing = (location.state as NavTrailState | null)?.fromTrail ?? []
  const current: NavTrailItem = {
    label: getPathBreadcrumbs(location.pathname).at(-1)?.label ?? "Page",
    to: hrefOf(location),
  }
  const last = existing.at(-1)
  const fromTrail = last?.to === current.to ? existing : [...existing, current]

  return { ...(extra as T), fromTrail }
}

export function trailStateFor(
  location: LocationLike,
  destPath: string,
): NavTrailState {
  const existing = (location.state as NavTrailState | null)?.fromTrail ?? []
  return {
    fromTrail: existing.filter((item) => pathOf(item.to) !== destPath),
  }
}

export function backToFromTrail(fromTrail?: NavTrailItem[], fallback = "/") {
  return fromTrail?.at(-1)?.to ?? fallback
}

export function useBackNavigation(fallback: string) {
  const location = useLocation()
  const fromTrail = (location.state as NavTrailState | null)?.fromTrail ?? []
  const backTo = backToFromTrail(fromTrail, fallback)
  const backState: NavTrailState | undefined =
    fromTrail.length > 1 ? { fromTrail: fromTrail.slice(0, -1) } : undefined

  return { backTo, backState }
}
